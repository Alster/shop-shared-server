import { ProductDocument } from '../../schema/product.schema';
import { getTranslation } from '../../helpers/translation-helpers';
import { ProductDto } from 'shop-shared/dto/product/product.dto';

export function mapProductDocumentToProductDto(
  obj: ProductDocument,
  lang: string,
): ProductDto {
  return {
    id: obj._id.toString(),
    publicId: obj.publicId,
    title: getTranslation(obj.title, lang),
    description: getTranslation(obj.description, lang),
    categories: obj.categories.map((category) => category.toString()),
    characteristics: obj.characteristics,
    items: obj.items,
    attrs: obj.attrs,
    quantity: obj.quantity,
    price: obj.price,
    discount: obj.discount,
    active: obj.active,
    createDate: 'no any date ololo',
  };
}
