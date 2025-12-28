import { Injectable } from '@nestjs/common';
import { GitHubEvent } from './interfaces/github-event.interface';

@Injectable()
export class GitHubFilter {
  private readonly BOT_PATTERNS = ['bot', 'dependabot', 'renovate', 'github-actions'];
  private readonly IGNORED_COMMIT_PATTERNS = [
    /^Merge/i,
    /package-lock\.json/i,
    /yarn\.lock/i,
    /pnpm-lock\.yaml/i,
  ];

  shouldProcess(event: GitHubEvent): boolean {
    // Reject bot commits
    if (event.commits?.some((c) => this.isBotAuthor(c.author))) {
      return false;
    }

    // Reject ignored commit patterns
    if (event.commits?.some((c) => this.isIgnoredCommit(c.message))) {
      return false;
    }

    // Reject empty events
    if (!event.commits?.length && !event.pr && !event.release) {
      return false;
    }

    return true;
  }

  summarize(event: GitHubEvent): string {
    if (event.commits && event.commits.length > 0) {
      const firstCommit = event.commits[0].message.split('\n')[0];
      return `Shipped: ${firstCommit}`;
    }

    if (event.pr) {
      return `Merged: ${event.pr.title}`;
    }

    if (event.release) {
      return `Released: ${event.release.name}`;
    }

    return '';
  }

  private isBotAuthor(author: string): boolean {
    const lowerAuthor = author.toLowerCase();
    return this.BOT_PATTERNS.some((pattern) => lowerAuthor.includes(pattern));
  }

  private isIgnoredCommit(message: string): boolean {
    return this.IGNORED_COMMIT_PATTERNS.some((pattern) => pattern.test(message));
  }
}