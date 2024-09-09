import { Body, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createBookmarkDto } from './dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';
import { Bookmark, PrismaClient } from '@prisma/client';

@Injectable()
export class BookmarkService {
  // constructor(prisma:PrismaClient) {
  // }
  prisma = new PrismaClient({ log: ['query'] });

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId: userId,
      },
    });
  }
  async getAllUsersWithBookmarks() {
    const users = await this.prisma.user.findMany();
    const userWtihBookmarks = await Promise.all(
      users.map(async (user) => {
        const bookmarks = await this.prisma.bookmark.findMany({
          where: {
            userId: user.id,
          },
        });
        return { ...user, bookmarks };
      }),
    );
    return userWtihBookmarks;
  }

  createBookmark(userId: number, dto: createBookmarkDto) {
    return this.prisma.bookmark.create({
      data: { link: dto.link, title: dto.title, userId: userId },
    });
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prisma.bookmark.findFirst({
      where: {
        userId: userId,
        id: bookmarkId,
      },
    });
  }

  async editBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    const bookmark: Bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });
    if (!bookmark || bookmark.userId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }
    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookmarkId,
      },
    });

    // check if user owns the bookmark
    if (!bookmark || bookmark.userId !== userId)
      throw new ForbiddenException('Access to resources denied');

    await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
