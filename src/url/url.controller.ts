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
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserJWTPayload } from 'src/common/types/general.type';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ShortenDTO, UpdateShortenDTO } from './dto/url.dto';
import { UrlService } from './url.service';

@ApiTags('Urls')
@Controller()
export class UrlController {
  constructor(private urlService: UrlService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retorna a lista de Urls do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Retorna a lista de urls paginada do usuário',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Quantidade de itens por página (padrão: 10)',
    type: Number,
  })
  @Get('my-urls')
  async myUrls(
    @AuthUser() user: UserJWTPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.urlService.myUrls(user.userId, {
      take: limit || 10,
      skip: page || 1,
      orderBy: {
        id: 'desc',
      },
    });
  }

  @Public()
  @ApiOperation({
    summary: 'Redireciona para URL original a partir do código encurtado',
  })
  @ApiParam({
    name: 'shortCode',
    description: 'Código encurtado da URL',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 302,
    description:
      'Redireciona para a URL original a partir do código encurtado e incrementa o contador de acessos',
  })
  @Get(':shortCode')
  async short(@Param('shortCode') shortCode: string, @Res() res) {
    const url = await this.urlService.getByShortCode(shortCode);
    return res.status(302).redirect(url);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Cria um código encurtado para a URL fornecida e associa ao usuário autenticado',
  })
  @ApiResponse({
    status: 201,
    description:
      'Cria um novo código encurtado para a URL fornecida, e associa ao usuário autenticado',
  })
  @ApiResponse({ status: 400, description: 'URL inválida' })
  @Post('shorten/')
  async shorten(@Body() data: ShortenDTO, @AuthUser() user: UserJWTPayload) {
    return await this.urlService.shortenUrl(data.url, user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Deleta o código encurtador impedindo que seja listado como link válido',
  })
  @ApiResponse({
    status: 204,
    description: 'URL deletado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({ status: 401, description: 'Acesso negado' })
  @Delete('my-urls/:shortCode')
  @HttpCode(204)
  async delete(
    @AuthUser() user: UserJWTPayload,
    @Param('shortCode') shortCode: string,
  ) {
    await this.urlService.deleteUrl(shortCode, user.userId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Atualiza o código encurtado para um novo código fornecido pelo usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({ status: 401, description: 'Acesso negado' })
  @Put('my-urls/:shortCode')
  async update(
    @AuthUser() user: UserJWTPayload,
    @Param('shortCode') shortCode: string,
    @Body() body: UpdateShortenDTO,
  ) {
    await this.urlService.updateUrl(shortCode, body.url, user.userId);
  }
}
