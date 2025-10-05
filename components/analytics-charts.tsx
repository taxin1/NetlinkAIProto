import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalyticsChartsProps {
  userId: string
}

export async function AnalyticsCharts({ userId }: AnalyticsChartsProps) {
  const supabase = await createClient()

  // Get event type distribution
  const { data: events } = await supabase.from("events").select("event_type").eq("user_id", userId)

  const eventCounts: { [key: string]: number } = {}
  events?.forEach((event) => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
  })

  const totalEvents = Object.values(eventCounts).reduce((a, b) => a + b, 0)

  const eventTypes = [
    { type: "email_sent", label: "Emails Sent", color: "bg-accent" },
    { type: "connection", label: "New Connections", color: "bg-primary" },
    { type: "meeting", label: "Meetings", color: "bg-chart-3" },
    { type: "call", label: "Calls", color: "bg-chart-4" },
    { type: "note", label: "Notes", color: "bg-chart-5" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {totalEvents > 0 ? (
            <div className="space-y-4">
              {eventTypes.map((item) => {
                const count = eventCounts[item.type] || 0
                const percentage = totalEvents > 0 ? (count / totalEvents) * 100 : 0
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Engagement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <span className="text-sm font-medium">Total Interactions</span>
              <span className="text-2xl font-bold">{totalEvents}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <span className="text-sm font-medium">Most Active Type</span>
              <span className="text-lg font-semibold">
                {totalEvents > 0
                  ? eventTypes.find(
                      (t) =>
                        t.type === Object.keys(eventCounts).reduce((a, b) => (eventCounts[a] > eventCounts[b] ? a : b)),
                    )?.label || "N/A"
                  : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
