import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateRandomString } from '../src/common/utils/general.utils';

describe('Delete My URLs (e2e) - DELETE /my-urls/:shortCode', () => {
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

  it('retorna 401 quando token ausente ao deletar', async () => {
    // criar usuário e link
    const { token } = await createAndLogin('creator');
    const shortCode = await createShort(token);
    const parts = shortCode.split('/');

    // tentar deletar sem token
    await request(app.getHttpServer())
      .delete(`/my-urls/${parts[parts.length - 1]}`)
      .expect(401);
  });

  it('apenas criador pode deletar, outro usuário recebe 401', async () => {
    const creator = await createAndLogin('creator2');
    const other = await createAndLogin('other');

    const shortCode = await createShort(creator.token);
    const parts = shortCode.split('/');

    // tentativa de deleção por outro usuário
    await request(app.getHttpServer())
      .delete(`/my-urls/${parts[parts.length - 1]}`)
      .set('Authorization', `Bearer ${other.token}`)
      .expect(401);
  });

  it('criador deleta com sucesso (204) e link não aparece em /my-urls', async () => {
    const creator = await createAndLogin('creator3');
    const shortCode = await createShort(creator.token);
    const parts = shortCode.split('/');

    // deletar com sucesso
    await request(app.getHttpServer())
      .delete(`/my-urls/${parts[parts.length - 1]}`)
      .set('Authorization', `Bearer ${creator.token}`)
      .expect(204);

    // buscar my-urls para o criador e garantir que o shortCode não existe
    const res = await request(app.getHttpServer())
      .get('/my-urls')
      .set('Authorization', `Bearer ${creator.token}`)
      .expect(200);

    // espera que nenhum item tenha o shortCode deletado
    const items = Array.isArray(res.body.items) ? res.body.items : [];
    const exists = items.some((it) => it.shortCode === shortCode);
    expect(exists).toBe(false);
  });
});
