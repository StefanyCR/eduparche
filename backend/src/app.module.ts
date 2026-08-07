import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BadgesModule } from './badges/badges.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, BadgesModule, CoursesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
