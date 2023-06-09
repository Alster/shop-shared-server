import { ProductDocument } from '../../schema/product.schema';
import { ProductAdminDto } from '../../../shop-shared/dto/product/product.dto';

export function mapProductDocumentToProductAdminDto(
  obj: ProductDocument,
): ProductAdminDto {
  return {
    id: obj._id.toString(),
    publicId: obj.publicId,
    title: obj.title,
    description: obj.description,
    categories: obj.categories.map((category) => category.toString()),
    characteristics: obj.characteristics,
    items: obj.items,
    attrs: obj.attrs,
    quantity: obj.quantity,
    price: obj.price,
    discount: obj.discount,
    currency: obj.currency,
    active: obj.active,
    createDate: 'no any date ololo',
  };
}
