import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('status')
export class StatusController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  getStatus() {
    const dbReady = this.connection.readyState === 1;
    return {
      status: dbReady ? 'ok' : 'degraded',
      service: 'punto-cafe-api',
      time: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: dbReady ? 'connected' : 'disconnected',
    };
  }
}
