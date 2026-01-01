import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { XModule } from '../x/x.module';

@Module({
  imports: [XModule],
  controllers: [UserController],
})
export class UserModule {}