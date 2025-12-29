import { createClient } from "@/lib/supabase/server"
import { NetworkersPage } from "@/components/networkers-page"

export default async function NetworkersPageRoute() {
  try {
    const supabase = await createClient()
    
    // Fetch network profiles and portfolios separately since there's no direct foreign key
    const [profilesResult, portfoliosResult] = await Promise.all([
      supabase
        .from("network_profiles")
        .select("*")
        .order("is_public_profile", { ascending: false }) // Public profiles first
        .order("created_at", { ascending: false }),
      supabase
        .from("portfolios")
        .select("id, user_id, slug, title, subtitle, bio, profile_image_url, is_public")
        .order("created_at", { ascending: false })
    ])

    // Handle errors gracefully
    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error.message || profilesResult.error)
      return <NetworkersPage profiles={[]} />
    }

    const allProfiles = profilesResult.data || []
    const allPortfolios = portfoliosResult.data || []

    // Create a map of portfolios by user_id for quick lookup
    const portfoliosByUserId = new Map<string, any[]>()
    allPortfolios.forEach((portfolio: any) => {
      if (!portfoliosByUserId.has(portfolio.user_id)) {
        portfoliosByUserId.set(portfolio.user_id, [])
      }
      portfoliosByUserId.get(portfolio.user_id)!.push(portfolio)
    })

    // Process and format profiles
    const profiles = allProfiles.map((profile: any) => {
      // Find portfolios for this user
      const userPortfolios = portfoliosByUserId.get(profile.user_id) || []
      
      // Find public portfolio or use first portfolio
      let portfolio = null
      if (userPortfolios.length > 0) {
        const publicPortfolio = userPortfolios.find((p: any) => p.is_public)
        portfolio = publicPortfolio || userPortfolios[0]
      }
      
      // If no portfolio exists, create a minimal one from profile data
      if (!portfolio) {
        const displayName = profile.name || profile.email?.split('@')[0] || "Networker"
        portfolio = {
          id: profile.id,
          slug: `profile-${profile.user_id}`,
          title: displayName,
          subtitle: profile.title || "",
          bio: null,
          profile_image_url: null,
          is_public: false
        }
      }

      return {
        profile,
        portfolio
      }
    })

    return <NetworkersPage profiles={profiles} />
  } catch (error) {
    // Catch any unexpected errors and still render the page
    console.error("Unexpected error in NetworkersPageRoute:", error)
    return <NetworkersPage profiles={[]} />
  }
}
