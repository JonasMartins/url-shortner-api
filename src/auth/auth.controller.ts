import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDTO) {
    const validation = await this.authService.validateUser(body);
    if (validation.user) {
      return this.authService.login(validation.user);
    }
    if (validation.email) {
      throw new NotFoundException('User not found');
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
