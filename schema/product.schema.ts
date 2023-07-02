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
  Min,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { TranslatedText } from '../../shop-shared/dto/translated-text';
import {
  ProductAttributesDto,
  ProductItemDto,
} from '../../shop-shared/dto/product/product.dto';
import { MoneySmall } from '../../shop-shared/dto/primitiveTypes';
import { CURRENCY } from '../../shop-shared/constants/exchange';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  collection: 'product',
})
export class Product {
  @Prop({ type: Object, default: {} })
  @IsObject()
  title!: TranslatedText;

  @Prop({ type: String, default: '' })
  @IsString()
  searchWords!: string;

  @Prop({ type: Object, default: {} })
  @IsObject()
  description!: TranslatedText;

  @Prop({ type: Array, default: [] })
  @IsArray()
  categories!: ObjectId[];

  @Prop({ type: Array, default: [] })
  @IsArray()
  categoriesAll!: string[];

  @Prop({ type: Object, default: {} })
  @IsObject()
  characteristics!: ProductAttributesDto;

  @Prop({ type: Array, default: [] })
  @IsArray()
  items!: ProductItemDto[];

  @Prop({ type: Object, default: {} })
  @IsObject()
  attrs!: ProductAttributesDto;

  @Prop({ type: Number, default: 0 })
  @IsInt()
  @Min(0)
  quantity!: number;

  @Prop({ type: Number, default: 0 })
  @IsInt()
  @Min(0)
  price!: MoneySmall;

  @Prop({ type: String, default: CURRENCY.UAH })
  @IsEnum(CURRENCY)
  currency!: CURRENCY;

  @Prop({ type: Number, default: 0 })
  @IsInt()
  @Min(0)
  discount!: number;

  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  active!: boolean;

  // @Prop({ type: Object })
  // @IsObject()
  // imagesByColor: { [value in ItemColor]?: string[] } = {};

  @Prop({ type: Date, default: new Date() })
  @IsDate()
  createDate!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('save', function (next) {
  this.quantity = this.items.length;

  const collectedAttrs = [
    ...this.items.flatMap((i) => Object.entries(i.attributes)),
    ...Object.entries(this.characteristics),
  ];

  const aggregatedAttrs = collectedAttrs.reduce<{
    [index: string]: Set<string>;
  }>((acc, [key, values]) => {
    if (!acc[key]) {
      acc[key] = new Set();
    }
    values.forEach((v) => acc[key].add(v));
    return acc;
  }, {});

  this.attrs = Object.entries(aggregatedAttrs).reduce<ProductAttributesDto>(
    (acc, [key, values]: [string, Set<string>]) => ({
      ...acc,
      [key]: [...values.values()],
    }),
    {},
  );
  console.log(aggregatedAttrs);
  console.log(this.attrs);

  this.searchWords = Object.values(this.title).join(' ');

  next();
});
