import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Product, ProductDocument } from '../../schema/product.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ItemAttribute,
  ItemAttributeDocument,
} from '../../schema/item-attribute.schema';
import { mapProductDocumentToProductAdminDto } from '../../mapper/product/map.productDocument-to-productAdminDto';
import { ObjectId } from 'mongodb';
import { Category, CategoryDocument } from '../../schema/category.schema';
import { LanguageEnum } from '../../../shop-shared/constants/localization';
import { CreateProductRequestDto } from '../../dto/create-product.request.dto';
import {
  ProductAdminDto,
  ProductAttributesDto,
} from '../../../shop-shared/dto/product/product.dto';

@Injectable()
export class ProductService {
  private logger: Logger = new Logger(ProductService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ItemAttribute.name)
    private itemAttributeModel: Model<ItemAttributeDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  public async createProduct(
    createProductRequestDto: CreateProductRequestDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.create({
      title: { ua: createProductRequestDto.name },
      price: createProductRequestDto.price,
      items: createProductRequestDto.items,
      categories: [],
    });
    return product;
  }

  public async cloneProduct(referenceId: string): Promise<ProductDocument> {
    const referenceProduct = await this.productModel
      .findById(referenceId)
      .exec();
    if (!referenceProduct) {
      throw new NotFoundException();
    }

    const createdProduct = await this.createProduct({
      name: 'tmp name',
      price: 1,
      items: [],
    });

    const updateData = mapProductDocumentToProductAdminDto(referenceProduct);
    updateData.active = false;

    const res = await this.updateProduct(
      createdProduct._id.toString(),
      updateData,
    );
    if (!res) {
      throw new Error(
        `Product not found with id ${createdProduct._id.toString()}`,
      );
    }

    return res;
  }

  public async updateProduct(
    id: string,
    updateData: ProductAdminDto,
  ): Promise<ProductDocument | null> {
    const categories = await this.categoryModel
      .find(
        {
          _id: {
            $in: updateData.categories
              .filter((v) => ObjectId.isValid(v))
              .map((v) => new ObjectId(v)),
          },
        },
        { parents: true, publicId: true },
      )
      .exec();

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      return null;
    }
    product.title = updateData.title;
    product.description = updateData.description;
    product.categories = updateData.categories
      .filter((v) => ObjectId.isValid(v))
      .map((v) => new ObjectId(v));
    console.log('categories', JSON.stringify(categories, null, 2));
    product.categoriesAll = categories.map((category) =>
      [...category.parents, category.publicId].join('/'),
    );
    product.characteristics = updateData.characteristics;
    product.items = updateData.items;
    product.price = updateData.price;
    product.currency = updateData.currency;
    product.discount = updateData.discount;
    product.active = updateData.active;
    await product.save();
    return product;
  }

  public async getProduct(id: string): Promise<ProductDocument | null> {
    return await this.productModel.findById(id).exec();
  }

  public async deleteProduct(id: string): Promise<void> {
    await this.productModel.findByIdAndDelete(id).exec();
  }

  public async find(
    query: any,
    sort: any,
    skip: number,
    limit: number,
    lang: LanguageEnum,
  ): Promise<{
    products: ProductDocument[];
    total: number;
    filters: { [key: string]: string[] };
    categories: string[];
  }> {
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Sort:', JSON.stringify(sort, null, 2));
    const getProducts = async () =>
      this.productModel
        .find(query, {
          [`title.${lang}`]: 1,
          [`description.${lang}`]: 1,
          categories: 1,
          characteristics: 1,
          items: 1,
          attrs: 1,
          quantity: 1,
          price: 1,
          currency: 1,
          discount: 1,
          active: 1,
          createDate: 1,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    const getCount = async () => this.productModel.countDocuments(query);
    const getAggregation = async () => {
      const [result] = await this.productModel.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            attrs: {
              $accumulator: {
                init: AttrsAccumulator.init.toString(),
                accumulateArgs: ['$attrs'],
                accumulate: AttrsAccumulator.accumulate.toString(),
                merge: AttrsAccumulator.merge.toString(),
                finalize: AttrsAccumulator.finalize.toString(),
                lang: 'js',
              },
            },
            categories: { $addToSet: `$categories` },
          },
        },
        {
          $project: {
            attrs: 1,
            categories: {
              $reduce: {
                input: '$categories',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] },
              },
            },
          },
        },
      ]);
      return result;
    };
    const [products, aggregatedResult, totalCount] = await Promise.all([
      getProducts(),
      getAggregation(),
      getCount(),
    ]);

    return {
      products: products,
      total: totalCount,
      filters: aggregatedResult?.attrs || {},
      categories: aggregatedResult?.categories || [],
    };
  }

  public async getAttributes(): Promise<ItemAttributeDocument[]> {
    return await this.itemAttributeModel.find().exec();
  }
}

const AttrsAccumulator = {
  init: function () {
    return {};
  },
  accumulate: function (
    state: ProductAttributesDto,
    doc: ProductAttributesDto,
  ) {
    for (const key in doc) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        state[key] = state[key].concat(doc[key]);
      } else {
        state[key] = doc[key];
      }
    }
    return state;
  },
  merge: function (state: ProductAttributesDto, doc: ProductAttributesDto) {
    for (const key in doc) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        state[key] = state[key].concat(doc[key]);
      } else {
        state[key] = doc[key];
      }
    }
    return state;
  },
  finalize: function (state: ProductAttributesDto) {
    for (const key in state) {
      state[key] = [...new Set(state[key])];
    }
    return state;
  },
};
