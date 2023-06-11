import { OrderDocument } from '../../schema/order.schema';
import { OrderDto } from '../../../shop-shared/dto/order/order.dto';

export function mapOrderDocumentToOrderDto(
  orderDocument: OrderDocument,
): OrderDto {
  return {
    id: orderDocument._id.toString(),
    lastName: orderDocument.lastName,
    firstName: orderDocument.firstName,
    phoneNumber: orderDocument.phoneNumber,
    itemsData: orderDocument.itemsData,
    delivery: orderDocument.delivery,
    totalPrice: orderDocument.totalPrice,
    currency: orderDocument.currency,
    status: orderDocument.status,
    createDate: orderDocument.createDate.toISOString(),
  };
}
