import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDTO {
  @ApiProperty({
    example: 'admin-test@email.com',
    description: 'email do usuário',
  })
  @Type(() => String)
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'nome do usuário',
  })
  @IsOptional()
  @Type(() => String)
  name?: string | null;

  @ApiProperty({
    description: 'senha do usuário, mínimo de 4 caracteres',
    minLength: 4,
  })
  @IsString()
  @Type(() => String)
  @MinLength(4, { message: 'password must be at least 4 characters long' })
  password: string;
}

export class UpdateUserDto {
  email: string;
  name?: string | null;
}

export class PaginationQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;
}
