import { Module } from '@nestjs/common';
import { BaristaController } from './barista.controller.js';
import { BaristaService } from './barista.service.js';

@Module({
  controllers: [BaristaController],
  providers: [BaristaService],
})
export class BaristaModule {}