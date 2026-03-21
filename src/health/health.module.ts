import { Module } from '@nestjs/common';
import { Healthcontroller } from './health.controller';

@Module({
  controllers: [Healthcontroller],
})
export class HealthModule {}
