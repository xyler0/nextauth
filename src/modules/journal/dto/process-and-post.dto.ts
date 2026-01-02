import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessAndPostDto {
  @ApiProperty({
    description: 'Journal entry ID to process and post',
    example: 'clx123456',
  })
  @IsString()
  entryId: string;
}