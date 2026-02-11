// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

// ✅ Next.js 16 expects a "proxy" function export in proxy.ts (replaces middleware.ts)
export function proxy(_req: NextRequest) {
  // ✅ Allow request to continue normally
  return NextResponse.next()
}

// ✅ Also export default to satisfy tooling that checks for default export
export default proxy
