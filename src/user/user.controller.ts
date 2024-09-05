import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  
  @Get('me')
  getMe(@GetUser() user, @GetUser('id') userId: number, @GetUser('email') email: string) {
    return user;
  }

  @Patch()
  edituser() {}
}
