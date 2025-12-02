import { Body, Controller, Post } from '@nestjs/common';
import { User as UserModel } from '../generated/prisma/client';
import { CreateUserDto } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly UserService: UserService) {}

  @Post()
  async create(@Body() data: CreateUserDto): Promise<UserModel> {
    return this.UserService.createUser(data);
  }
}
