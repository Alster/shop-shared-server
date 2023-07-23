import { Optional } from "@nestjs/common";
import {
	IsArray,
	IsBoolean,
	IsDateString,
	IsEnum,
	IsInt,
	IsNumber,
	IsObject,
	IsString,
	Min,
} from "class-validator";

import { CurrencyEnum } from "../../shop-shared/constants/exchange";
import { MoneySmall } from "../../shop-shared/dto/primitiveTypes";
import {
	ProductAdminDto,
	ProductAttributesDto,
	ProductItemDto,
} from "../../shop-shared/dto/product/product.dto";
import { TranslatedText } from "../../shop-shared/dto/translatedText";

export class UpdateProductRequestDto implements ProductAdminDto {
	@IsString()
	@Optional()
	id?: string;

	@IsString()
	publicId!: string;

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
	@IsEnum(CurrencyEnum)
	currency!: CurrencyEnum;

	@IsObject()
	imagesByColor!: Record<string, string[]>;

	@IsBoolean()
	active!: boolean;

	@IsDateString()
	createDate!: string;
}
