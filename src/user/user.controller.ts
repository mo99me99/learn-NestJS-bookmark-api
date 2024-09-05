import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

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
