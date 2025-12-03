import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { generateRandomString } from '../src/common/utils/general.utils';
import { AppModule } from './../src/app.module';
// import { PrismaService } from './../src/prisma/prisma.service';

describe('User (e2e) - POST /user', () => {
  let app: INestApplication;
  // let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    // prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // limpa os usuários entre os testes para manter isolamento
    // await prisma.user.deleteMany();
  });

  it('cria um usuário corretamente (201)', async () => {
    const random = generateRandomString(5);

    const payload = {
      email: `alice-${random}@example.com`,
      name: 'Alice',
      password: 'strongpassword',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(payload.email);
    expect(res.body).toHaveProperty('name');
  });

  it('cria usuário com nome nulo (201)', async () => {
    const random = generateRandomString(5);
    const payload = {
      email: `bob-${random}@example.com`,
      name: null,
      password: 'anotherstrong',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(201);

    expect(res.body.email).toBe(payload.email);
    expect(res.body.name).toBeNull();
  });

  it('retorna 400 quando email ausente', async () => {
    const payload = {
      password: 'password123',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it('retorna 400 para email inválido', async () => {
    const payload = {
      email: 'not-an-email',
      password: 'password123',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    const joined = (res.body.message as string[]).join(' ');
    expect(/email/i.test(joined)).toBe(true);
  });

  it('retorna 400 quando password ausente', async () => {
    const payload = {
      email: 'carol@example.com',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.length).toBeGreaterThan(0);
  });
});
