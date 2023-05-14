import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { Product, ProductDocument } from '../../schema/product.schema';
import { AppModule } from '../../../src/app.module';
import { ConsoleLogger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  ItemAttribute,
  ItemAttributeDocument,
} from '../../schema/item-attribute.schema';
import { ObjectId } from 'mongodb';
import { MockColor, MockSize } from './mocks';
import { ATTRIBUTE_TYPE } from '../../../shop_shared/constants/product';
import { LanguageEnum } from '../../../shop_shared/constants/localization';

describe('ProductService', () => {
  let service: ProductService;
  let productModel: Model<ProductDocument>;
  let itemAttributeModel: Model<ItemAttributeDocument>;

  const mockCreateAttributes = async () => {
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
    return { attrColor, attrSize };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .setLogger(new ConsoleLogger())
      .compile();

    service = module.get<ProductService>(ProductService);
    productModel = module.get(getModelToken(Product.name));
    itemAttributeModel = module.get(getModelToken(ItemAttribute.name));

    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Create a product', async () => {
    const { attrColor, attrSize } = await mockCreateAttributes();
    const productSkirt = await service.createProduct({
      name: 'Skit',
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
            [attrSize.key]: [MockSize.M],
          },
        },
      ],
    });
    const productShirt = await service.createProduct({
      name: 'Test',
      price: 150,
      items: [
        {
          sku: new ObjectId().toString(),
          attributes: {
            [attrColor.key]: [MockColor.WHITE],
            [attrSize.key]: [MockSize.S],
          },
        },
        {
          sku: new ObjectId().toString(),
          attributes: {
            [attrColor.key]: [MockColor.BLACK],
            [attrSize.key]: [MockSize.M],
          },
        },
        {
          sku: new ObjectId().toString(),
          attributes: {
            [attrColor.key]: [MockColor.PINK],
            [attrSize.key]: [MockSize.L],
          },
        },
      ],
    });

    const res = await service.find(
      {
        [`attrs.${attrColor.key}`]: { $in: [MockColor.RED] },
      },
      {},
      0,
      999,
      LanguageEnum.UA,
    );
    console.log(JSON.stringify(res, null, 2));
  });
});
