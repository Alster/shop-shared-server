import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsInt,
	IsObject,
	IsString,
	Min,
} from "class-validator";
import { ObjectId } from "mongodb";
import { HydratedDocument, IndexDirection } from "mongoose";

import { CurrencyEnum } from "../../shop-shared/constants/exchange";
import { LanguageEnum } from "../../shop-shared/constants/localization";
import { MoneySmall } from "../../shop-shared/dto/primitiveTypes";
import { ProductAttributesDto, ProductItemDto } from "../../shop-shared/dto/product/product.dto";
import { TranslatedText } from "../../shop-shared/dto/translatedText";

export type ProductDocument = HydratedDocument<Product>;

@Schema({
	collection: "product",
})
export class Product {
	@Prop({ type: String })
	@IsString()
	publicId!: string;

	@Prop({ type: Object, default: {} })
	@IsObject()
	title!: TranslatedText;

	// Field contains texts in which we want to search
	@Prop({ type: String, default: "" })
	@IsString()
	searchWords!: string;

	@Prop({ type: Object, default: {} })
	@IsObject()
	description!: TranslatedText;

	@Prop({ type: Array, default: [] })
	@IsArray()
	categories!: ObjectId[];

	// Complete hierarchy of selected category
	@Prop({ type: Array, default: [] })
	@IsArray()
	categoriesAll!: string[];

	// Common attributes applies to whole product
	@Prop({ type: Object, default: {} })
	@IsObject()
	characteristics!: ProductAttributesDto;

	@Prop({ type: Array, default: [] })
	@IsArray()
	items!: ProductItemDto[];

	// Computed attributes from all items
	@Prop({ type: Object, default: {} })
	@IsObject()
	attrs!: ProductAttributesDto;

	// Computed quantity of items
	@Prop({ type: Number, default: 0 })
	@IsInt()
	@Min(0)
	quantity!: number;

	@Prop({ type: Number, default: 0 })
	@IsInt()
	@Min(0)
	price!: MoneySmall;

	@Prop({ type: String, default: CurrencyEnum.UAH })
	@IsEnum(CurrencyEnum)
	currency!: CurrencyEnum;

	@Prop({ type: Number, default: 0 })
	@IsInt()
	@Min(0)
	discount!: number;

	@Prop({ type: Object })
	@IsObject()
	imagesByColor: Record<string, string[]> = {};

	@Prop({ type: Boolean, default: false })
	@IsBoolean()
	active!: boolean;

	@Prop({ type: Date, default: new Date() })
	@IsDate()
	createDate!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

const textTitleIndex: Record<string, IndexDirection> = Object.fromEntries(
	Object.values(LanguageEnum).map((lang) => [`title.${lang}`, "text"]),
);
const textDescriptionIndex: Record<string, IndexDirection> = Object.fromEntries(
	Object.values(LanguageEnum).map((lang) => [`description.${lang}`, "text"]),
);
const textIndex: Record<string, IndexDirection> = {
	...textTitleIndex,
	...textDescriptionIndex,
};
ProductSchema.index(textIndex, { name: "text" });

ProductSchema.index(
	{
		// Equality field
		active: 1,
		// Sort field
		createDate: -1,
		// Range field
		quantity: 1,
		categoriesAll: 1,
		"attrs.$**": 1,
	},
	{ name: "catalogSearch_orderByDate" },
);

ProductSchema.pre("save", function (next) {
	this.quantity = this.items.length;

	const collectedAttributes = [
		...this.items.flatMap((index) => Object.entries(index.attributes)),
		...Object.entries(this.characteristics),
	];

	const aggregatedAttributes = collectedAttributes.reduce<{
		[index: string]: Set<string>;
	}>((accumulator, [key, values]) => {
		if (!accumulator[key]) {
			accumulator[key] = new Set();
		}
		for (const v of values) accumulator[key]!.add(v);
		return accumulator;
	}, {});

	this.attrs = Object.fromEntries(
		Object.entries(aggregatedAttributes).map(([key, values]: [string, Set<string>]) => [
			key,
			[...values.values()],
		]),
	);
	// console.log(aggregatedAttributes);
	// console.log(this.attrs);

	this.searchWords = Object.values(this.title).join(" ");

	next();
});
