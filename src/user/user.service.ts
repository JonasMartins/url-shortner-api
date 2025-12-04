import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    returnPass?: boolean,
  ) {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
      omit: {
        password: !returnPass,
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    const hash = await this.generateHash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async generateHash(password: string, saltOrRounds: number): Promise<string> {
    const hash = await bcrypt.hash(password, saltOrRounds);
    return hash;
  }

  async validateHash(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
