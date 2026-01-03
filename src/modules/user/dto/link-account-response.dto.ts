import { ApiProperty } from '@nestjs/swagger';

export class LinkAccountResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  linked: boolean;

  @ApiProperty()
  provider: 'github' | 'twitter';

  @ApiProperty({ required: false })
  username?: string;
}