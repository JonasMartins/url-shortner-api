import { Controller, Get } from '@nestjs/common';
import { UserJWTPayload } from 'src/common/types/general.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UrlService } from './url.service';

@Controller('my-urls')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Get()
  hello(@CurrentUser() user?: UserJWTPayload) {
    console.log('logged ? ', user);
    return this.urlService.hello();
  }
}
