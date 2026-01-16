import { IsInt, Min } from 'class-validator';

export class RestoreDocumentVersionDto {
  @IsInt()
  @Min(1)
  version: number;
}
