import { Loader2, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="relative z-10 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Analytics</h1>
        <p className="text-muted-foreground mt-2">Loading your insights...</p>
      </div>
      
      <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-teal-50/50 to-cyan-50/50 dark:from-green-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 dark:bg-green-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <BarChart3 className="h-12 w-12 text-green-400 opacity-20" />
            </div>
            <div className="relative p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl backdrop-blur-sm border border-green-400/30">
              <BarChart3 className="h-12 w-12 text-green-400 animate-pulse" />
            </div>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-3" />
          <p className="text-muted-foreground font-medium">Analyzing your network data...</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Preparing insights and metrics</p>
        </CardContent>
      </Card>
    </div>
  )
}
