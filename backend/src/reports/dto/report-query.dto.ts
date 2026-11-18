import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const RANGES = ['today', '7d', '30d'] as const;
export type RangeKey = (typeof RANGES)[number];

export class RangeQueryDto {
  @IsOptional()
  @IsIn(RANGES)
  range: RangeKey = 'today';
}

export class HistoryQueryDto extends RangeQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  pageSize: number = 10;
}