import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Public()
  @ApiOperation({ summary: 'Checa a saúde da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'A aplicação está rodando corretamente',
  })
  @Get('health')
  @HttpCode(200)
  health() {}
}
