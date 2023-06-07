import { ProductAttributesDto } from '../../shop_shared/dto/product/product.dto';
import { NovaPoshtaDeliveryType } from '../../shop_shared/constants/checkout';

export type CreateOrderItemDataDto = {
  productId: string;
  attrs: ProductAttributesDto;
  qty: number;
};

export type DeliveryNVOfficeDto = {
  cityName: string;
  officeName: string;
};

export type DeliveryNVCourierDto = {
  cityName: string;
  street: string;
  building: string;
  room: string;
};

export type DeliveryDataDto = {
  whereToDeliver: NovaPoshtaDeliveryType;
  data: DeliveryNVOfficeDto | DeliveryNVCourierDto;
};

export type CreateOrderDto = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  itemsData: CreateOrderItemDataDto[];
  delivery: DeliveryDataDto;
};
