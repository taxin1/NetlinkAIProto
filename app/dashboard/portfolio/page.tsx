import { createClient } from "@/lib/supabase/server"
import { PortfolioBuilder } from "@/components/portfolio-builder"

export default async function PortfolioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="relative z-10 p-8">
      <PortfolioBuilder userId={user.id} />
    </div>
  )
}
