import { Category } from '../../schema/category.schema';
import { LanguageEnum } from '../../../shop-shared/constants/localization';
import { CategoryDto } from '../../../shop-shared/dto/category/category.dto';

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
