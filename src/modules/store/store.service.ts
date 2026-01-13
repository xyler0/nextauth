import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PostSource } from '../../generated/prisma/client';
import * as crypto from 'crypto';

interface PostMetadata {
  tags?: string[];
  mood?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}


export interface CreatePostDto {
  content: string;
  source: PostSource;
  userId: string;
  metadata?: PostMetadata;
}

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPost(dto: CreatePostDto): Promise<{ id: string; hash: string }> {
    const hash = this.generateHash(dto.content);

    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        hash,
        source: dto.source,
        userId: dto.userId,
        metadata: dto.metadata,
      },
    });

    this.logger.log(`Post created: ${post.id} (${dto.source})`);
    return { id: post.id, hash: post.hash };
  }

  async isDuplicate(content: string, userId: string): Promise<boolean> {
    const hash = this.generateHash(content);
    const existing = await this.prisma.post.findUnique({
      where: { hash, userId },
    });
    return !!existing;
  }

  async markAsPosted(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: {
        posted: true,
        postedAt: new Date(),
      },
    });
    this.logger.log(`Post marked as posted: ${id}`);
  }

  async getTodayPostCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.post.count({
      where: {
        userId,
        postedAt: {
          gte: today,
        },
      },
    });
  }

  async canPostToday(userId: string, maxPosts: number): Promise<boolean> {
    const count = await this.getTodayPostCount(userId);
    return count < maxPosts;
  }

  async getUserPosts(userId: string, limit = 50) {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        source: true,
        posted: true,
        postedAt: true,
        createdAt: true,
      },
    });
  }
  async getPostById(id: string, userId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id, userId },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    return post;
  }

  async deletePost(id: string): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
    this.logger.log(`Post deleted: ${id}`);
  }

  async incrementDailyStats(date: Date): Promise<void> {
    const dateOnly = new Date(date.toISOString().split('T')[0]);

    await this.prisma.postingStats.upsert({
      where: { date: dateOnly },
      update: { count: { increment: 1 } },
      create: { date: dateOnly, count: 1 },
    });
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
  }
}