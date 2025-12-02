import { Controller, Get } from '@nestjs/common';
import { UrlService } from './url.service';

@Controller('my-urls')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Get()
  hello() {
    return this.urlService.hello();
  }
}
