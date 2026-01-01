import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualPostDto {
  @ApiProperty({
    description: 'Post content (will be tone-enforced)',
    example: 'Shipped a new feature today. System now filters GitHub commits and posts automatically.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  content: string;
}