import { QueryDto } from '@/common/dtos';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryMemberDto extends QueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
