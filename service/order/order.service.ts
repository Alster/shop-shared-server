import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Order, OrderDocument } from '../../schema/order.schema';
import { Product, ProductDocument } from '../../schema/product.schema';
import {
  CreateOrderDto,
  CreateOrderItemDataDto,
} from '../../../shop-shared/dto/order/create-order.dto';
import {
  ORDER_STATUS,
  OrderStatus,
} from '../../../shop-shared/constants/order';
import { ProductItemDto } from '../../../shop-shared/dto/product/product.dto';
import { PublicError } from '../../helpers/publicError';
import { MoneySmall } from '../../../shop-shared/dto/primitiveTypes';

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
    query: any,
    sort: any,
    skip: number,
    limit: number,
  ): Promise<{
    orders: OrderDocument[];
    total: number;
  }> {
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Sort:', JSON.stringify(sort, null, 2));
    const getOrders = async () =>
      this.orderModel.find(query).sort(sort).skip(skip).limit(limit).exec();
    const getCount = async () => this.orderModel.countDocuments(query);
    const [orders, totalCount] = await Promise.all([getOrders(), getCount()]);

    return {
      orders: orders,
      total: totalCount,
    };
  }

  async createOrder(
    createOrderData: CreateOrderDto,
  ): Promise<[OrderDocument, MoneySmall, ProductDocument[]]> {
    this.logger.log('createOrder', createOrderData);

    if (!createOrderData.itemsData.length) {
      throw new PublicError('NO_ITEMS');
    }

    const session = await this.connection.startSession();

    let order: OrderDocument[] | null = null;
    let error: Error | null = null;
    let totalPrice: MoneySmall = 0;
    let products: ProductDocument[] = [];

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

        for (const itemData of createOrderData.itemsData) {
          const product = productsMap[itemData.productId];
          if (!product) {
            throw new Error(`Product with id ${itemData.productId} not found`);
          }
          if (product.items.length === 0) {
            throw new PublicError(`ITEM_ALREADY_SELL`);
          }

          const popItem = (
            item: CreateOrderItemDataDto,
          ): ProductItemDto | null => {
            const foundItem = product.items.find((candidate) => {
              return Object.entries(item.attrs).every(([key, values]) => {
                return values.every(
                  (v) =>
                    candidate.attributes[key] &&
                    candidate.attributes[key].includes(v),
                );
              });
            });

            if (!foundItem) {
              return null;
            }

            const index = product.items.indexOf(foundItem);
            product.items.splice(index, 1);

            return foundItem;
          };

          for (const _i of Array.from({ length: itemData.qty })) {
            const item = popItem(itemData);
            if (!item) {
              throw new PublicError('ITEM_ALREADY_SELL');
            }
          }
        }

        for (const product of products) {
          product.markModified('items');
          await product.save({ session });
        }

        totalPrice = products.reduce((acc, product) => {
          acc += product.price as number;
          return acc;
        }, 0);

        order = await this.orderModel.create(
          [
            {
              firstName: createOrderData.firstName,
              lastName: createOrderData.lastName,
              phoneNumber: createOrderData.phoneNumber,
              itemsData: createOrderData.itemsData,
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
    } catch (err) {
      this.logger.error(`Error while creating order ${err.message}`);
      this.logger.error(err.stack);
      error = err;
    } finally {
      await session.endSession();
    }
    if (error) {
      throw error;
    }
    if (!order) {
      throw new Error('Impossible error');
    }
    return [order[0], totalPrice, products];
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderDocument> {
    await this.orderModel.updateOne({ _id: id }, { status: status });
    const order = await this.getOrder(id);
    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }
}
