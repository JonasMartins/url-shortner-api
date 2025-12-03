import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { User } from '../../user/entities/user.entity';

export class LoginDTO {
  @ApiProperty({
    example: 'admin-test@email.com',
    description: 'email do usuário',
  })
  @Type(() => String)
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'senha do usuário',
  })
  @IsString()
  @Type(() => String)
  password: string;
}
export type JWTPayload = {
  username: string;
  sub: number;
};

export type LoginValidation = {
  email?: boolean;
  password?: boolean;
  user?: User;
};
