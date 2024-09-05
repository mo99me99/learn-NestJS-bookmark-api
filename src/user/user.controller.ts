import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user) {
    return user;
  }

  @Patch('edit')
  edituser(@GetUser('id') userId, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}
