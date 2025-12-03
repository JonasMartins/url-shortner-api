import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

describe('Shorten (e2e) - POST /shorten/', () => {
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

  it('sucesso encurtar retorna shortUrl (201) com Bearer token', async () => {
    const token = await createAndLogin();
    const payload = { url: `http://example.com/${generateRandomString(8)}` };

    const res = await request(app.getHttpServer())
      .post('/shorten/')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('shortUrl');
    expect(typeof res.body.shortUrl).toBe('string');
  });

  it('retorna 400 quando url ausente', async () => {
    const token = await createAndLogin();

    const res = await request(app.getHttpServer())
      .post('/shorten/')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('retorna 400 para propriedades extras (forbidNonWhitelisted)', async () => {
    const token = await createAndLogin();

    const res = await request(app.getHttpServer())
      .post('/shorten/')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'any', role: 'admin' })
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('retorna 401 quando token ausente', async () => {
    const payload = { url: 'anything' };

    await request(app.getHttpServer())
      .post('/shorten/')
      .send(payload)
      .expect(401);
  });

  it('retorna 401 quando token inválido', async () => {
    const payload = { url: 'anything' };

    await request(app.getHttpServer())
      .post('/shorten/')
      .set('Authorization', `Bearer invalid.token.here`)
      .send(payload)
      .expect(401);
  });
});
