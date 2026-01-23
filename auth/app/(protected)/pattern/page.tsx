import PatternClient from './PageClient';
import { auth } from '@/auth';

export default async function PatternPage() {
  const session = await auth();
  if (!session?.user) return null;
  return <PatternClient />;
}