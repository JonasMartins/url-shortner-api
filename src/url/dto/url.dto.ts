import { Type } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class ShortenDTO {
  @Type(() => String)
  @IsString()
  url: string;
}

export class UpdateShortenDTO {
  @Type(() => String)
  @IsString({ message: 'deve ser uma string' })
  @Length(3, 30, { message: 'novo slug deve ter entre 3 e 30 caracteres' })
  @Matches(/^[a-z0-9\-_]+$/, {
    message:
      'novo slug deve conter apenas letras minúsculas, números, hifens e underscores',
  })
  url: string;
}

export type ShortenResponseDTO = {
  shortUrl: string;
  error?: string;
};
