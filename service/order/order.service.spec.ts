import { ConsoleLogger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ObjectId } from "mongodb";
import mongoose, { Model } from "mongoose";

import { NOVA_POSHTA_DELIVERY_TYPE } from "../../../shop-shared/constants/checkout";
import { CurrencyEnum } from "../../../shop-shared/constants/exchange";
import { ORDER_STATUS } from "../../../shop-shared/constants/order";
import { ATTRIBUTE_TYPE } from "../../../shop-shared/constants/product";
import {
	CreateOrderDto,
	DeliveryNVOfficeDto,
} from "../../../shop-shared/dto/order/createOrder.dto";
import { AppModule } from "../../../src/app.module";
import { ItemAttribute, ItemAttributeDocument } from "../../schema/itemAttribute.schema";
import { Order, OrderDocument } from "../../schema/order.schema";
import { Product, ProductDocument } from "../../schema/product.schema";
import { MockColor, MockSize } from "../product/mocks";
import { ProductService } from "../product/product.service";
import { OrderService } from "./order.service";

describe("OrderService", () => {
	let orderService: OrderService;
	let productService: ProductService;
	let orderModel: Model<OrderDocument>;
	let productModel: Model<ProductDocument>;
	let itemAttributeModel: Model<ItemAttributeDocument>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		})
			.setLogger(new ConsoleLogger())
			.compile();

		orderService = module.get<OrderService>(OrderService);
		productService = module.get<ProductService>(ProductService);
		orderModel = module.get(getModelToken(Order.name));
		productModel = module.get(getModelToken(Product.name));
		itemAttributeModel = module.get(getModelToken(ItemAttribute.name));

		await productModel.deleteMany({});
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	it("should be defined", () => {
		expect(orderService).toBeDefined();
	});

	it("should create order", async () => {
		// Mocks
		const attributeColor: ItemAttributeDocument = await itemAttributeModel.create({
			title: "Color",
			description: "Some color",
			key: "color",
			type: ATTRIBUTE_TYPE.SELECT,
			values: Object.values(MockColor),
			active: true,
		});
		const attributeSize: ItemAttributeDocument = await itemAttributeModel.create({
			title: "Size",
			description: "Some size",
			key: "size",
			type: ATTRIBUTE_TYPE.SELECT,
			values: Object.values(MockSize),
			active: true,
		});

		const productSkirt = await productService.createProduct({
			name: "Skirt",
			price: 100,
			items: [
				{
					sku: new ObjectId().toString(),
					attributes: {
						[attributeColor.key]: [MockColor.BLUE],
						[attributeSize.key]: [MockSize.S],
					},
				},
				{
					sku: new ObjectId().toString(),
					attributes: {
						[attributeColor.key]: [MockColor.RED],
						[attributeSize.key]: [MockSize.S],
					},
				},
			],
		});

		const createOrderDto: CreateOrderDto = {
			currency: "UAH" as CurrencyEnum,
			firstName: "John",
			lastName: "Doe",
			phoneNumber: "+380123456789",
			itemsData: [
				{
					productId: productSkirt._id.toString(),
					qty: 1,
					attributes: {
						[attributeColor.key]: [MockColor.RED],
						[attributeSize.key]: [MockSize.S],
					},
				},
			],
			delivery: {
				whereToDeliver: NOVA_POSHTA_DELIVERY_TYPE.OFFICE,
				data: {
					cityName: "Kyiv",
					officeName: "Some office",
				},
			},
		};

		// Do order creation
		const createdOrder = await orderService.createOrder(createOrderDto);
		const order: OrderDocument | null = await orderModel.findById(createdOrder._id);
		if (!order) {
			throw new Error("Order not found");
		}

		// Created order must be th same as order in database
		expect(order.status).toBe(createdOrder.status);
		expect(order.firstName).toBe(createOrderDto.firstName);
		expect(order.lastName).toBe(createOrderDto.lastName);
		expect(order.phoneNumber).toBe(createOrderDto.phoneNumber);
		expect(order.itemsData).toHaveLength(1);
		expect(order.itemsData[0].productId).toBe(productSkirt._id.toString());
		expect(order.itemsData[0].attrs[attributeColor.key]).toEqual([MockColor.RED]);
		expect(order.itemsData[0].attrs[attributeSize.key]).toEqual([MockSize.S]);
		expect(order.delivery.whereToDeliver).toBe(NOVA_POSHTA_DELIVERY_TYPE.OFFICE);
		expect(order.delivery.data.cityName).toBe(createOrderDto.delivery.data.cityName);
		expect((order.delivery.data as DeliveryNVOfficeDto).officeName).toBe(
			(createOrderDto.delivery.data as DeliveryNVOfficeDto).officeName,
		);

		// Check order values
		expect(order.status).toBe(ORDER_STATUS.CREATED);
		expect(order.firstName).toBe(createOrderDto.firstName);
		expect(order.lastName).toBe(createOrderDto.lastName);
		expect(order.phoneNumber).toBe(createOrderDto.phoneNumber);
		expect(order.itemsData).toHaveLength(1);
		expect(order.itemsData[0].productId).toBe(productSkirt._id.toString());
		expect(order.itemsData[0].attrs[attributeColor.key]).toEqual([MockColor.RED]);
		expect(order.itemsData[0].attrs[attributeSize.key]).toEqual([MockSize.S]);
		expect(order.delivery.whereToDeliver).toBe(NOVA_POSHTA_DELIVERY_TYPE.OFFICE);
		expect(order.delivery.data.cityName).toBe(createOrderDto.delivery.data.cityName);
		expect((order.delivery.data as DeliveryNVOfficeDto).officeName).toBe(
			(createOrderDto.delivery.data as DeliveryNVOfficeDto).officeName,
		);

		const productSkirtAfter: Product | null = await productModel.findById(productSkirt._id);
		expect(productSkirtAfter).toBeDefined();
		expect(productSkirtAfter?.items.length).toBe(1);
		expect(productSkirtAfter?.items[0].attributes[attributeColor.key].length).toBe(1);
		expect(productSkirtAfter?.items[0].attributes[attributeColor.key][0]).toBe(MockColor.BLUE);
		expect(productSkirtAfter?.items[0].attributes[attributeSize.key].length).toBe(1);
		expect(productSkirtAfter?.items[0].attributes[attributeSize.key][0]).toBe(MockSize.S);
		expect(productSkirtAfter?.attrs[attributeColor.key]).toBeDefined();
		console.log(productSkirtAfter?.attrs[attributeColor.key]);
		expect(productSkirtAfter?.attrs[attributeColor.key].length).toBe(1);
		expect(productSkirtAfter?.attrs[attributeColor.key][0]).toBe(MockColor.BLUE);

		expect(productSkirtAfter?.attrs[attributeSize.key]).toBeDefined();
		expect(productSkirtAfter?.attrs[attributeSize.key].length).toBe(1);
		expect(productSkirtAfter?.attrs[attributeSize.key][0]).toBe(MockSize.S);

		// Test get order
		const foundOrderByService = await orderService.getOrder(order._id.toString());
		expect(foundOrderByService).toBeDefined();
	});
});
