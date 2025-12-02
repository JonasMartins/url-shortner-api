import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UrlService } from './url.service';

@Module({
  providers: [PrismaService, UrlService],
  exports: [UrlService],
})
export class UrlModule {}
