import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { TranslatedText } from '@alster/shop-shared/dto/translated-text';
import { ObjectId } from 'mongodb';

export type CategoryDocument = HydratedDocument<Category>;

@Schema()
export class Category {
  @Prop({ type: ObjectId })
  _id!: ObjectId;

  @Prop({ type: Object, default: {} })
  @IsObject()
  title!: TranslatedText;

  @Prop({ type: Object, default: {} })
  @IsObject()
  description!: TranslatedText;

  @Prop({ type: Array, default: [] })
  @IsArray()
  children!: ObjectId[];

  @Prop({ type: Array, default: [] })
  @IsArray()
  parents!: ObjectId[];

  @Prop({ type: Number })
  @IsNumber()
  sort!: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
