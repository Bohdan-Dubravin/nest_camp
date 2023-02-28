import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../config/Prisma.service';
import { BookMarkDto } from './dto/book-mark.dto';
import { EditBookMarkDto } from './dto/edit-book-mark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({ where: { userId } });
  }

  async getBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });
    return bookmark;
  }

  async createBookmarkById(userId: number, dto: BookMarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: { userId, ...dto },
    });
    return bookmark;
  }

  async updateBookmarkById(
    userId: number,
    dto: EditBookMarkDto,
    bookmarkId: number,
  ) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });
    if (!bookmark || userId !== bookmark.userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { ...dto },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });
    if (!bookmark || userId !== bookmark.userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.bookmark.delete({ where: { id: bookmarkId } });
    return;
  }

  async findAllUserBookmarks(userId: number, bookmarkId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { bookmarks: true },
    });

    delete user.password;

    return user;
  }
}
