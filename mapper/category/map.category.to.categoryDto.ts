import { LanguageEnum } from "../../../shop-shared/constants/localization";
import { CategoryDto } from "../../../shop-shared/dto/category/category.dto";
import { Category } from "../../schema/category.schema";

export function mapCategoryToCategoryDto(object: Category, language: LanguageEnum): CategoryDto {
	return {
		id: object._id.toString(),
		publicId: object.publicId,
		title: object.title[language],
		description: object.title[language],
		children: object.children.map((id) => id.toString()),
		parents: object.parents.map((id) => id.toString()),
		sort: object.sort,
	};
}
