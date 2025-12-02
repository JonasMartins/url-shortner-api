import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { AuthModule } from './auth/auth.module';
import { UrlService } from './url/url.service';
import { UrlController } from './url/url.controller';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    UrlModule,
  ],
  controllers: [AppController, UserController, UrlController],
  providers: [AppService, PrismaService, UserService, UserService, UrlService],
})
export class AppModule {}
