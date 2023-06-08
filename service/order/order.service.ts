import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Order, OrderDocument } from '../../schema/order.schema';
import { Product, ProductDocument } from '../../schema/product.schema';
import {
  CreateOrderDto,
  CreateOrderItemDataDto,
} from '../../../shop_shared/dto/order/create-order.dto';
import { ORDER_STATUS } from '../../../shop_shared/constants/order';
import { ProductItemDto } from '../../../shop_shared/dto/product/product.dto';
import { PublicError } from '../../helpers/publicError';
import { fetchMono } from '../../../src/utils/fetchMono';
import { LanguageEnum } from '../../../shop_shared/constants/localization';

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

  async createOrder(
    createOrderData: CreateOrderDto,
    lang: LanguageEnum,
  ): Promise<OrderDocument> {
    this.logger.log('createOrder', createOrderData);

    if (!createOrderData.itemsData.length) {
      throw new PublicError('NO_ITEMS');
    }

    const session = await this.connection.startSession();

    let order: OrderDocument[] | null = null;
    let error: Error | null = null;

    try {
      await session.withTransaction(async () => {
        const products: ProductDocument[] = await this.productModel
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

        const totalPrice = products.reduce((acc, product) => {
          acc += product.price;
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
              status: ORDER_STATUS.CREATED,
              createDate: new Date(),
            },
          ],
          { session },
        );

        // const monoResponse: {
        //   invoiceId: string;
        //   pageUrl: string;
        // } = await fetchMono({
        //   amount: Math.round(totalPrice * 100),
        //   ccy: 980,
        //   merchantPaymInfo: {
        //     reference: order[0]._id.toString(),
        //     destination: 'Покупка щастя',
        //     basketOrder: [],
        //   },
        //   redirectUrl: `http://localhost:3000/${lang}/order/${order[0]._id.toString()}`,
        //   webHookUrl: 'http://api.unicorn.ua/order/webhook/mono/',
        //   validity: 3600,
        //   paymentType: 'debit',
        // });
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
    return order[0];
  }
}
