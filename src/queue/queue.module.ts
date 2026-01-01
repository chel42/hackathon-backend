import { Module, Logger } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { QueueService } from './queue.service';

const logger = new Logger('QueueModule');

@Module({
  imports: [EmailModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {
  constructor() {
    logger.log('✅ QueueModule initialisé - Mode SMTP direct (Redis désactivé)');
  }
}

