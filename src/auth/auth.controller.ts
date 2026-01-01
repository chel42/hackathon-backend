import { Controller, Post, Body, UseGuards, Request, Get, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDtoSchema } from './dto/register.dto.zod';
import { LoginDtoSchema } from './dto/login.dto.zod';
import { ChangePasswordDtoSchema } from './dto/change-password.dto.zod';
import { UpdateProfileDtoSchema } from './dto/update-profile.dto.zod';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ZodValidation(RegisterDtoSchema)
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ZodValidation(LoginDtoSchema)
  @ApiOperation({ summary: 'Connexion d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ZodValidation(UpdateProfileDtoSchema)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async updateProfile(@Request() req, @Body() updateDto: any) {
    return this.authService.updateProfile(req.user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ZodValidation(ChangePasswordDtoSchema)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  async changePassword(@Request() req, @Body() changePasswordDto: any) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}

