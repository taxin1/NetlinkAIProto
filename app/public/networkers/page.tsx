import { createPublicClient } from "@/lib/supabase/public-server"
import { NetworkersPage } from "@/components/networkers-page"

export const dynamic = "force-dynamic"

export default async function NetworkersPageRoute() {
  try {
    // Use public client to ensure we can access all profiles regardless of auth state
    const supabase = await createPublicClient()
    
    // Fetch network profiles and portfolios separately since there's no direct foreign key
    const [profilesResult, portfoliosResult] = await Promise.all([
      supabase
        .from("network_profiles")
        .select("*")
        .eq("is_public_profile", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("portfolios")
        .select("id, user_id, slug, title, subtitle, bio, profile_image_url, is_public")
        .order("created_at", { ascending: false })
    ])

    // Handle errors gracefully
    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error.message || profilesResult.error)
      console.error("Error details:", JSON.stringify(profilesResult.error, null, 2))
      return <NetworkersPage profiles={[]} />
    }

    // Only show profiles that have explicitly been made public
    const allProfiles = (profilesResult.data || []).filter(
      (profile) => profile?.is_public_profile
    )
    const allPortfolios = portfoliosResult.data || []
    
    // Debug: Log how many profiles we fetched
    console.log(`Fetched ${allProfiles.length} network profiles`)

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
