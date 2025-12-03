import { Module } from '@nestjs/common';
import { LoggerProvider } from '../common/providers/logger.provider';
import { PrismaService } from '../prisma/prisma.service';
import { UrlService } from './url.service';

@Module({
  providers: [PrismaService, UrlService, LoggerProvider],
  exports: [UrlService],
})
export class UrlModule {}
