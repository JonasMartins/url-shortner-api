import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

describe('My URLs (e2e) - GET /my-urls', () => {
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

  async function createAndLogin() {
    const random = generateRandomString(6);
    const email = `user-${random}@example.com`;
    const password = 'SafePass123';

    await request(app.getHttpServer())
      .post('/user')
      .send({ email, name: 'Tester', password })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return loginRes.body.access_token as string;
  }

  it('retorna array vazio quando usuário não possui shortens (200)', async () => {
    const token = await createAndLogin();

    const res = await request(app.getHttpServer())
      .get('/my-urls')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(0);
    expect(res.body.totalItems).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });

  it('retorna itens após criar shortens e respeita limit (200)', async () => {
    const token = await createAndLogin();

    // criar 3 shortens
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/shorten/')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: `http://example.com/${generateRandomString(6)}` })
        .expect(201);
    }

    // solicitar com limit=2
    const res = await request(app.getHttpServer())
      .get('/my-urls?limit=2&page=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.perPage).toBe(2);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2);
    expect(res.body.totalItems).toBe(3);
    expect(res.body.totalPages).toBe(Math.ceil(3 / 2));
  });
});
