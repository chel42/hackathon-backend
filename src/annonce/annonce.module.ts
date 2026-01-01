import { Module } from '@nestjs/common';
import { AnnonceController } from './annonce.controller';
import { AnnonceService } from './annonce.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule],
  controllers: [AnnonceController],
  providers: [AnnonceService],
  exports: [AnnonceService],
})
export class AnnonceModule {}

