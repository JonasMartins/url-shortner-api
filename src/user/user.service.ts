import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { UserModel as User } from '../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      omit: {
        password: true,
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const hash = await this.generateHash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hash,
      },
    });
  }

  async generateHash(password: string, saltOrRounds: number): Promise<string> {
    const hash = await bcrypt.hash(password, saltOrRounds);
    return hash;
  }
}
