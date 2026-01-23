import { auth } from "@/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  return <DashboardClient userId={session.user.id} />;
}