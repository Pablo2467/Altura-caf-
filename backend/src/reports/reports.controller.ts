import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ReportsService } from './reports.service.js';
import { HistoryQueryDto, RangeQueryDto } from './dto/report-query.dto.js';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('dashboard')
  dashboard(@Query() q: RangeQueryDto, @Req() req: any) {
    return this.reports.dashboard(q.range, req.user);
  }

  @Get('orders')
  history(@Query() q: HistoryQueryDto, @Req() req: any) {
    return this.reports.history(q, req.user);
  }
}