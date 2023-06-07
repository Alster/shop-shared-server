import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../schema/order.schema';
import { Product, ProductDocument } from '../../schema/product.schema';
import { CreateOrderDto } from '../../../shop_shared/dto/order/create-order.dto';
import { ORDER_STATUS } from '../../../shop_shared/constants/order';

@Injectable()
export class OrderService {
  private logger: Logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getOrder(id: string): Promise<OrderDocument | null> {
    this.logger.log(`getOrder ${id}`);
    return this.orderModel.findById(id).exec();
  }

  async createOrder(createOrderData: CreateOrderDto): Promise<OrderDocument> {
    this.logger.log('createOrder', createOrderData);
    const order = await this.orderModel.create({
      firstName: createOrderData.firstName,
      lastName: createOrderData.lastName,
      phoneNumber: createOrderData.phoneNumber,
      itemsData: createOrderData.itemsData,
      delivery: createOrderData.delivery,
      status: ORDER_STATUS.CREATED,
    });
    return order;
  }
}
