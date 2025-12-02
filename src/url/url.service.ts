import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlService {
  hello(): string {
    return 'hello urls';
  }
}
