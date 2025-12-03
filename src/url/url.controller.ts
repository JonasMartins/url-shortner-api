import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserJWTPayload } from 'src/common/types/general.type';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ShortenDTO, UpdateShortenDTO } from './dto/url.dto';
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
    return await this.urlService.shortenUrl(data.url, user.userId);
  }

  @Delete('my-urls/:shortCode')
  @HttpCode(204)
  async delete(
    @AuthUser() user: UserJWTPayload,
    @Param('shortCode') shortCode: string,
  ) {
    await this.urlService.deleteUrl(shortCode, user.userId);
  }

  @Put('my-urls/:shortCode')
  async update(
    @AuthUser() user: UserJWTPayload,
    @Param('shortCode') shortCode: string,
    @Body() body: UpdateShortenDTO,
  ) {
    await this.urlService.updateUrl(shortCode, body.url, user.userId);
  }
}
