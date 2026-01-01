import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsUUID } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  prenom: string;

  @ApiProperty({ example: '2024', required: false })
  @IsOptional()
  @IsString()
  promo?: string;

  @ApiProperty({ example: ['React', 'Node.js'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID du hackathon pour lequel s\'inscrire' })
  @IsUUID()
  hackathonId: string;
}

