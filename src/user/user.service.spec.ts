import { Test, TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

describe('UserService', () => {
  let service: UserService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useFactory: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<any>(PrismaService);

    jest.clearAllMocks();
  });

  describe('criar usuário', () => {
    it('cria um novo usuário e retorna o seu id', async () => {
      const input = {
        email: 'user@email.com',
        password: 'secret',
        name: 'User',
      } as any;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 10,
        email: 'user@email.com',
        name: 'User',
      });

      const res = await service.createUser(input);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'user@email.com' },
        select: { id: true },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(res).toEqual({ id: 10, email: 'user@email.com', name: 'User' });
    });

    it('evita criar usuário repetido', async () => {
      const input = { email: 'user@email.com', password: 'pass' } as any;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(new Error());
      await expect(service.createUser(input)).rejects.toThrow(Error);
    });
  });

  describe('generateHash', () => {
    it('bcrypt.has deve criar um novo hash válido', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
      const res = await service.generateHash('pwd', 10);
      expect(bcrypt.hash).toHaveBeenCalledWith('pwd', 10);
      expect(res).toBe('hashed123');
    });
  });

  describe('validateHash', () => {
    it('bycript compare deve validar decodificar o hash e comparar com sucesso', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const res = await service.validateHash('pwd', 'hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('pwd', 'hash');
      expect(res).toBe(true);
    });

    it('bcrypt deve retornar false em caso de no match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const res = await service.validateHash('pwd', 'hash');
      expect(res).toBe(false);
    });
  });
});
