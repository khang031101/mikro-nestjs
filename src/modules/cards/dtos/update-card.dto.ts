import { PartialType } from '@nestjs/swagger';
import { CreateCardDto } from './create-card.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
