import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { PrismaService } from '../prisma/prisma.service';
import { UrlService } from './url.service';

const mockPrisma = () => {
  const db: any = {
    url: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  // sem esse mock gera erro, pois transaction é usado em uma das rotas
  db.$transaction = jest.fn().mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') {
      return await arg(db);
    }
    return Promise.all(arg);
  });
  return db;
};

const mockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
});

describe('UrlService', () => {
  let service: UrlService;
  let prisma: ReturnType<typeof mockPrisma>;
  let logger: ReturnType<typeof mockLogger>;

  beforeEach(async () => {
    process.env.ROOT_URL = 'https://short.test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useFactory: mockLogger },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    prisma = module.get<any>(PrismaService);
    logger = module.get<any>(WINSTON_MODULE_NEST_PROVIDER);
    jest.clearAllMocks();
  });

  describe('updateUrl', () => {
    it('atualiza e retorna a nova short', async () => {
      prisma.url.findUnique.mockResolvedValue({ id: 1, userId: 1 });
      prisma.url.update.mockResolvedValue({});

      const res = await service.updateUrl('abc123', 'newslug', 1);
      expect(prisma.url.findUnique).toHaveBeenCalledWith({
        where: { shortCode: 'abc123', deletedAt: null },
        select: { id: true, userId: true },
      });
      expect(prisma.url.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { shortCode: 'newslug' },
      });
      expect(res).toEqual({ shortUrl: 'https://short.test/newslug' });
    });

    it('retorna not found quando não encontrado o slug', async () => {
      prisma.url.findUnique.mockResolvedValue(null);
      await expect(service.updateUrl('nope', 'slug', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna unauthorized caso o usuário querendo altear não seja o dono da url', async () => {
      prisma.url.findUnique.mockResolvedValue({ id: 1, userId: 999 });
      await expect(service.updateUrl('abc', 'slug', 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('deleteUrl', () => {
    it('deleta e retorna a url em caso de sucesso', async () => {
      prisma.url.findUnique.mockResolvedValue({ id: 2, userId: 42 });
      prisma.url.update.mockResolvedValue({});

      const res = await service.deleteUrl('code42', 42);
      expect(prisma.url.findUnique).toHaveBeenCalledWith({
        where: { shortCode: 'code42' },
        select: { id: true, userId: true },
      });
      expect(prisma.url.update).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect(res).toEqual({ shortUrl: 'https://short.test/code42' });
    });

    it('retorna not found quando a url não for encontrada', async () => {
      prisma.url.findUnique.mockResolvedValue(null);
      await expect(service.deleteUrl('something', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna unauthorized caso o usuário querendo deletar não seja o dono da url', async () => {
      prisma.url.findUnique.mockResolvedValue({ id: 2, userId: 99 });
      await expect(service.deleteUrl('c', 1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getByShortCode', () => {
    it('retorna a url original e incrementa o acesso', async () => {
      prisma.url.findUnique.mockResolvedValue({
        originalUrl: 'https://test.example',
      });
      prisma.url.update.mockResolvedValue({});

      const res = await service.getByShortCode('abc');
      expect(prisma.url.findUnique).toHaveBeenCalledWith({
        where: { shortCode: 'abc', deletedAt: null },
        select: { originalUrl: true },
      });
      expect(prisma.url.update).toHaveBeenCalledWith({
        where: { shortCode: 'abc' },
        data: { accessCount: { increment: 1 } },
      });
      expect(logger.info).toHaveBeenCalled();
      expect(res).toBe('https://test.example');
    });

    it('retorna not found para url não existentes', async () => {
      prisma.url.findUnique.mockResolvedValue(null);
      await expect(service.getByShortCode('no')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('myUrls', () => {
    it('retorna items paginados', async () => {
      prisma.url.count.mockResolvedValue(2);
      prisma.url.findMany.mockResolvedValue([
        {
          id: 1,
          originalUrl: 'a',
          shortCode: 'a',
          title: null,
          createdAt: new Date(),
          accessCount: 0,
        },
        {
          id: 2,
          originalUrl: 'b',
          shortCode: 'b',
          title: null,
          createdAt: new Date(),
          accessCount: 0,
        },
      ]);

      const res = await service.myUrls(10, { skip: 1, take: 10 });
      expect(prisma.url.count).toHaveBeenCalled();
      expect(prisma.url.findMany).toHaveBeenCalled();
      expect(res.totalItems).toBe(2);
      expect(res.items.length).toBe(2);
    });
  });

  describe('shortenUrl', () => {
    it('cria uma nova url para um código único', async () => {
      jest
        .spyOn(service as any, 'generateShortCode')
        .mockReturnValue('abc-123');
      prisma.url.findUnique.mockResolvedValue(null);
      prisma.url.create.mockResolvedValue({ id: 7 });

      const res = await service.shortenUrl('https://original', 5);
      expect(prisma.url.findUnique).toHaveBeenCalled();
      expect(prisma.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://original',
          shortCode: 'abc-123',
          userId: 5,
        },
      });
      expect(res).toEqual({ shortUrl: 'https://short.test/abc-123' });
    });
  });
});
