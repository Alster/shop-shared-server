import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMobilePhone,
  IsNumber,
  IsObject,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { ORDER_STATUS, OrderStatus } from '../../shop-shared/constants/order';
import {
  CreateOrderItemDataDto,
  DeliveryDataDto,
} from '../../shop-shared/dto/order/create-order.dto';
import { MoneySmall } from '../../shop-shared/dto/primitiveTypes';
import { CURRENCY } from '../../shop-shared/constants/exchange';

export type OrderDocument = HydratedDocument<Order>;

export interface IStatusHistoryEntry {
  status: OrderStatus;
  date: Date;
}

@Schema({
  collection: 'order',
})
export class Order {
  @Prop({ type: String })
  @IsString()
  @Length(3, 255)
  firstName!: string;

  @Prop({ type: String })
  @IsString()
  @Length(3, 255)
  lastName!: string;

  @Prop({ type: String })
  @IsString()
  @IsPhoneNumber()
  @IsMobilePhone()
  phoneNumber!: string;

  @Prop({ type: Array, default: [] })
  @IsArray()
  itemsData!: CreateOrderItemDataDto[];

  @Prop({ type: Object, default: {} })
  @IsObject()
  delivery!: DeliveryDataDto;

  @Prop({ type: Number, default: 0 })
  @IsNumber()
  totalPrice!: MoneySmall;

  @Prop({ type: String, default: '' })
  @IsString()
  currency!: CURRENCY;

  @Prop({ type: String })
  @IsEnum(ORDER_STATUS)
  status!: OrderStatus;

  @Prop({ type: Date })
  @IsDate()
  createDate: Date = new Date();

  @Prop({ type: Array, default: [] })
  @IsArray()
  statusHistory!: IStatusHistoryEntry[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);
