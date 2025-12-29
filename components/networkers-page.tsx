"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Linkedin, 
  Twitter, 
  Github, 
  Instagram, 
  Globe,
  Mail,
  Phone,
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  CheckCircle2
} from "lucide-react"
import { PublicNavigation } from "@/components/public-navigation"

interface NetworkerProfile {
  profile: {
    id: string
    user_id: string
    name: string | null
    title: string | null
    company: string | null
    email: string | null
    phone: string | null
    linkedin: string | null
    twitter: string | null
    github: string | null
    instagram: string | null
    website: string | null
    is_public_profile?: boolean | null
  }
  portfolio: {
    id: string
    slug: string
    title: string
    subtitle: string | null
    bio: string | null
    profile_image_url: string | null
  }
}

interface NetworkersPageProps {
  profiles: NetworkerProfile[]
}

export function NetworkersPage({ profiles }: NetworkersPageProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (userId: string) => {
    setImageErrors(prev => new Set(prev).add(userId))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <PublicNavigation />

      {/* Header */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/public" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Global Networkers
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover and connect with professionals from around the world ({profiles.length} {profiles.length === 1 ? 'member' : 'members'})
          </p>
        </motion.div>
      </section>

      {/* Networkers Grid */}
      <section className="container mx-auto px-4 pb-20">
        {profiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">No Networkers Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to sign up and join our global network!
              </p>
              <Link href="/auth/signup">
                <Button>Sign Up Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((item, index) => {
              const { profile, portfolio } = item
              const displayName = profile.name || portfolio.title || "Networker"
              const displayTitle = profile.title || portfolio.subtitle || ""
              const displayCompany = profile.company || ""
              const profileImage = portfolio.profile_image_url

              return (
                <motion.div
                  key={profile.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      {/* Profile Image and Basic Info */}
                      <div className="flex flex-col items-center text-center mb-6">
                        {profileImage && !imageErrors.has(profile.user_id) ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                            <Image
                              src={profileImage}
                              alt={displayName}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={() => handleImageError(profile.user_id)}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 border-4 border-primary/20">
                            <User className="h-12 w-12 text-white" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-center mb-1">
                          <h3 className="text-xl font-bold">{displayName}</h3>
                          {profile.is_public_profile && (
                            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                        {displayTitle && (
                          <p className="text-sm text-muted-foreground mb-2">{displayTitle}</p>
                        )}
                        {displayCompany && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{displayCompany}</span>
                          </div>
                        )}
                        {!profile.name && profile.email && (
                          <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>
                        )}
                      </div>

                      {/* Bio Preview */}
                      {portfolio.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 text-center">
                          {portfolio.bio}
                        </p>
                      )}

                      {/* Social Links */}
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {profile.linkedin && (
                          <a
                            href={profile.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </a>
                        )}
                        {profile.twitter && (
                          <a
                            href={profile.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors"
                            title="Twitter"
                          >
                            <Twitter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </a>
                        )}
                        {profile.github && (
                          <a
                            href={profile.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 hover:bg-gray-100 dark:hover:bg-gray-950/40 transition-colors"
                            title="GitHub"
                          >
                            <Github className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}
                        {profile.instagram && (
                          <a
                            href={profile.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/20 hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </a>
                        )}
                        {profile.website && (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
                            title="Website"
                          >
                            <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </a>
                        )}
                      </div>

                      {/* Contact Info - Only show for public profiles */}
                      {profile.is_public_profile && (
                        <div className="space-y-2 mb-4 text-sm">
                          {profile.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${profile.email}`} className="hover:text-foreground truncate">
                                {profile.email}
                              </a>
                            </div>
                          )}
                          {profile.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${profile.phone}`} className="hover:text-foreground">
                                {profile.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {!profile.is_public_profile && (
                        <p className="text-xs text-muted-foreground mb-4 text-center italic">
                          Make profile public to show contact info
                        </p>
                      )}

                      {/* View Portfolio Button */}
                      {portfolio.slug && !portfolio.slug.startsWith('profile-') ? (
                        <Link href={`/portfolio/${portfolio.slug}`} className="block">
                          <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                            View Portfolio
                          </Button>
                        </Link>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          Portfolio coming soon
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Netlink Cogni. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/public/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
