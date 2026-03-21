import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class Healthcontroller {
  @Get()
  check() {
    return { status: 'ok', timeStamp: new Date().toISOString() };
  }
}
