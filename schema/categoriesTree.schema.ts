import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsArray, IsBoolean, IsNumber, IsObject, IsString } from "class-validator";
import { ObjectId } from "mongodb";
import { HydratedDocument } from "mongoose";

import { TranslatedText } from "../../shop-shared/dto/translatedText";

export class CategoryNode {
	@Prop({ type: Object })
	@IsString()
	_id!: ObjectId;

	@Prop({ type: String })
	@IsString()
	publicId!: string;

	@Prop({ type: Object, default: {} })
	@IsObject()
	title!: TranslatedText;

	@Prop({ type: Object, default: {} })
	@IsObject()
	description!: TranslatedText;

	@Prop({ type: Array, default: [] })
	@IsArray({ each: true })
	children!: CategoryNode[];

	@Prop({ type: Number })
	@IsNumber()
	sort!: number;

	@Prop({ type: Boolean })
	@IsBoolean()
	active!: boolean;
}

export type CategoriesTreeDocument = HydratedDocument<CategoriesTree>;

@Schema({
	collection: "categories_tree",
})
export class CategoriesTree {
	@Prop({ type: Object, default: {} })
	@IsObject()
	root!: CategoryNode[];
}

export const CategoriesTreeSchema = SchemaFactory.createForClass(CategoriesTree);
