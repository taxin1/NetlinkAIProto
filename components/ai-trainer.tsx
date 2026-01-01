"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Loader2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Database,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AITrainerProps {
  userId: string
}

interface TrainerStatus {
  is_training: boolean
  last_trained_at: string | null
  training_progress: number
  total_memories: number
  model_version: string | null
}

export function AITrainer({ userId }: AITrainerProps) {
  const [status, setStatus] = useState<TrainerStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTraining, setIsTraining] = useState(false)

  useEffect(() => {
    loadStatus()
    // Poll for training progress
    const interval = setInterval(() => {
      if (status?.is_training) {
        loadStatus()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [status?.is_training])

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/ai-trainer/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      }
    } catch (error) {
      console.error("Error loading trainer status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startTraining = async () => {
    setIsTraining(true)
    try {
      const response = await fetch("/api/ai-trainer/train", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Training failed")
      }

      const result = await response.json()
      await loadStatus()
      alert(`Training completed! ${result.memories_count} memories saved.`)
    } catch (error) {
      console.error("Training error:", error)
      alert(error instanceof Error ? error.message : "Failed to start training")
    } finally {
      setIsTraining(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Trainer</CardTitle>
          </div>
          {status?.total_memories ? (
            <Badge variant="secondary" className="gap-1">
              <Database className="h-3 w-3" />
              {status.total_memories} memories
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The AI trainer learns from your emails, contacts, and interactions to personalize
          all AI-generated content. It runs automatically in the background and improves over time.
        </p>

        {status?.is_training ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Training in progress...</span>
              <span className="font-medium">{status.training_progress}%</span>
            </div>
            <Progress value={status.training_progress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analyzing your data and creating memories...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {status?.last_trained_at ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Last trained{" "}
                  {formatDistanceToNow(new Date(status.last_trained_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>Not trained yet. Start training to personalize your AI.</span>
              </div>
            )}

            <Button
              onClick={startTraining}
              disabled={isTraining}
              className="w-full gap-2"
              size="lg"
            >
              {isTraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  {status?.last_trained_at ? "Retrain AI" : "Start Training"}
                </>
              )}
            </Button>
          </div>
        )}

        {status?.total_memories ? (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">What the AI has learned:</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Your email writing style and tone</li>
              <li>Networking preferences and target industries</li>
              <li>Communication patterns and interaction types</li>
              <li>Contact insights and relationship context</li>
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
