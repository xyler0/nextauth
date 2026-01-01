import { ApiProperty } from '@nestjs/swagger';

export class JournalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  processed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  generatedPosts?: string[];
}