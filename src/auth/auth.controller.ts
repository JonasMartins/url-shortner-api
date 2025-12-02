import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile() {
    return 'protected route';
  }
}
