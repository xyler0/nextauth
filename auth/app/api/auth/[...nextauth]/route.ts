import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Add runtime config for edge compatibility
export const runtime = 'nodejs'; 