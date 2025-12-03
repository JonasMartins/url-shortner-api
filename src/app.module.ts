import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import 'winston-daily-rotate-file';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerProvider } from './common/providers/logger.provider';
import { PrismaService } from './prisma/prisma.service';
import { UrlController } from './url/url.controller';
import { UrlModule } from './url/url.module';
import { UrlService } from './url/url.service';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    UrlModule,
  ],
  controllers: [AppController, UserController, UrlController],
  providers: [
    AppService,
    PrismaService,
    UserService,
    UserService,
    UrlService,
    LoggerProvider,
  ],
  exports: [LoggerProvider],
})
export class AppModule {}
