import PostsClient from './PageClient';
import { auth } from '@/auth';

export default async function PostsPage() {
  const session = await auth();
  if (!session?.user) return null;
  return <PostsClient />;
}