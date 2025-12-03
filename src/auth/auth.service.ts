import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { JWTPayload, LoginDTO, LoginValidation } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async validateUser(data: LoginDTO): Promise<LoginValidation> {
    const user = await this.userService.user({ email: data.email }, true);
    if (!user) {
      return {
        email: true,
      };
    }

    if (await this.userService.validateHash(data.password, user.password)) {
      return {
        user,
      };
    }
    return { password: true };
  }

  async login(user: User) {
    const payload = { username: user.email, sub: user.id } as JWTPayload;
    this.logger.info('Login', {
      context: 'AuthService',
      email: user.email,
      timestamp: new Date().toISOString(),
      action: 'USER_LOGIN',
    });
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
