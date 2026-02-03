"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function clearAuthCache() {
  // Clear Next.js cache
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  
  // Clear session cookies
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("next-auth.session-token") || 
                        cookieStore.get("__Secure-next-auth.session-token");
  
  if (sessionCookie) {
    cookieStore.delete(sessionCookie.name);
  }
  
  // Clear CSRF token
  const csrfCookie = cookieStore.get("next-auth.csrf-token") ||
                     cookieStore.get("__Host-next-auth.csrf-token");
  
  if (csrfCookie) {
    cookieStore.delete(csrfCookie.name);
  }
}

export async function clearUserCache(userId: string) {
  revalidateTag(`user-${userId}`, "default");
  revalidatePath(`/dashboard`);
  revalidatePath(`/settings`);
  revalidatePath(`/posts`);
  revalidatePath(`/journal`);
  revalidatePath(`/pattern`);
}