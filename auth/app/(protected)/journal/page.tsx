import JournalClient from './PageClient';
import { auth } from '@/auth';

export default async function JournalPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  return <JournalClient />;
}