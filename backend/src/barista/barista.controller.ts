import { Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BaristaService } from './barista.service.js';

@Controller('barista')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BARISTA, Role.ADMIN)
export class BaristaController {
  constructor(private barista: BaristaService) {}

  @Get('orders')
  list(@Req() req: any) {
    return this.barista.list(req.user);
  }

  @Patch('orders/:id/start')
  start(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.barista.start(id, req.user);
  }

  @Patch('orders/:id/ready')
  ready(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.barista.markReady(id, req.user);
  }
}