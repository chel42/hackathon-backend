import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AnnonceService } from '../annonce/annonce.service';
import { CreateAnnonceDtoSchema } from '../annonce/dto/create-annonce.dto.zod';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private annonceService: AnnonceService,
  ) {}

  @Post('annonces')
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
  async createAnnonce(@Body() createAnnonceDto: any, @Request() req) {
    return this.annonceService.create(createAnnonceDto, req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les statistiques du dashboard (Admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques du dashboard' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('inscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer toutes les inscriptions (Admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Liste de toutes les inscriptions' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getAllInscriptions() {
    return this.adminService.getAllInscriptions();
  }

  @Get('monitoring/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les logs IA et événements (Admin uniquement)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut: 50)",
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filtrer par type de log (ex: inscription_analysis)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des logs IA avec métadonnées de pagination',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getMonitoringLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    return this.adminService.getMonitoringLogs(page, limit, type);
  }

  @Get('monitoring/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les métriques simples (Admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Métriques du système' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  // ============================================
  // GESTION DES INSCRIPTIONS (Admin uniquement)
  // ============================================

  @Put('inscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'inscription" })
  @ApiOperation({
    summary:
      'Modifier une inscription (Admin uniquement) - Principalement pour changer le statut',
  })
  @ApiResponse({ status: 200, description: 'Inscription modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
  async updateInscription(
    @Param('id') id: string,
    @Body() updateDto: { statut?: string; promo?: string; technologies?: any },
  ) {
    return this.adminService.updateInscription(id, updateDto);
  }

  @Delete('inscriptions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'inscription" })
  @ApiOperation({ summary: 'Supprimer une inscription (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Inscription supprimée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
  async deleteInscription(@Param('id') id: string) {
    return this.adminService.deleteInscription(id);
  }

  // ============================================
  // GESTION DES UTILISATEURS (Admin uniquement)
  // ============================================

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer tous les utilisateurs (Admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Liste de tous les utilisateurs' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiOperation({ summary: 'Modifier un utilisateur (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Utilisateur modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Email déjà utilisé' })
  async updateUser(
    @Param('id') id: string,
    @Body()
    updateDto: { nom?: string; prenom?: string; email?: string; role?: string },
  ) {
    return this.adminService.updateUser(id, updateDto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer le dernier administrateur',
  })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  async getProfile(@Request() req) {
    return this.adminService.getUserProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  async updateProfile(@Request() req, @Body() updateData: { nom?: string; prenom?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    return this.adminService.updateUserProfile(req.user.id, updateData);
  }
}



