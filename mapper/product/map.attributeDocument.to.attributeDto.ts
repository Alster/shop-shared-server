import { AttributeDto } from "../../../shop-shared/dto/product/attribute.dto";
import { getTranslation } from "../../helpers/translationHelpers";
import { ItemAttributeDocument } from "../../schema/itemAttribute.schema";

export function mapAttributeDocumentToAttributeDto(
	object: ItemAttributeDocument,
	lang: string,
): AttributeDto {
	return {
		id: object._id.toString(),
		title: getTranslation(object.title, lang),
		description: getTranslation(object.description, lang),
		key: object.key,
		type: object.type,
		values: object.values.map((value) => {
			return {
				key: value.key,
				title: getTranslation(value.title, lang),
			};
		}),
		active: object.active,
		createDate: "no any date ololo",
	};
}
