import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { PortfolioBuilder } from "@/components/portfolio-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"

export default async function PortfolioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const cookieStore = await cookies()
    const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value

    if (!guestId) return null

    return (
      <div className="relative z-10 p-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Portfolio Builder</CardTitle>
            <CardDescription>
              Create and publish a portfolio by creating an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Portfolio generation, saving, and sharing are available after sign up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup">
                <Button>Sign up to create a portfolio</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline">Log in</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative z-10 p-8">
      <PortfolioBuilder userId={user.id} />
    </div>
  )
}
