import { Controller, Post, Get, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiService, AnalysisResult } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze-inscription/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyser une inscription utilisateur avec IA (Admin uniquement)' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur à analyser' })
  @ApiResponse({ status: 200, description: 'Analyse effectuée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async analyzeInscription(@Param('userId') userId: string) {
    return this.aiService.analyzeInscription(userId);
  }
}

