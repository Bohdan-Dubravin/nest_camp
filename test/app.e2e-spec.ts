import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/config/Prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { EditUserDto } from '../src/user/edit-user.dto';
import { BookMarkDto } from '../src/bookmark/dto/book-mark.dto';
import { EditBookMarkDto } from 'src/bookmark/dto/edit-book-mark.dto';

describe('App 2e2', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: '123456',
    };
    describe('SignUp', () => {
      it('should throw error email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: '123456' })
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('SignIn', () => {
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'token');
      });
    });
  });
  describe('User', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200);
      });
    });
    describe('Edit user', () => {
      const dto: EditUserDto = {
        email: 'change@mail.com',
        firstName: 'firstName',
        lastName: 'lastName',
      };
      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users/edit')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName);
      });
    });
  });
  describe('Bookmark', () => {
    describe('Get empty bookmark list', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200);
      });
    });
    describe('Create bookmark', () => {
      const dto: BookMarkDto = {
        title: 'First title',
        link: 'just link',
        description: 'random description',
      };

      const dto2 = { ...dto, title: 'second title' };
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(201)
          .withBody(dto)
          .stores('bookmarkId', 'id');
      });

      it('should create second bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(201)
          .withBody(dto2);
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectJsonLength(2);
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });

      describe('Edit bookmark', () => {
        const dto: EditBookMarkDto = {
          title: 'Edited',
          link: 'Edited',
          description: 'random description edited',
        };

        it('should update bookmark', () => {
          return pactum
            .spec()
            .patch('/bookmarks/{id}')
            .withHeaders({ Authorization: 'Bearer $S{userAt}' })
            .withBody(dto)
            .withPathParams('id', '$S{bookmarkId}')
            .expectStatus(200);
        });
      });

      describe('Find user with all bookmarks', () => {
        it('should get bookmark by id', () => {
          return pactum
            .spec()
            .get('/bookmarks/user/{id}')
            .withPathParams('id', '$S{bookmarkId}')
            .withHeaders({ Authorization: 'Bearer $S{userAt}' })
            .expectStatus(200);
        });
      });

      describe('Delete bookmark', () => {
        it('should get bookmark by id', () => {
          return pactum
            .spec()
            .delete('/bookmarks/{id}')
            .withPathParams('id', '$S{bookmarkId}')
            .withHeaders({ Authorization: 'Bearer $S{userAt}' })
            .expectStatus(204);
        });
      });

      describe('Find user with all bookmarks after delete one', () => {
        it('should get bookmark by id', () => {
          return pactum
            .spec()
            .get('/bookmarks/user/{id}')
            .withPathParams('id', '$S{bookmarkId}')
            .withHeaders({ Authorization: 'Bearer $S{userAt}' })
            .expectStatus(200)
            .inspect();
        });
      });
    });
  });
});
