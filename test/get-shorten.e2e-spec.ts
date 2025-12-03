import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

jest.setTimeout(60000);

describe('Auth (e2e) - GET /:short', () => {
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

  async function createAndLogin(emailPrefix = 'user') {
    const random = generateRandomString(10);
    const email = `${emailPrefix}-${random}@example.com`;
    const password = 'SafePass123';

    await request(app.getHttpServer())
      .post('/user')
      .send({ email, name: 'Tester', password })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return { token: loginRes.body.access_token as string, email };
  }

  async function createShort(token: string) {
    const payload = { url: `http://example.com/${generateRandomString(8)}` };
    const res = await request(app.getHttpServer())
      .post('/shorten/')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    return res.body.shortUrl as string;
  }

  it('retorna 404 para um link não encontrado', async () => {
    const notFound = generateRandomString(10);
    await request(app.getHttpServer()).get(`/${notFound}`).expect(404);
  });

  it('retorna 302 para um link recem criado e compara o aumento do acesso', async () => {
    const { token } = await createAndLogin('creator');
    const shortCode = await createShort(token);
    const parts = shortCode.split('/');

    let res = await request(app.getHttpServer())
      .get('/my-urls')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    let items = Array.isArray(res.body.items) ? res.body.items : [];
    let shortLink = items.find(
      (it) => it.shortCode === parts[parts.length - 1],
    );
    expect(shortLink).toBeDefined();
    expect(shortLink.accessCount).toBe(0);

    await request(app.getHttpServer())
      .get(`/${parts[parts.length - 1]}`)
      .expect(302);

    res = await request(app.getHttpServer())
      .get('/my-urls')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    items = Array.isArray(res.body.items) ? res.body.items : [];
    shortLink = items.find((it) => it.shortCode === parts[parts.length - 1]);
    expect(shortLink).toBeDefined();
    expect(shortLink.accessCount).toBe(1);
  }, 10000);
});
