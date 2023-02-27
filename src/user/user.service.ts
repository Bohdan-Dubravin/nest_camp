import { Injectable } from '@nestjs/common';
import { PrismaService } from '../config/Prisma.service';
import { EditUserDto } from './edit-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async editUser(userId: number, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
    });

    delete user.password;

    return user;
  }
}
