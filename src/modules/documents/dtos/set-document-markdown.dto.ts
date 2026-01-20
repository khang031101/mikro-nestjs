import { IsNotEmpty, IsString } from 'class-validator';

export class SetDocumentMarkdownDto {
  @IsNotEmpty()
  @IsString()
  markdown: string;
}
