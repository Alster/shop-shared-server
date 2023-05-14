import { Category } from '../schema/category.schema';
import { LanguageEnum } from '../../shop_shared/constants/localization';
import { CategoryDto } from '../../shop_shared/dto/category.dto';

export function mapCategoryToCategoryDto(
  obj: Category,
  language: LanguageEnum,
): CategoryDto {
  return {
    id: obj._id.toString(),
    title: obj.title[language],
    description: obj.title[language],
    children: obj.children.map((id) => id.toString()),
    parents: obj.parents.map((id) => id.toString()),
    sort: obj.sort,
  };
}
