// app/admin/users/page.tsx
export const dynamic = 'force-dynamic' // ✅ ensures this route is not prerendered/static

import Shell from '../../../components/Shell'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  return (
    <Shell title="Manage users" backLabel="Back to dashboard" backHref="/dashboard">
      {/* ✅ All hooks/UI logic must live in a Client Component */}
      <AdminUsersClient />
    </Shell>
  )
}
