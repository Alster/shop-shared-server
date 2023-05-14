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
import { ObjectId } from 'mongodb';
import { TranslatedText } from '../../shop_shared/dto/translated-text';

export class CategoryNode {
  @Prop({ type: Object })
  _id!: ObjectId;

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

@Schema()
export class CategoriesTree {
  @Prop({ type: Object, default: {} })
  @IsObject()
  root!: CategoryNode[];
}

export const CategoriesTreeSchema =
  SchemaFactory.createForClass(CategoriesTree);
