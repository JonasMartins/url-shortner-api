import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import { UserJWTPayload } from 'src/common/types/general.type';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ShortenDTO } from './dto/url.dto';
import { UrlService } from './url.service';

@Controller()
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Get('my-urls')
  async myUrls(
    @AuthUser() user: UserJWTPayload,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.urlService.myUrls(user.userId, {
      take: limit || 10,
      skip: page || 1,
      orderBy: {
        id: 'desc',
      },
    });
  }

  @Post('shorten/')
  async shorten(@Body() data: ShortenDTO, @AuthUser() user: UserJWTPayload) {
    const result = await this.urlService.shortenUrl(data.url, user.userId);
    if (result.error) {
      throw new InternalServerErrorException(result.error);
    }
    return result;
  }
}
