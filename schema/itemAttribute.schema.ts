import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsDate, IsEnum, IsObject, IsString, Length } from "class-validator";
import { HydratedDocument } from "mongoose";

import { ATTRIBUTE_TYPE, AttributeType } from "../../shop-shared/constants/product";
import { TranslatedText } from "../../shop-shared/dto/translatedText";

export interface AttributeValueDto {
	key: string;
	title: TranslatedText;
}

export type ItemAttributeDocument = HydratedDocument<ItemAttribute>;

@Schema({
	collection: "item_attribute",
})
export class ItemAttribute {
	@Prop({ type: Object, default: {} })
	@IsObject()
	title!: TranslatedText;

	@Prop({ type: Object, default: {} })
	@IsObject()
	description!: TranslatedText;

	@Prop({ type: String, index: true })
	@IsString()
	@Length(2, 40)
	key = "";

	@Prop({ type: String })
	@IsEnum(ATTRIBUTE_TYPE)
	type!: AttributeType;

	@Prop({ type: Array })
	values: AttributeValueDto[] = [];

	@Prop({ type: Boolean })
	@IsBoolean()
	active = false;

	@Prop({ type: Date })
	@IsDate()
	createDate: Date = new Date();
}

export const ItemAttributeSchema = SchemaFactory.createForClass(ItemAttribute);
