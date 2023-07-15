import { ConsoleLogger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ObjectId } from "mongodb";
import mongoose, { Model } from "mongoose";

import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { ATTRIBUTE_TYPE } from "../../../shop-shared/constants/product";
import { AppModule } from "../../../src/app.module";
import { ItemAttribute, ItemAttributeDocument } from "../../schema/itemAttribute.schema";
import { Product, ProductDocument } from "../../schema/product.schema";
import { MockColor, MockSize } from "./mocks";
import { ProductService } from "./product.service";

describe("ProductService", () => {
	let service: ProductService;
	let productModel: Model<ProductDocument>;
	let itemAttributeModel: Model<ItemAttributeDocument>;

	const mockCreateAttributes = async () => {
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
		return { attrColor: attributeColor, attrSize: attributeSize };
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

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	it("Create a product", async () => {
		const { attrColor, attrSize } = await mockCreateAttributes();
		const productSkirt = await service.createProduct({
			name: "Skirt",
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
			name: "Shirt",
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
