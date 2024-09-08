import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import {
  Body,
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import * as argon from 'argon2';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { createBookmarkDto } from 'src/bookmark/dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('App e2e', () => {
  let config: ConfigService;
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  // CONSTANTS
  const USER_1_PASSWORD = 'USER_1_PASSWORD';
  const USER_2_PASSWORD = 'USER_2_PASSWORD';
  const USER_1_EMAIL = 'user1@test.com';
  const USER_2_EMAIL = 'user2@test.com';

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
    config = app.get(ConfigService);
    jwt = app.get(JwtService);
    pactum.request.setBaseUrl('http://localhost:3333');
  });
  afterAll(() => {
    app.close();
  });
  beforeEach(async () => {
    await prisma.cleanDb();
    // prepopulate db USERS
    let hash: string;
    // signed up user1
    hash = await argon.hash(USER_1_PASSWORD);
    const user1 = await prisma.user.create({
      data: {
        email: USER_1_EMAIL,
        hash: hash,
      },
    });
    // signed up user2
    hash = await argon.hash(USER_2_PASSWORD);
    const user2 = await prisma.user.create({
      data: {
        email: USER_2_EMAIL,
        hash: hash,
      },
    });

    // prepopulate db BOOKMARKS : user1
    await prisma.bookmark.create({
      data: { link: 'user1link.com', title: 'user1link', userId: user1.id },
    });
    // prepopulate db BOOKMARKS :user2
    await prisma.bookmark.create({
      data: { link: 'user2link.com', title: 'user2link', userId: user2.id },
    });
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'fake@test.com',
      password: 'pass',
    };
    describe('Signup', () => {
      it('should throw if no body', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      });
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: 'pass',
          })
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
      it('shoud throw if email inUse', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: USER_1_EMAIL, password: 'pass' })
          .expectStatus(403);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .expectBodyContains('access_token');
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
      it('should throw if no user with email', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: 'noUserWithThisEmail@test.com', password: 'pass' })
          .expectStatus(403);
      });
      it('shoud throw if password is wrong', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: USER_1_EMAIL, password: 'wrongpassword' })
          .expectStatus(403);
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: USER_1_EMAIL, password: USER_1_PASSWORD })
          .expectStatus(200);
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should throw Unauthorized (no auth headers)', () => {
        return pactum.spec().get('/users/me').expectStatus(401);
      });
      it('should get current user (with auth headers) ', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'newFN',
        lastName: 'newLN',
      };
      it('should throw Unauthorized (no auth headers)', () => {
        return pactum
          .spec()
          .patch('/users/edit')
          .withBody(dto)
          .expectStatus(401);
      });
      it('should edit current user', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .patch('/users/edit')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
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
      it('should Throw Unauthorized if no auth header', () => {
        return pactum.spec().post('/bookmarks/').expectStatus(401);
      });
      it('should Throw bad request if no link', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .post('/bookmarks/')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .withBody({ title: 't', description: 'd' })
          .expectStatus(400);
      });
      it('should Throw bad request if no title', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);

        return pactum
          .spec()
          .post('/bookmarks/')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .withBody({ link: 'l', description: 'd' })
          .expectStatus(400);
      });
      it('should create bookmark with no description', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .withBody({ title: 't', link: 'l' })
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
      it('should create bookmark ', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer ' + access_token,
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get all bookmarks of a user', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer ' + access_token })
          .expectJsonLength(1)
          .expectStatus(200);
      });
    });
    describe('Get bookmark by ID', () => {
      it('should get bookmark by id (for specefic user)', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_1_EMAIL },
        });

        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .get('/bookmarks/' + bookmark.id)
          .withHeaders({ Authorization: 'Bearer ' + access_token })
          .expectStatus(200)
          .expectBodyContains('title');
      });
      it('should Throw Unauthorized (no auth headers)', async () => {
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_1_EMAIL },
        });

        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .get('/bookmarks/' + bookmark.id)
          .expectStatus(401);
      });
    });
    describe('Edit bookmark', () => {
      it('should Throw forbidden (not edit another user bookmark)',async()=>{
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_2_EMAIL },
        });
        const bookmark =  await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum.spec().patch('/bookmarks/'+bookmark.id).withHeaders({Authorization:'Bearer '+access_token}).expectStatus(403)
      })
      it('should edit bookmark', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_1_EMAIL },
        });
        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .patch('/bookmarks/' + bookmark.id)
          .withHeaders({ Authorization: 'Bearer ' + access_token })
          .withBody({
            title: 'new title',
            link: 'newlink.com',
          })
          .expectStatus(200)
          .expectBodyContains('title')
          .expectBodyContains('link');
      });
    });
    describe('Delete bookmark by ID ', () => {
      it('should not deleted bookmark (no auth headers)', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_1_EMAIL },
        });
        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .delete('/bookmarks/' + bookmark.id)
          .expectStatus(401);
      });
      it('should not deleted bookmark of another user', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_2_EMAIL },
        });
        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .delete('/bookmarks/' + bookmark.id)
          .withHeaders({ Authorization: 'Bearer ' + access_token })
          .expectStatus(403);
      });
      it('should delete a bookmark by id ', async () => {
        const { access_token } = await get_token(USER_1_EMAIL, USER_1_PASSWORD);
        const { id: userId } = await prisma.user.findUnique({
          where: { email: USER_1_EMAIL },
        });
        const bookmark = await prisma.bookmark.findFirst({
          where: { userId: userId },
        });
        return pactum
          .spec()
          .delete('/bookmarks/' + bookmark.id)
          .withHeaders({ Authorization: 'Bearer ' + access_token })
          .expectStatus(204);
      });
    });
  });

  const get_token = async (email: string, password: string) => {
    // find the user with given email
    const user = await prisma.user.findFirst({
      where: { email: email },
    });
    // if user does not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect.');
    }
    // verify given pass
    const verify = await argon.verify(user.hash, password);
    // if password is not correct throw exception
    if (!verify) {
      throw new ForbiddenException('Credentials incorrect.');
    }
    return signToken(user.id, user.email);
  };

  const signToken = async (
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> => {
    const payload = { sub: userId, email };
    const secret = config.get('JWT_SECRET');
    const token = await jwt.signAsync(payload, {
      expiresIn: '1m',
      secret: secret,
    });
    return { access_token: token };
  };
});
