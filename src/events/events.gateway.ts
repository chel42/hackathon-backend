import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
    client.emit('connected', { message: 'Connecté au serveur d\'événements' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  @SubscribeMessage('subscribe-dashboard')
  handleSubscribeDashboard(client: Socket) {
    this.logger.log(`Client ${client.id} s'est abonné au dashboard`);
    client.join('dashboard');
    client.emit('subscribed', { room: 'dashboard' });
  }

  @SubscribeMessage('unsubscribe-dashboard')
  handleUnsubscribeDashboard(client: Socket) {
    this.logger.log(`Client ${client.id} s'est désabonné du dashboard`);
    client.leave('dashboard');
  }

  /**
   * Émet un événement de nouvelle inscription
   */
  emitNewInscription(data: {
    userId: string;
    hackathonId: string;
    inscriptionId: string;
    userEmail: string;
    userName: string;
  }) {
    this.server.to('dashboard').emit('new-inscription', {
      type: 'new-inscription',
      data,
      timestamp: new Date(),
    });
    this.logger.log(`Événement new-inscription émis pour ${data.userEmail}`);
  }

  /**
   * Émet un événement de mise à jour des stats
   */
  emitStatsUpdate(stats: {
    totalInscrits: number;
    parPromo: Array<{ promo: string; count: number }>;
    parTechnologie: Array<{ technologie: string; count: number }>;
  }) {
    this.server.to('dashboard').emit('stats-update', {
      type: 'stats-update',
      data: stats,
      timestamp: new Date(),
    });
    this.logger.log('Événement stats-update émis');
  }
}

