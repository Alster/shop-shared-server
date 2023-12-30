import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import * as assert from "assert";
import { Connection, FilterQuery, Model } from "mongoose";

import { doExchange } from "../../../shop-exchange-shared/doExchange";
import { ExchangeState } from "../../../shop-exchange-shared/helpers";
import { ORDER_STATUS, OrderStatus } from "../../../shop-shared/constants/order";
import { CreateOrderDto } from "../../../shop-shared/dto/order/createOrder.dto";
import { MoneySmall } from "../../../shop-shared/dto/primitiveTypes";
import { ProductItemDto } from "../../../shop-shared/dto/product/product.dto";
import { PublicError } from "../../helpers/publicError";
import { Order, OrderDocument } from "../../schema/order.schema";
import { Product, ProductDocument } from "../../schema/product.schema";

@Injectable()
export class OrderService {
	private logger: Logger = new Logger(OrderService.name);

	constructor(
		@InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,
		@InjectConnection() private readonly connection: Connection,
	) {}

	async getOrder(id: string): Promise<OrderDocument | null> {
		return this.orderModel.findById(id).exec();
	}

	public async find(
		query: FilterQuery<OrderDocument>,
		sort: any,
		skip: number,
		limit: number,
	): Promise<{
		orders: OrderDocument[];
		total: number;
	}> {
		console.log("Query:", JSON.stringify(query, undefined, 2));
		console.log("Sort:", JSON.stringify(sort, undefined, 2));

		const [orders, totalCount] = await Promise.all([
			this.orderModel
				// eslint-disable-next-line unicorn/no-array-callback-reference
				.find(query)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.exec(),

			this.orderModel.countDocuments(query),
		]);

		return {
			orders: orders,
			total: totalCount,
		};
	}

	async createOrder(
		createOrderData: CreateOrderDto,
		exchangeState: ExchangeState,
	): Promise<[OrderDocument, MoneySmall, ProductDocument[]]> {
		this.logger.log("createOrder", createOrderData);

		assert.ok(createOrderData.itemsData.length > 0, new PublicError("NO_ITEMS"));

		const session = await this.connection.startSession();

		let orderCreationResult: OrderDocument[] | undefined;
		let error: Error | undefined;
		let totalPrice: MoneySmall = 0;
		let products: ProductDocument[] = [];
		let actualizedItemData: ProductItemDto[] = [];

		try {
			await session.withTransaction(async () => {
				products = await this.productModel
					.find({
						_id: {
							$in: createOrderData.itemsData.map((item) => item.productId),
						},
					})
					.session(session);
				const productsMap = Object.fromEntries(
					products.map((product) => [product._id.toString(), product]),
				);

				actualizedItemData = createOrderData.itemsData.map((itemData) => {
					const product = productsMap[itemData.productId];
					assert.ok(
						product,
						new Error(`Product with id ${itemData.productId} not found`),
					);

					const foundItem = product.items.find((item) => item.sku === itemData.sku);
					assert.ok(
						foundItem,
						new NotFoundException(
							`Item not found: "${JSON.stringify(itemData, null, 2)}"`,
						),
					);

					const index = product.items.indexOf(foundItem);
					product.items.splice(index, 1);

					return foundItem;
				});

				for (const product of products) {
					product.markModified("items");
					await product.save({ session });
				}

				totalPrice = products.reduce((accumulator, product) => {
					const exchanged = doExchange(
						product.currency,
						createOrderData.currency,
						product.price,
						exchangeState,
					);
					accumulator += exchanged as number;
					return accumulator;
				}, 0);

				orderCreationResult = await this.orderModel.create(
					[
						{
							firstName: createOrderData.firstName,
							lastName: createOrderData.lastName,
							phoneNumber: createOrderData.phoneNumber,
							itemsData: actualizedItemData,
							delivery: createOrderData.delivery,
							totalPrice: Math.round(totalPrice),
							currency: createOrderData.currency,
							status: ORDER_STATUS.CREATED,
							createDate: new Date(),
						},
					],
					{ session },
				);
			});
		} catch (error_: unknown) {
			error = error_ as Error;
		} finally {
			await session.endSession();
		}
		if (error) {
			throw error;
		}

		const createdOrder = (orderCreationResult ?? []).pop();
		assert.ok(createdOrder, new Error("Impossible error"));

		return [createdOrder, totalPrice, products];
	}

	async updateOrderStatus(
		id: string,
		status: OrderStatus,
		additionalData?: unknown,
	): Promise<OrderDocument> {
		const now = new Date();
		await this.orderModel.updateOne(
			{ _id: id },
			{
				status: status,
				lastStatusUpdateDate: now,
				$push: {
					statusHistory: {
						status: status,
						date: now,
						additionalData: additionalData,
					},
				},
			},
		);

		const order = await this.getOrder(id);
		assert.ok(order, new NotFoundException());

		if (status === ORDER_STATUS.FAILED && order.isItemsReturned === false) {
			await this.returnItems(id);
		}

		return order;
	}

	async returnItems(id: string): Promise<void> {
		const session = await this.connection.startSession();

		try {
			await session.withTransaction(async () => {
				const order = await this.orderModel.findById(id).session(session);
				assert.ok(order, new NotFoundException());

				if (order.isItemsReturned) {
					return;
				}

				assert.ok(
					order.status === ORDER_STATUS.FAILED,
					new PublicError("ORDER_STATUS_NOT_FAILED"),
				);

				for (const { productId, ...item } of order.itemsData) {
					const product = await this.productModel.findById(productId).session(session);
					assert.ok(product, new NotFoundException());

					product.items.push(item);
					product.markModified("items");
					await product.save({ session });
				}
				await this.orderModel
					.updateOne({ _id: order._id }, { isItemsReturned: true })
					.session(session);
			});
		} catch (error: unknown) {
			this.logger.error(error);
			if (error instanceof Error) {
				this.logger.error(error.stack);
			}
		} finally {
			await session.endSession();
		}
	}

	async setInvoice(id: string, invoiceId: string): Promise<void> {
		await this.orderModel.updateOne({ _id: id }, { invoiceId: invoiceId });
	}

	async getOrderByInvoiceId(invoiceId: string): Promise<OrderDocument | null> {
		return this.orderModel.findOne({ invoiceId: invoiceId }).exec();
	}

	async cancelOrder(id: string): Promise<void> {
		const order = await this.getOrder(id);
		assert.ok(order, new NotFoundException());

		assert.ok(
			!([ORDER_STATUS.FINISHED, ORDER_STATUS.FAILED] as OrderStatus[]).includes(order.status),
			new PublicError("ORDER_ALREADY_FINISHED"),
		);
		assert.ok(order.status !== ORDER_STATUS.PAID, new PublicError("ORDER_ALREADY_PAID"));

		await this.updateOrderStatus(id, ORDER_STATUS.FAILED, {
			reason: "CANCELED_BY_USER",
		});
	}
}
