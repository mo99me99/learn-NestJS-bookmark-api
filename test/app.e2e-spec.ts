import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { Body, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { createBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });
  afterAll(() => {
    app.close();
  });

  // it.todo('should pass');

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'fake@test.com',
      password: 'pass',
    };
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: 'pass',
          })
          .expectStatus(400);
      });
      it('should throw if no body', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: 'fake@test.com',
          })
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
        // .inspect();
      });
    });

    describe('Signin', () => {
      it('should throw if no body', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      });

      it('should throw if no email', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: 'pass' })
          .expectStatus(400);
      });

      it('should throw if no password', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: 'test@fake.com' })
          .expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
        // .inspect();
      });
    });

    describe('Edit user', () => {
      it('should edit current user', () => {
        const dto: EditUserDto = {
          firstName: 'mohammad',
          lastName: 'Hosseini',
        };
        return pactum
          .spec()
          .patch('/users/edit')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
        // .inspect();
      });
    });
  });

  describe('Bookmarks', () => {
    const dto: createBookmarkDto = {
      link: 'google.com',
      title: 'google',
      description: 'des',
    };
    describe('Create bookmarks', () => {
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
        // .inspect();
      });
    });
    describe('Get bookmarks', () => {
      it('should get all bookmarks of a user', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200);
        // .inspect();
      });
    });
    describe('Get bookmark by ID', () => {
      it('should get bookmark by id (for specefic user)', () => {
        return pactum
          .spec()
          .get('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBodyContains('title')
          .inspect();
      });
    });
    describe('Edit bookmark', () => {
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody({
            title: 'new title',
            link: 'newlink.com',
          })
          .expectStatus(200)
          .expectBodyContains('title')
          .expectBodyContains('link');
        // .inspect();
      });
    });
    describe('Delete bookmark by ID ', () => {
      it('should delete a bookmark by id ', () => {
        return pactum
          .spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(204)
          // .inspect();
      });
      // it('should not get deleted bookmark', () => {
      //   return pactum
      //     .spec()
      //     .get('/bookmarks/$S{bookmarkId}')
      //     .withHeaders({ Authorization: 'Bearer $S{userAt}' })
      //     .expectStatus(404)
      //     .inspect();
      // });
    });
  });
});
