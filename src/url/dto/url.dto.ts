import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class ShortenDTO {
  @ApiProperty({
    example: 'https://youtube.com',
    description: 'URL para ser encurtada',
  })
  @Type(() => String)
  @IsString()
  url: string;
}

export class UpdateShortenDTO {
  @ApiProperty({
    example: 'zwx-123_acbd',
    description:
      'Novo Slug para atualir uma URL encurtada já existente, deve conter entre 3 e 30 caracteres e seguir o padrão [a-z0-9\-_]',
  })
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
};
