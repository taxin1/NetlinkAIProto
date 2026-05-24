"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Mail,
  Linkedin,
  ExternalLink,
  UserPlus,
} from "lucide-react"

export interface EnrichedMatch {
  id: string
  type: "networker" | "contact"
  score: number
  reason: string
  icebreaker: string
  sharedInterests: string[]
  name: string
  title?: string | null
  company?: string | null
  email?: string | null
  linkedin?: string | null
  portfolioSlug?: string | null
}

interface MatchResultsGridProps {
  matches: EnrichedMatch[]
  emptyMessage?: string
}

export function MatchResultsGrid({ matches, emptyMessage }: MatchResultsGridProps) {
  if (matches.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
    ) : null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {matches.map((match) => (
        <Card key={`${match.type}-${match.id}`} className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{match.name}</h3>
                  <Badge variant={match.type === "networker" ? "default" : "secondary"}>
                    {match.type === "networker" ? "Global Networker" : "Your contact"}
                  </Badge>
                </div>
                {(match.title || match.company) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[match.title, match.company].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <Badge
                className="shrink-0 bg-primary/15 text-primary border-primary/30"
                variant="outline"
              >
                {match.score}% fit
              </Badge>
            </div>

            <p className="text-sm">{match.reason}</p>

            {match.sharedInterests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {match.sharedInterests.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                <MessageCircle className="h-3.5 w-3.5" />
                Icebreaker
              </div>
              <p className="text-sm italic">&ldquo;{match.icebreaker}&rdquo;</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {match.email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${match.email}`}>
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Email
                  </a>
                </Button>
              )}
              {match.linkedin && (
                <Button size="sm" variant="outline" asChild>
                  <a href={match.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-3.5 w-3.5 mr-1" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {match.portfolioSlug && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/portfolio/${match.portfolioSlug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Portfolio
                  </Link>
                </Button>
              )}
              {match.type === "networker" && (
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/public/networkers">
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Directory
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
