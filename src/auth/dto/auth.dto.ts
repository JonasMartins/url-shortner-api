import { Type } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { User } from '../../user/entities/user.entity';

export class LoginDTO {
  @Type(() => String)
  @IsEmail()
  email: string;

  @IsString()
  @Type(() => String)
  password: string;
}
export type JWTPayload = {
  email: string;
  sub: number;
};

export type LoginValidation = {
  email?: boolean;
  password?: boolean;
  user?: User;
};
