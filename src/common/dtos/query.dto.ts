import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class QueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 10;

  get skip(): number {
    if (!this.page || !this.pageSize) {
      return 0;
    }
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    if (!this.pageSize) {
      return 10;
    }
    return this.pageSize;
  }
}
