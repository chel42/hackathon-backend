import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HackathonQueryDto {
  @ApiProperty({ required: false, example: 1, description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, example: 10, description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, example: 2024, description: 'Année pour filtrer les hackathons' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}

