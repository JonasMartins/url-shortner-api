import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { UserJWTPayload } from 'src/common/types/general.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ShortenDTO } from './dto/url.dto';
import { UrlService } from './url.service';

@Controller()
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Post('shorten/')
  async shorten(
    @Body() data: ShortenDTO,
    @CurrentUser() user?: UserJWTPayload,
  ) {
    if (!user) {
      throw new UnauthorizedException('User must be logged in to shorten URLs');
    }
    const result = await this.urlService.shortenUrl(data.url, user.userId);
    if (result.error) {
      throw new InternalServerErrorException(result.error);
    }
    return result;
  }
}
