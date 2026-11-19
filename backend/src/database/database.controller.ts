import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DatabaseService } from './database.service.js';

@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DatabaseController {
  constructor(private database: DatabaseService) {}

  @Get()
  overview() {
    return this.database.overview();
  }

  @Get(':table')
  table(
    @Param('table') table: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.database.table(table, page);
  }
}