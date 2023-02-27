import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/config/Prisma.service';
import { Prisma } from '@prisma/client';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signUp(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { ...dto, password: hash },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already taken');
        }
      }
      throw error;
    }
  }

  async signIn(dto: AuthDto) {
    const existUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!existUser) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const comparePasswords = await argon.verify(
      existUser.password,
      dto.password,
    );

    if (!comparePasswords) {
      throw new ForbiddenException('Credentials incorrect');
    }

    return this.signToken(existUser.id, existUser.email);
  }

  async signToken(userId: number, email: string): Promise<{ token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });

    return { token };
  }
}
