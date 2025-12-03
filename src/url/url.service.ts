import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { generateRandomString } from '../common/utils/general.utils';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async updateUrl(shortCode: string, newSlug: string, userId: number) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode, deletedAt: null },
      select: { id: true, userId: true },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new UnauthorizedException(
        'Usuário não autorizado a atualizar esta URL',
      );
    }

    try {
      await this.prisma.url.update({
        where: { id: url.id },
        data: { shortCode: newSlug },
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          // slug deve ser único
          throw new ConflictException('slug já existente');
        }
      }
      throw new InternalServerErrorException('Erro ao atualizar slug');
    }

    return { shortUrl: `${process.env.ROOT_URL}/${newSlug}` };
  }

  async deleteUrl(shortCode: string, userId: number) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
      select: { id: true, userId: true },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new UnauthorizedException(
        'Usuário sem permissão para deletar esta URL',
      );
    }
    const deletedRandomCode = generateRandomString(30);
    await this.prisma.url.update({
      where: { id: url.id },
      data: { shortCode: deletedRandomCode, deletedAt: new Date() },
    });

    this.logger.info('Delete URL', {
      context: 'URLService',
      deletedCode: shortCode,
      timestamp: new Date().toISOString(),
      action: 'DELETE_URL',
    });

    return { shortUrl: `${process.env.ROOT_URL}/${shortCode}` };
  }

  async getByShortCode(shortCode: string) {
    const result = await this.prisma.url.findUnique({
      where: { shortCode, deletedAt: null },
      select: { originalUrl: true },
    });
    if (!result) {
      throw new NotFoundException('Link não encontrado');
    }

    await this.prisma.url.update({
      where: { shortCode },
      data: { accessCount: { increment: 1 } },
    });

    this.logger.info('Access URL', {
      context: 'URLService',
      shortCode,
      timestamp: new Date().toISOString(),
      action: 'ACCESS_URL',
    });

    return result.originalUrl;
  }

  async myUrls(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      orderBy?: Prisma.UrlOrderByWithRelationInput;
    },
  ) {
    const { skip, take, orderBy } = params;
    const page = Math.max(1, take);
    const finalTake = Math.max(1, Math.min(100, page));
    const finalSkip = (skip - 1) * finalTake;
    const where = {
      userId,
      deletedAt: null,
    };
    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.url.count({ where }),
      this.prisma.url.findMany({
        where,
        omit: {
          deletedAt: true,
          updatedAt: true,
        },
        skip: finalSkip,
        take: finalTake,
        orderBy,
      }),
    ]);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / finalTake);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    return { totalItems, totalPages, currentPage, perPage: finalTake, items };
  }

  async shortenUrl(originalUrl: string, userId: number) {
    let shortCode = this.generateShortCode();
    let attempts = 20;
    let existingCode: { shortCode: string } | null = null;

    while (attempts > 0) {
      existingCode = await this.prisma.url.findUnique({
        where: {
          shortCode: shortCode,
        },
        select: {
          shortCode: true,
        },
      });
      if (existingCode?.shortCode === shortCode) {
        shortCode = this.generateShortCode();
        attempts--;
        continue;
      }
      break;
    }
    if (!attempts) {
      this.logger.error('Shorten URL', {
        context: 'URLService',
        msg: 'Incapaz de gerar um novo slug',
        timestamp: new Date().toISOString(),
        action: 'SHORTEN_URL',
      });
      throw new InternalServerErrorException('Incapaz de gerar um novo slug');
    }
    const result = await this.prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        userId,
      },
    });
    if (!result.id) {
      this.logger.error('Shorten URL', {
        context: 'URLService',
        msg: 'Erro ao encurtar a URL',
        timestamp: new Date().toISOString(),
        action: 'SHORTEN_URL',
      });
      throw new InternalServerErrorException('Erro ao encurtar a URL');
    }

    this.logger.info('Shorten URL', {
      context: 'URLService',
      shortCode,
      timestamp: new Date().toISOString(),
      action: 'SHORTEN_URL',
    });
    return { shortUrl: `${process.env.ROOT_URL}/${shortCode}` };
  }

  /**
   * Gera um código curto de 6 caracteres usando hash
   * @param url - URL original a ser encurtada
   * @returns Código de 6 caracteres
   */
  generateShortCode(): string {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      const random = crypto.getRandomValues(new Uint32Array(1))[0];
      code += characters[random % characters.length];
    }
    return code;
  }
}
