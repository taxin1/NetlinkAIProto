"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, RefreshCw, AlertTriangle, ListChecks } from "lucide-react"

interface HighlightSection {
  title: string
  items: string[]
}

interface HighlightsResponse {
  sections: HighlightSection[]
}

export function EmailHighlights() {
  const [data, setData] = useState<HighlightsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHighlights = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/email/highlights")
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to load highlights")
      }
      const json = (await res.json()) as HighlightsResponse
      setData(json)
    } catch (err: any) {
      setError(err?.message || "Unable to load highlights right now.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHighlights()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadHighlights()
    setIsRefreshing(false)
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Email & Calendar Highlights</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating highlights...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : !data || data.sections.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No recent emails or calendar updates to summarize yet.
          </div>
        ) : (
          <div className="space-y-4">
            {data.sections.map((section, idx) => (
              <div key={idx} className="rounded-lg border border-border/60 p-4 space-y-3 bg-background/60">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <ListChecks className="h-3 w-3" />
                    {section.title}
                  </Badge>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-foreground/90">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
