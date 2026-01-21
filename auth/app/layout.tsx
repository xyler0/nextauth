import { Providers } from "@/providers/session-provider";
import { auth } from "@/auth";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SessionMonitor } from "@/components/session-monitor";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          <SessionMonitor expiresAt={session?.expires} />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}