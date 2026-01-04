import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isLoginPage = pathname === '/admin/login'
  
  // Only check authentication if not on login page
  if (!isLoginPage) {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')

    if (!token || token.value !== 'cognisor_admin_secure') {
      redirect('/admin/login')
    }
  }

  // The wrapper handles conditional rendering based on pathname
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
