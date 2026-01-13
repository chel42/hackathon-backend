import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AddMemberDtoSchema } from './dto/add-member.dto.zod';
import { CreateTeamDtoSchema } from './dto/create-team.dto.zod';
import { UpdateTeamDtoSchema } from './dto/update-team.dto.zod';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Récupérer les équipes publiques' })
  async getPublicTeams() {
    return this.teamsService.getPublicTeams();
  }

  @Get('hackathon/:hackathonId')
  @ApiParam({ name: 'hackathonId', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Lister les équipes publiques pour un hackathon' })
  async getTeamsByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.teamsService.getPublicTeamsByHackathon(hackathonId);
  }

  @Get('admin/hackathon/:hackathonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'hackathonId', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Lister toutes les équipes pour un hackathon (Admin)' })
  async getAllTeamsByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.teamsService.getTeamsByHackathon(hackathonId);
  }

  @Post('hackathon/:hackathonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'hackathonId', description: 'ID du hackathon' })
  @ApiOperation({ summary: 'Créer une équipe (Admin)' })
  @ZodValidation(CreateTeamDtoSchema)
  async createTeam(
    @Param('hackathonId') hackathonId: string,
    @Body() payload: any,
  ) {
    return this.teamsService.createTeam(hackathonId, payload);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'équipe" })
  @ApiOperation({ summary: 'Récupérer une équipe (Admin)' })
  async getTeamById(@Param('id') id: string) {
    return this.teamsService.getTeamById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'équipe" })
  @ApiOperation({ summary: 'Mettre à jour une équipe (Admin)' })
  @ZodValidation(UpdateTeamDtoSchema)
  async updateTeam(@Param('id') id: string, @Body() payload: any) {
    return this.teamsService.updateTeam(id, payload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: "ID de l'équipe" })
  @ApiOperation({ summary: 'Supprimer une équipe (Admin)' })
  async deleteTeam(@Param('id') id: string) {
    return this.teamsService.deleteTeam(id);
  }

  @Post(':teamId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'teamId', description: "ID de l'équipe" })
  @ApiOperation({ summary: 'Ajouter un membre (Admin)' })
  @ZodValidation(AddMemberDtoSchema)
  async addMember(@Param('teamId') teamId: string, @Body() payload: any) {
    return this.teamsService.addMemberToTeam(
      teamId,
      payload.userId,
      payload.role,
    );
  }

  @Delete(':teamId/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'teamId', description: "ID de l'équipe" })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiOperation({ summary: 'Retirer un membre (Admin)' })
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.teamsService.removeMemberFromTeam(teamId, userId);
  }
}
