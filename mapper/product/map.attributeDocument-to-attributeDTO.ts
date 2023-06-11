import { ItemAttributeDocument } from '../../schema/item-attribute.schema';
import { getTranslation } from '../../helpers/translation-helpers';
import { AttributeDto } from '../../../shop-shared/dto/product/attribute.dto';

export function mapAttributeDocumentToAttributeDTO(
  obj: ItemAttributeDocument,
  lang: string,
): AttributeDto {
  return {
    id: obj._id.toString(),
    title: getTranslation(obj.title, lang),
    description: getTranslation(obj.description, lang),
    key: obj.key,
    type: obj.type,
    values: obj.values.map((value) => {
      return {
        key: value.key,
        title: getTranslation(value.title, lang),
      };
    }),
    active: obj.active,
    createDate: 'no any date ololo',
  };
}
