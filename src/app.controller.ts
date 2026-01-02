import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'API root endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API information',
    schema: {
      example: {
        name: 'X Poster API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/health',
      }
    }
  })
  getRoot() {
    return {
      name: 'X Poster API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
      status: 'running',
    };
  }
}