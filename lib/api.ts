// Prefixes API/relative paths with the app's basePath so raw fetch() calls
// resolve correctly. Next.js basePath does NOT auto-prefix fetch() URLs —
// only <Link>, useRouter, and next/image. Keep this in sync with
// next.config.ts (both read NEXT_PUBLIC_BASE_PATH).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '/ace_academy';

export const apiUrl = (path: string) => `${BASE}${path}`;
