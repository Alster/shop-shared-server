import { OrderDocument } from '../../schema/order.schema';
import { OrderAdminDto } from '../../../shop-shared/dto/order/order.dto';

export function mapOrderDocumentToOrderAdminDto(
  orderDocument: OrderDocument,
): OrderAdminDto {
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
    statusHistory: orderDocument.statusHistory,
  };
}
