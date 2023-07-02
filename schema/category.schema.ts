import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';
import { ObjectId } from 'mongodb';
import { TranslatedText } from '../../shop-shared/dto/translated-text';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({
  collection: 'category',
})
export class Category {
  @Prop({ type: ObjectId })
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
