import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { User as UserModel } from '../generated/prisma/client';
import { CreateUserDTO } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async create(@Body() data: CreateUserDTO): Promise<UserModel> {
    return this.userService.createUser(data);
  }

  @Get()
  async findByEmail(@Query('email') email: string) {
    return this.userService.user({ email }, false);
  }
}
