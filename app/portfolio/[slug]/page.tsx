import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Portfolio } from "@/types/portfolio"
import { PortfolioClient } from "./portfolio-client"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (portfolioError) {
    throw portfolioError
  }

  if (portfolio) {
    if (!portfolio.is_public && (!user || portfolio.user_id !== user.id)) {
      notFound()
    }
  } else {
    notFound()
  }

  const portfolioData = portfolio as Portfolio

  const { data: networkProfile } = await supabase
    .from("network_profiles")
    .select("*")
    .eq("user_id", portfolioData.user_id)
    .maybeSingle()

  return <PortfolioClient portfolio={portfolioData} networkProfile={networkProfile} />
}
