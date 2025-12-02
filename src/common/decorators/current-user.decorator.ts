import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJWTPayload } from '../types/general.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user as UserJWTPayload | undefined;
  },
);
