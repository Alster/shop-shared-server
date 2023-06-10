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
import { ORDER_STATUS, OrderStatus } from '../../shop_shared/constants/order';
import {
  CreateOrderItemDataDto,
  DeliveryDataDto,
} from '../../shop_shared/dto/order/create-order.dto';
import { SmallMoney } from '../dto/primitiveTypes';

export type OrderDocument = HydratedDocument<Order>;

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
  totalPrice!: SmallMoney;

  @Prop({ type: String, default: '' })
  @IsString()
  currency!: string;

  @Prop({ type: String })
  @IsEnum(ORDER_STATUS)
  status!: OrderStatus;

  @Prop({ type: Date })
  @IsDate()
  createDate: Date = new Date();
}

export const OrderSchema = SchemaFactory.createForClass(Order);
