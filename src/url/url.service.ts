import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShortenResponseDTO } from './dto/url.dto';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService) {}

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

  async shortenUrl(
    originalUrl: string,
    userId: number,
  ): Promise<ShortenResponseDTO> {
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
      return { shortUrl: '', error: 'Unable to generate a new slug' };
    }
    const result = await this.prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        userId,
      },
    });
    if (!result.id) {
      return { shortUrl: '', error: 'Failed to shorten URL' };
    }
    return { shortUrl: shortCode };
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
