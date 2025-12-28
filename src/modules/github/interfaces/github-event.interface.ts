export interface GitHubCommit {
  message: string;
  author: string;
}

export interface GitHubEvent {
  type: string;
  repo: string;
  commits?: GitHubCommit[];
  pr?: { title: string; action: string };
  release?: { tag: string; name: string };
}