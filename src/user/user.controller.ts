import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { User as UserModel } from '../generated/prisma/client';
import { CreateUserDto } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: CreateUserDto): Promise<UserModel> {
    return this.userService.createUser(data);
  }

  @Get()
  async findByEmail(@Query('email') email: string) {
    return this.userService.user({ email });
  }
}
