import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot(): { status: 'ok'; service: 'emprest-ai-api' } {
    return {
      status: 'ok',
      service: 'emprest-ai-api',
    };
  }
}
