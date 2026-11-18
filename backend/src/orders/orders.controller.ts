import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.WAITER, Role.ADMIN)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get('tables')
  tables(@Req() req: any) {
    return this.orders.listTables(req.user);
  }

  @Get('tables/:tableId/order')
  tableOrder(@Param('tableId', ParseIntPipe) tableId: number, @Req() req: any) {
    return this.orders.getTableOrder(tableId, req.user);
  }

  @Post('orders')
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orders.createOrAppend(dto, req.user);
  }

  @Patch('orders/:id/deliver')
  deliver(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.orders.deliver(id, req.user);
  }

  @Post('orders/:id/pay')
  pay(@Param('id', ParseIntPipe) id: number, @Body() dto: PayOrderDto, @Req() req: any) {
    return this.orders.pay(id, dto, req.user);
  }
}