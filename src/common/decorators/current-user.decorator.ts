import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserJWTPayload } from '../types/general.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user as UserJWTPayload | undefined;
  },
);

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserJWTPayload => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as UserJWTPayload | undefined;
    if (!user) {
      throw new UnauthorizedException(
        'User must be logged in to access this resource',
      );
    }
    return user;
  },
);
