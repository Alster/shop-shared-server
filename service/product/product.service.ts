import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";

import { LanguageEnum } from "../../../shop-shared/constants/localization";
import {
	ProductAdminDto,
	ProductAttributesDto,
} from "../../../shop-shared/dto/product/product.dto";
import { CreateProductRequestDto } from "../../dto/createProduct.request.dto";
import { mapProductDocumentToProductAdminDto } from "../../mapper/product/map.productDocument.to.productAdminDto";
import { Category, CategoryDocument } from "../../schema/category.schema";
import { ItemAttribute, ItemAttributeDocument } from "../../schema/itemAttribute.schema";
import { Product, ProductDocument } from "../../schema/product.schema";

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
		return await this.productModel.create({
			title: { ua: createProductRequestDto.name },
			price: createProductRequestDto.price,
			items: createProductRequestDto.items,
			categories: [],
		});
	}

	public async cloneProduct(referenceId: string): Promise<ProductDocument> {
		const referenceProduct = await this.productModel.findById(referenceId).exec();
		if (!referenceProduct) {
			throw new NotFoundException();
		}

		const createdProduct = await this.createProduct({
			name: "tmp name",
			price: 1,
			items: [],
		});

		const updateData = mapProductDocumentToProductAdminDto(referenceProduct);
		updateData.active = false;

		const result = await this.updateProduct(createdProduct._id.toString(), updateData);
		if (!result) {
			throw new Error(`Product not found with id ${createdProduct._id.toString()}`);
		}

		return result;
	}

	public async updateProduct(
		id: string,
		updateData: Omit<ProductAdminDto, "createDate">,
	): Promise<ProductDocument | undefined> {
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
			return;
		}
		product.publicId = updateData.publicId;
		product.title = updateData.title;
		product.description = updateData.description;
		product.categories = updateData.categories
			.filter((v) => ObjectId.isValid(v))
			.map((v) => new ObjectId(v));

		console.log("categories", JSON.stringify(categories, undefined, 2));
		product.categoriesAll = categories.flatMap((category) =>
			Array.from({ length: category.parents.length + 1 }).map((_, index) =>
				[...category.parents, category.publicId].splice(0, index + 1).join("/"),
			),
		);

		product.characteristics = updateData.characteristics;
		product.items = updateData.items;
		product.price = updateData.price;
		product.currency = updateData.currency;
		product.discount = updateData.discount;
		product.imagesByColor = updateData.imagesByColor;
		product.active = updateData.active;
		await product.save();
		return product;
	}

	public async getProduct(id: string): Promise<ProductDocument | null> {
		return await this.productModel.findById(id).exec();
	}

	public async getProductByPublicId(publicId: string): Promise<ProductDocument | null> {
		return await this.productModel
			.findOne({
				publicId: publicId,
			})
			.exec();
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
		priceMin: number;
		priceMax: number;
	}> {
		console.log("Query:", JSON.stringify(query, null, 2));
		console.log("Sort:", JSON.stringify(sort, null, 2));
		const getProducts = async () =>
			this.productModel
				.find(query, {
					publicId: 1,
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
					imagesByColor: 1,
					active: 1,
					createDate: 1,
				})
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.exec();
		const getCount = async () => this.productModel.countDocuments(query);
		const aggregationQuery = {
			...(query.categoriesAll ? { categoriesAll: query.categoriesAll } : {}),
			active: true,
			quantity: { $gt: 0 },
		};
		const getAggregation = async () => {
			const [result] = await this.productModel.aggregate([
				{
					$match: aggregationQuery,
				},
				{
					$group: {
						_id: null,
						attrs: {
							$accumulator: {
								init: AttributesAccumulator.init.toString(),
								accumulateArgs: ["$attrs"],
								accumulate: AttributesAccumulator.accumulate.toString(),
								merge: AttributesAccumulator.merge.toString(),
								finalize: AttributesAccumulator.finalize.toString(),
								lang: "js",
							},
						},
						categories: { $addToSet: `$categories` },
						priceMin: {
							$min: "$price",
						},
						priceMax: {
							$max: "$price",
						},
					},
				},
				{
					$project: {
						attrs: 1,
						categories: {
							$reduce: {
								input: "$categories",
								initialValue: [],
								in: { $setUnion: ["$$value", "$$this"] },
							},
						},
						priceMin: 1,
						priceMax: 1,
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
			priceMin: aggregatedResult?.priceMin || 0,
			priceMax: aggregatedResult?.priceMax || 0,
		};
	}

	public async getAttributes(): Promise<ItemAttributeDocument[]> {
		return await this.itemAttributeModel.find().exec();
	}
}

const AttributesAccumulator = {
	init: function () {
		return {};
	},
	accumulate: function (state: ProductAttributesDto, document: ProductAttributesDto) {
		for (const key in document) {
			state[key] = Object.prototype.hasOwnProperty.call(state, key)
				? state[key].concat(document[key])
				: document[key];
		}
		return state;
	},
	merge: function (state: ProductAttributesDto, document: ProductAttributesDto) {
		for (const key in document) {
			state[key] = Object.prototype.hasOwnProperty.call(state, key)
				? state[key].concat(document[key])
				: document[key];
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
