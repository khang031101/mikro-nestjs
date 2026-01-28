import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import type { ButtonStyle } from '../cards.interface';

export class CardThemeDto {
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @IsHexColor()
  @IsOptional()
  backgroundColor?: string;

  @IsHexColor()
  @IsOptional()
  textColor?: string;

  @IsEnum(['rounded', 'square', 'pill'])
  @IsOptional()
  buttonStyle?: ButtonStyle;
}

export class CardLinkDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  iconKey?: string;

  @IsOptional()
  order?: number;
}

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsUrl()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CardThemeDto)
  themeConfig?: CardThemeDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CardLinkDto)
  links?: CardLinkDto[];
}
