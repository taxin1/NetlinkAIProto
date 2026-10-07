import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { verifyAdminSession } from "@/lib/admin/auth"

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
    const isValid = await verifyAdminSession()
    if (!isValid) {
      redirect('/admin/login')
    }
  }

  // The wrapper handles conditional rendering based on pathname
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
