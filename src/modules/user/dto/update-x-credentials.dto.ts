import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateXCredentialsDto {
  @ApiProperty({ description: 'X API Key' })
  @IsString()
  xApiKey: string;

  @ApiProperty({ description: 'X API Secret' })
  @IsString()
  xApiSecret: string;

  @ApiProperty({ description: 'X Access Token' })
  @IsString()
  xAccessToken: string;

  @ApiProperty({ description: 'X Access Secret' })
  @IsString()
  xAccessSecret: string;
}