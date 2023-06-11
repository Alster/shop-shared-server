import { OrderService } from './order.service';
import mongoose, { Model } from 'mongoose';
import { Product, ProductDocument } from '../../schema/product.schema';
import { Order, OrderDocument } from '../../schema/order.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { ConsoleLogger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import {
  CreateOrderDto,
  DeliveryNVOfficeDto,
} from '../../../shop-shared/dto/order/create-order.dto';
import { NOVA_POSHTA_DELIVERY_TYPE } from '../../../shop-shared/constants/checkout';
import { ObjectId } from 'mongodb';
import { MockColor, MockSize } from '../product/mocks';
import { ProductService } from '../product/product.service';
import {
  ItemAttribute,
  ItemAttributeDocument,
} from '../../schema/item-attribute.schema';
import { ATTRIBUTE_TYPE } from '../../../shop-shared/constants/product';
import { ORDER_STATUS } from '../../../shop-shared/constants/order';

describe('OrderService', () => {
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

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });

  it('should create order', async () => {
    // Mocks
    const attrColor: ItemAttributeDocument = await itemAttributeModel.create({
      title: 'Color',
      description: 'Some color',
      key: 'color',
      type: ATTRIBUTE_TYPE.SELECT,
      values: Object.values(MockColor),
      active: true,
    });
    const attrSize: ItemAttributeDocument = await itemAttributeModel.create({
      title: 'Size',
      description: 'Some size',
      key: 'size',
      type: ATTRIBUTE_TYPE.SELECT,
      values: Object.values(MockSize),
      active: true,
    });

    const productSkirt = await productService.createProduct({
      name: 'Skirt',
      price: 100,
      items: [
        {
          sku: new ObjectId().toString(),
          attributes: {
            [attrColor.key]: [MockColor.BLUE],
            [attrSize.key]: [MockSize.S],
          },
        },
        {
          sku: new ObjectId().toString(),
          attributes: {
            [attrColor.key]: [MockColor.RED],
            [attrSize.key]: [MockSize.S],
          },
        },
      ],
    });

    const createOrderDto: CreateOrderDto = {
      currency: 'UAH',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+380123456789',
      itemsData: [
        {
          productId: productSkirt._id.toString(),
          qty: 1,
          attrs: {
            [attrColor.key]: [MockColor.RED],
            [attrSize.key]: [MockSize.S],
          },
        },
      ],
      delivery: {
        whereToDeliver: NOVA_POSHTA_DELIVERY_TYPE.OFFICE,
        data: {
          cityName: 'Kyiv',
          officeName: 'Some office',
        },
      },
    };

    // Do order creation
    const createdOrder = await orderService.createOrder(createOrderDto);
    const order: OrderDocument | null = await orderModel.findById(
      createdOrder._id,
    );
    if (!order) {
      throw new Error('Order not found');
    }

    // Created order must be th same as order in database
    expect(order.status).toBe(createdOrder.status);
    expect(order.firstName).toBe(createOrderDto.firstName);
    expect(order.lastName).toBe(createOrderDto.lastName);
    expect(order.phoneNumber).toBe(createOrderDto.phoneNumber);
    expect(order.itemsData.length).toBe(1);
    expect(order.itemsData[0].productId).toBe(productSkirt._id.toString());
    expect(order.itemsData[0].attrs[attrColor.key]).toEqual([MockColor.RED]);
    expect(order.itemsData[0].attrs[attrSize.key]).toEqual([MockSize.S]);
    expect(order.delivery.whereToDeliver).toBe(
      NOVA_POSHTA_DELIVERY_TYPE.OFFICE,
    );
    expect(order.delivery.data.cityName).toBe(
      createOrderDto.delivery.data.cityName,
    );
    expect((order.delivery.data as DeliveryNVOfficeDto).officeName).toBe(
      (createOrderDto.delivery.data as DeliveryNVOfficeDto).officeName,
    );

    // Check order values
    expect(order.status).toBe(ORDER_STATUS.CREATED);
    expect(order.firstName).toBe(createOrderDto.firstName);
    expect(order.lastName).toBe(createOrderDto.lastName);
    expect(order.phoneNumber).toBe(createOrderDto.phoneNumber);
    expect(order.itemsData.length).toBe(1);
    expect(order.itemsData[0].productId).toBe(productSkirt._id.toString());
    expect(order.itemsData[0].attrs[attrColor.key]).toEqual([MockColor.RED]);
    expect(order.itemsData[0].attrs[attrSize.key]).toEqual([MockSize.S]);
    expect(order.delivery.whereToDeliver).toBe(
      NOVA_POSHTA_DELIVERY_TYPE.OFFICE,
    );
    expect(order.delivery.data.cityName).toBe(
      createOrderDto.delivery.data.cityName,
    );
    expect((order.delivery.data as DeliveryNVOfficeDto).officeName).toBe(
      (createOrderDto.delivery.data as DeliveryNVOfficeDto).officeName,
    );

    const productSkirtAfter: Product | null = await productModel.findById(
      productSkirt._id,
    );
    expect(productSkirtAfter).toBeDefined();
    expect(productSkirtAfter?.items.length).toBe(1);
    expect(productSkirtAfter?.items[0].attributes[attrColor.key].length).toBe(
      1,
    );
    expect(productSkirtAfter?.items[0].attributes[attrColor.key][0]).toBe(
      MockColor.BLUE,
    );
    expect(productSkirtAfter?.items[0].attributes[attrSize.key].length).toBe(1);
    expect(productSkirtAfter?.items[0].attributes[attrSize.key][0]).toBe(
      MockSize.S,
    );
    expect(productSkirtAfter?.attrs[attrColor.key]).toBeDefined();
    console.log(productSkirtAfter?.attrs[attrColor.key]);
    expect(productSkirtAfter?.attrs[attrColor.key].length).toBe(1);
    expect(productSkirtAfter?.attrs[attrColor.key][0]).toBe(MockColor.BLUE);

    expect(productSkirtAfter?.attrs[attrSize.key]).toBeDefined();
    expect(productSkirtAfter?.attrs[attrSize.key].length).toBe(1);
    expect(productSkirtAfter?.attrs[attrSize.key][0]).toBe(MockSize.S);

    // Test get order
    const foundOrderByService = await orderService.getOrder(
      order._id.toString(),
    );
    expect(foundOrderByService).toBeDefined();
  });
});
