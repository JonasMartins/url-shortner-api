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
  @Type(() => String)
  @IsEmail()
  email: string;

  @IsOptional()
  @Type(() => String)
  name?: string | null;

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
