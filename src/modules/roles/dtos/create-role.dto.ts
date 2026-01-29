import { Permission } from '@/common/enums/permission.enum';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}
