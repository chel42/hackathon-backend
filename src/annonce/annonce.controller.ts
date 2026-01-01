import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AnnonceService } from './annonce.service';
import { CreateAnnonceDtoSchema } from './dto/create-annonce.dto.zod';
import { UpdateAnnonceDtoSchema } from './dto/update-annonce.dto.zod';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('annonces')
@Controller('annonces')
export class AnnonceController {
  constructor(private annonceService: AnnonceService) {}

  @Get('public')
  @ApiOperation({ summary: 'Récupérer toutes les annonces publiques' })
  @ApiResponse({ status: 200, description: 'Liste des annonces publiques' })
  async getPublicAnnonces() {
    return this.annonceService.getPublicAnnonces();
  }

  @Get('inscrits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les annonces pour les utilisateurs inscrits' })
  @ApiResponse({ status: 200, description: 'Liste des annonces pour inscrits' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getAnnoncesInscrits(@Request() req) {
    return this.annonceService.getAnnoncesInscrits(req.user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiOperation({ summary: 'Récupérer les détails d\'une annonce' })
  @ApiResponse({ status: 200, description: 'Détails de l\'annonce' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async getAnnonceById(@Param('id') id: string) {
    return this.annonceService.getAnnonceById(id);
  }

  @Post('admin/annonces')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ZodValidation(CreateAnnonceDtoSchema)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle annonce (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Annonce créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  @ApiResponse({ status: 404, description: 'Hackathon non trouvé' })
  async create(@Body() createAnnonceDto: any) {
    return this.annonceService.create(createAnnonceDto);
  }

  @Put('admin/annonces/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ZodValidation(UpdateAnnonceDtoSchema)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiOperation({ summary: 'Modifier une annonce (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Annonce modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async updateAnnonce(@Param('id') id: string, @Body() updateDto: any) {
    return this.annonceService.updateAnnonce(id, updateDto);
  }

  @Delete('admin/annonces/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID de l\'annonce' })
  @ApiOperation({ summary: 'Supprimer une annonce (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async deleteAnnonce(@Param('id') id: string) {
    return this.annonceService.deleteAnnonce(id);
  }
}

