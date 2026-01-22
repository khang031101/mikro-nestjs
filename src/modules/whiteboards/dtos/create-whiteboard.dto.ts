import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWhiteboardDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
