import { Controller, Get, Query, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HackathonService } from './hackathon.service';
import { HackathonQueryDtoSchema } from './dto/hackathon-query.dto.zod';
import { CreateHackathonDtoSchema } from './dto/create-hackathon.dto.zod';
import { UpdateHackathonDtoSchema } from './dto/update-hackathon.dto.zod';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('hackathons')
@Controller('hackathons')
export class HackathonController {
  constructor(private hackathonService: HackathonService) {}

  @Get('public')
  @ApiOperation({ summary: 'Récupérer les informations du hackathon public actuel' })
  @ApiResponse({ status: 200, description: 'Informations du hackathon avec compte à rebours' })
  @ApiResponse({ status: 404, description: 'Aucun hackathon à venir trouvé' })
  async getPublicHackathon() {
    return this.hackathonService.getPublicHackathon();
  }

  @Get('past')
  @ZodValidation(HackathonQueryDtoSchema)
  @ApiOperation({ summary: 'Récupérer la liste des hackathons passés avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filtrer par année' })
  @ApiResponse({ status: 200, description: 'Liste des hackathons passés avec métadonnées de pagination' })
  async getPastHackathons(@Query() query: any) {
    return this.hackathonService.getPastHackathons(query.page || 1, query.limit || 10, query.year);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Récupérer les détails d\'un hackathon' })
  @ApiResponse({ status: 200, description: 'Détails du hackathon' })
  @ApiResponse({ status: 404, description: 'Hackathon non trouvé' })
  async getHackathonById(@Param('id') id: string) {
    return this.hackathonService.getHackathonById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ZodValidation(CreateHackathonDtoSchema)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau hackathon (Admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Hackathon créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async createHackathon(@Body() createDto: any) {
    return this.hackathonService.createHackathon(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ZodValidation(UpdateHackathonDtoSchema)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Modifier un hackathon (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Hackathon modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Hackathon non trouvé' })
  async updateHackathon(@Param('id') id: string, @Body() updateDto: any) {
    return this.hackathonService.updateHackathon(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Supprimer un hackathon (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Hackathon supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Hackathon non trouvé' })
  async deleteHackathon(@Param('id') id: string) {
    return this.hackathonService.deleteHackathon(id);
  }
}

