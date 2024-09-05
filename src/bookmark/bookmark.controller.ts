import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { BookmarkService } from './bookmark.service';
import { GetUser } from '../auth/decorator';
import { createBookmarkDto } from './dto';
import { EditBookmarkDto } from './dto/edit-bookmark.dto';

@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}

  @Get()
  getBookmarks(@GetUser('id') userId) {
    return this.bookmarkService.getBookmarks(userId);
  }

  @Get('/:id')
  getBookmarkById(@GetUser('id') userId, @Param('id') bookmarkId) {
    return this.bookmarkService.getBookmarkById(userId, parseInt(bookmarkId));
  }

  @Patch('/:id')
  editBookmarkById(
    @GetUser('id') userId,
    @Param('id') bookmarkId,
    @Body() dto: EditBookmarkDto,
  ) {
    return this.bookmarkService.editBookmarkById(
      userId,
      parseInt(bookmarkId),
      dto,
    );
  }

  @Post()
  createBookmark(@GetUser('id') userId, @Body() dto: createBookmarkDto) {
    return this.bookmarkService.createBookmark(userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  deleteBookmarkById(@GetUser('id') userId, @Param('id') bookmarkId) {
    return this.bookmarkService.deleteBookmarkById(userId, parseInt(bookmarkId))
  }
}
