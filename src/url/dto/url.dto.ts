import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class ShortenDTO {
  @Type(() => String)
  @IsString()
  url: string;
}

export type ShortenResponseDTO = {
  shortUrl: string;
  error?: string;
};
