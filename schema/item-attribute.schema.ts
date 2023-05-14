import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsObject,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { TranslatedText } from '@alster/shop-shared/dto/translated-text';
import {
  ATTRIBUTE_TYPE,
  AttributeType,
} from '@alster/shop-shared/constants/product';

export interface AttributeValueDto {
  key: string;
  title: TranslatedText;
}

export type ItemAttributeDocument = HydratedDocument<ItemAttribute>;

@Schema()
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
  key = '';

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
