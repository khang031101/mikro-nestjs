import { QueryDto } from '@/common/dtos';
import { IsOptional, IsString } from 'class-validator';

export class QueryCardDto extends QueryDto {
  @IsString()
  @IsOptional()
  search?: string;
}
