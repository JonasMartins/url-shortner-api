import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

jest.setTimeout(60000);

describe('Delete My URLs (e2e) - UPDATE /my-urls/:shortCode', () => {
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

  it('retorna 401 quando token ausente ao atualizar', async () => {
    const { token } = await createAndLogin('creator');
    const shortCode = await createShort(token);
    const parts = shortCode.split('/');
    const payload = { url: 'anything' };

    await request(app.getHttpServer())
      .put(`/my-urls/${parts[parts.length - 1]}`)
      .send(payload)
      .expect(401);
  });

  it('retorna 400 quando payload inválido pelo formato', async () => {
    const { token } = await createAndLogin('creator');
    const shortCode = await createShort(token);
    const parts = shortCode.split('/');
    const payload = { url: 'ABC-123' };

    await request(app.getHttpServer())
      .put(`/my-urls/${parts[parts.length - 1]}`)
      .send(payload)
      .expect(401);
  });

  it('apenas criador pode atualizar, outro usuário recebe 401', async () => {
    const creator = await createAndLogin('creator2');
    const other = await createAndLogin('other');

    const shortCode = await createShort(creator.token);
    const parts = shortCode.split('/');
    const payload = { url: 'anything' };

    await request(app.getHttpServer())
      .put(`/my-urls/${parts[parts.length - 1]}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send(payload)
      .expect(401);
  });

  it('criador atualiza com sucesso (200) e short link antigo não aparece em /my-urls', async () => {
    const creator = await createAndLogin('creator3');
    const shortCode = await createShort(creator.token);
    const parts = shortCode.split('/');
    const newSlug = generateRandomString(8).toLowerCase();
    const payload = { url: newSlug };

    await request(app.getHttpServer())
      .put(`/my-urls/${parts[parts.length - 1]}`)
      .set('Authorization', `Bearer ${creator.token}`)
      .send(payload)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/my-urls')
      .set('Authorization', `Bearer ${creator.token}`)
      .expect(200);

    const items = Array.isArray(res.body.items) ? res.body.items : [];
    const exists = items.some((it) => it.shortCode === shortCode);
    expect(exists).toBe(false);
  });
});
