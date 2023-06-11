import {
  ProductAdminDto,
  ProductAttributesDto,
  ProductItemDto,
} from '../../shop-shared/dto/product/product.dto';
import { TranslatedText } from '../../shop-shared/dto/translated-text';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  Min,
} from 'class-validator';
import { CURRENCY } from '../../shop-shared/constants/exchange';
import { MoneySmall } from '../../shop-shared/dto/primitiveTypes';

export class UpdateProductRequestDto implements ProductAdminDto {
  @IsString()
  id?: string;

  @IsObject()
  title!: TranslatedText;

  @IsObject()
  description!: TranslatedText;

  @IsArray()
  categories!: string[];

  @IsObject()
  characteristics!: ProductAttributesDto;

  @IsArray()
  items!: ProductItemDto[];

  @IsObject()
  attrs!: ProductAttributesDto;

  @IsNumber()
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  price!: MoneySmall;

  @IsNumber()
  @IsInt()
  @Min(0)
  discount!: number;

  @IsString()
  @IsEnum(CURRENCY)
  currency!: CURRENCY;

  @IsBoolean()
  active!: boolean;

  createDate!: string;
}
