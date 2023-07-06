import {
  CategoriesTreeDocument,
  CategoryNode,
} from '../../schema/categories-tree.schema';
import {
  CategoriesNodeDto,
  CategoriesTreeDto,
} from '../../../shop-shared/dto/category/categories-tree.dto';

function mapCategoryNodeToCategoriesNodeDTO(
  obj: CategoryNode,
  lang: string,
): CategoriesNodeDto {
  return {
    id: obj._id.toString(),
    publicId: obj.publicId,
    title: obj.title[lang],
    description: obj.title[lang],
    children: obj.children.map((child) =>
      mapCategoryNodeToCategoriesNodeDTO(child, lang),
    ),
    sort: obj.sort,
    active: obj.active,
  };
}

export function mapCategoriesTreeDocumentToCategoriesTreeDTO(
  obj: CategoriesTreeDocument,
  lang: string,
): CategoriesTreeDto {
  return {
    root: obj.root.map((o) => mapCategoryNodeToCategoriesNodeDTO(o, lang)),
  };
}
