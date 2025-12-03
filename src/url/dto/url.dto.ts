import { Type } from 'class-transformer';

export class ShortenDTO {
  @Type(() => String)
  url: string;
}

export type ShortenResponseDTO = {
  shortUrl: string;
  error?: string;
};
