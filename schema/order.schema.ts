import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsMobilePhone,
	IsNumber,
	IsObject,
	IsPhoneNumber,
	IsString,
	Length,
} from "class-validator";
import { HydratedDocument } from "mongoose";

import { CurrencyEnum } from "../../shop-shared/constants/exchange";
import { ORDER_STATUS, OrderStatus } from "../../shop-shared/constants/order";
import {
	CreateOrderItemDataDto,
	DeliveryDataDto,
} from "../../shop-shared/dto/order/createOrder.dto";
import { IStatusHistoryEntry } from "../../shop-shared/dto/order/iStatusHistoryEntry";
import { IMonobankWebhookDto } from "../../shop-shared/dto/order/monobank";
import { MoneySmall } from "../../shop-shared/dto/primitiveTypes";

export type OrderDocument = HydratedDocument<Order>;

@Schema({
	collection: "order",
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

	@Prop({ type: String, default: "" })
	@IsString()
	currency!: CurrencyEnum;

	@Prop({ type: String })
	@IsEnum(ORDER_STATUS)
	status!: OrderStatus;

	@Prop({ type: Date })
	@IsDate()
	createDate: Date = new Date();

	@Prop({ type: Array, default: [] })
	@IsArray()
	statusHistory!: IStatusHistoryEntry[];

	@Prop({ type: Date })
	@IsDate()
	lastStatusUpdateDate: Date = new Date();

	@Prop({ type: String, default: "" })
	@IsString()
	invoiceId?: string;

	@Prop({ type: Object, default: undefined })
	@IsObject()
	monoResponse?: IMonobankWebhookDto;

	@Prop({ type: Boolean, default: false })
	@IsBoolean()
	isItemsReturned?: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ invoiceId: 1 }, {});
