import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password', async () => {
    const saltOrRounds = 10;
    const password = 'random_password';
    const hash = await bcrypt.hash(password, saltOrRounds);
    // const salt = await bcrypt.genSalt();
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);
  }, 10000);
});
