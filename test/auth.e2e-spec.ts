import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

describe('Auth (e2e) - POST /auth/login', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('sucesso login retorna token (201)', async () => {
    const random = generateRandomString(6);
    const email = `alice-${random}@example.com`;
    const password = 'ValidPass123';

    await request(app.getHttpServer())
      .post('/user')
      .send({ email, name: 'Alice', password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });

  it('returna 400 para email inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'irrelevant' })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('retorna 404 para email inexistente', async () => {
    const random = generateRandomString(6);
    const email = `noone-${random}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'whatever' })
      .expect(404);

    expect(res.body.message).toBeDefined();
  });

  it('returna 401 para password incorreto', async () => {
    const random = generateRandomString(6);
    const email = `bob-${random}@example.com`;
    const password = 'CorrectPass123';

    await request(app.getHttpServer())
      .post('/user')
      .send({ email, name: 'Bob', password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword' })
      .expect(401);

    expect(res.body.message).toBeDefined();
  });
});
