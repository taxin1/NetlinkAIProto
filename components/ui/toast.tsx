"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EngagementToastAction {
  label: string
  onClick: () => void
}

interface EngagementToastProps {
  open: boolean
  title: string
  description?: string
  actions?: EngagementToastAction[]
  onDismiss?: () => void
}

export function EngagementToast({
  open,
  title,
  description,
  actions = [],
  onDismiss,
}: EngagementToastProps) {
  if (!open) return null

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <Card className="w-80 shadow-xl border border-primary/40 bg-background/95 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant="outline"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

