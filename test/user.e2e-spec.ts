import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
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
    // Mirror common production best-practices for validation in tests
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

  it('creates a user successfully (201)', async () => {
    const payload = {
      email: 'alice@example.com',
      name: 'Alice',
      password: 'strongpassword',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(payload.email);
    // o `name` pode ser retornado como string ou null conforme o model
    expect(res.body).toHaveProperty('name');
  });

  it('creates a user with null name (201)', async () => {
    const payload = {
      email: 'bob@example.com',
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

  it('returns 400 when email is missing', async () => {
    const payload = {
      password: 'password123',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(400);

    // Mensagem de validação deve existir e listar os problemas
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it('returns 400 when email is invalid', async () => {
    const payload = {
      email: 'not-an-email',
      password: 'password123',
    };

    const res = await request(app.getHttpServer())
      .post('/user')
      .send(payload)
      .expect(400);

    // Deve conter mensagem relacionada ao campo email
    expect(Array.isArray(res.body.message)).toBe(true);
    const joined = (res.body.message as string[]).join(' ');
    expect(/email/i.test(joined)).toBe(true);
  });

  it('returns 400 when password is missing', async () => {
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
