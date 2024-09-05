import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  
  @Get('me')
  getMe(@GetUser('id') userId: number, @GetUser('email') email: string) {
    console.log({ email });
    return userId;
  }

  @Patch()
  edituser() {}
}
