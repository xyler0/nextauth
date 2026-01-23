import { auth } from "@/auth";
import { Providers } from "@/providers/session-provider";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}