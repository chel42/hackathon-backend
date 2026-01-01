import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  async createAnnonce(@Body() createAnnonceDto: any) {
    return this.annonceService.create(createAnnonceDto);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques du dashboard (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Statistiques du dashboard' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('monitoring/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les logs IA et événements (Admin uniquement)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 50)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filtrer par type de log (ex: inscription_analysis)' })
  @ApiResponse({ status: 200, description: 'Liste des logs IA avec métadonnées de pagination' })
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
  @ApiOperation({ summary: 'Récupérer les métriques simples (Admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Métriques du système' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin uniquement' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }
}

