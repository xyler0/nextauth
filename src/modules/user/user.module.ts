import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { XModule } from '../x/x.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [XModule, AuthModule],
  controllers: [UserController],
})
export class UserModule {}