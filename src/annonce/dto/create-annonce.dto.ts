import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MinLength } from 'class-validator';
import { AnnonceCible } from '@prisma/client';

export class CreateAnnonceDto {
  @ApiProperty({ example: 'Nouvelle annonce importante' })
  @IsString()
  @MinLength(1)
  titre: string;

  @ApiProperty({ example: 'Contenu de l\'annonce...' })
  @IsString()
  @MinLength(1)
  contenu: string;

  @ApiProperty({ enum: AnnonceCible, example: AnnonceCible.PUBLIC })
  @IsEnum(AnnonceCible)
  cible: AnnonceCible;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  hackathonId?: string;
}

