# Shorten URL API - LOGGER

## 1. Setup Inicial Winston

Para a geração de logs, foi utilizado o winston para a apuração de logs e escrita em arquivos,
além de um rotação dos arquivos baseado no dia atual.

source: [NestJS Logger Tutorial](https://docs.nestjs.com/techniques/logger)
source: [Nest Winston](https://www.npmjs.com/package/nest-winston)

```ts
//src/common/providers/logger.provider.ts
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  transports: [
    new (winston.transports as any).DailyRotateFile({
      dirname: 'logs',
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '30d',
      maxSize: '20m',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.Console({
      level: 'error',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

export const LoggerProvider = {
  provide: WINSTON_MODULE_NEST_PROVIDER,
  useValue: logger,
};
```

## 2. Utilização nos módulos

Após a definição de um provider, e a sua inserção em **AppModule**, basta que qualquer módulo o importe como
provider e passa a ser acessível de um serviço ou controller.

```ts
import { Module } from '@nestjs/common';
import { LoggerProvider } from '../common/providers/logger.provider';
import { PrismaService } from '../prisma/prisma.service';
import { UrlService } from './url.service';

@Module({
  providers: [PrismaService, UrlService, LoggerProvider],
  exports: [UrlService],
})
export class UrlModule {}
```

```ts
// src/url/url.service.ts
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
```

Resultado: logs/2025-12-04.log

```json
{"action":"USER_LOGIN","context":"AuthService","email":"admin@email.com","level":"info","message":"Login","timestamp":"2025-12-04T11:57:39.924Z"}
{"action":"SHORTEN_URL","context":"URLService","level":"info","message":"Shorten URL","shortCode":"LMziph","timestamp":"2025-12-04T11:58:20.381Z"}
{"action":"ACCESS_URL","context":"URLService","level":"info","message":"Access URL","shortCode":"LMziph","timestamp":"2025-12-04T11:58:54.026Z"}
```
