import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InscriptionsService } from './inscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('inscriptions')
@Controller('inscriptions')
export class InscriptionsController {
  constructor(private inscriptionsService: InscriptionsService) {}

  @Get('mes-inscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer mes inscriptions' })
  @ApiResponse({
    status: 200,
    description: "Liste des inscriptions de l'utilisateur",
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getMyInscriptions(@Request() req) {
    return this.inscriptionsService.getMyInscriptions(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'inscription" })
  @ApiOperation({ summary: "Récupérer les détails d'une inscription" })
  @ApiResponse({ status: 200, description: "Détails de l'inscription" })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
  async getInscriptionById(@Param('id') id: string, @Request() req) {
    return this.inscriptionsService.getInscriptionById(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'inscription" })
  @ApiOperation({ summary: 'Supprimer une inscription' })
  @ApiResponse({
    status: 200,
    description: 'Inscription supprimée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
  async deleteInscription(@Param('id') id: string, @Request() req) {
    return this.inscriptionsService.deleteInscription(
      id,
      req.user.id,
      req.user.role,
    );
  }
}
