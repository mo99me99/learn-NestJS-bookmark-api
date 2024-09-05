import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    // check if there is a user with the given email
    const inUse = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (inUse) {
      throw new ForbiddenException('Credentials taken.');
    }
    // genereate the password hash
    const hash = await argon.hash(dto.password);

    // save the new user in the db
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash: hash,
      },
    });

    // return the saved user
    return this.signToken(user.id, user.email);
  }

  async singin(dto: AuthDto) {
    // find the user with given email
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    // if user does not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect.');
    }

    // verify given pass
    const verify = await argon.verify(user.hash, dto.password);

    // if password is not correct throw exception
    if (!verify) {
      throw new ForbiddenException('Credentials incorrect.');
    }
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    return { access_token: token };
  }
}
