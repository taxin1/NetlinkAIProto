import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding-wizard"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Redirect to waitlist during product launch
  redirect("/waitlist")

  // Original onboarding code (commented out for waitlist phase)
  // const { data: existingProfile } = await supabase
  //   .from("network_profiles")
  //   .select("id, name, title, company, email, linkedin, website, is_public_profile")
  //   .eq("user_id", user.id)
  //   .maybeSingle()

  // const hasProfileDetails =
  //   existingProfile &&
  //   (existingProfile.name || existingProfile.title || existingProfile.company || existingProfile.linkedin || existingProfile.website)

  // if (hasProfileDetails) {
  //   redirect("/dashboard")
  // }

  // return <OnboardingWizard userId={user.id} initialEmail={user.email ?? ""} existingProfile={existingProfile} />
}
