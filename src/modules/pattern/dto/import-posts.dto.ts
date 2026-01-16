import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportPostsDto {
  @ApiProperty({
    description: 'Array of your past posts to learn from',
    example: [
      'Shipped new feature today',
      'Built the authentication system',
      'Fixed critical bug in production'
    ],
  })
  @IsArray()
  @ArrayMinSize(5, { message: 'Need at least 5 posts to learn patterns' })
  @IsString({ each: true })
  posts: string[];
}