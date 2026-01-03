"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Users, 
  Mail, 
  Calendar,
  LayoutDashboard,
  BarChart3,
  Bot,
  Briefcase,
  Share2,
  Wand2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  targetSelector?: string
  position?: "top" | "bottom" | "left" | "right" | "center"
  action?: () => void
}

const TOUR_STORAGE_KEY = "netlink-tour-completed"

export function GuidedTour({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Netlink! 👋",
      description: "Let's take a quick tour of the key features that will help you grow your network. You can skip this anytime.",
      icon: <Sparkles className="h-6 w-6" />,
      position: "center",
    },
    {
      id: "dashboard",
      title: "Business Card Scanner",
      description: "Upload business cards to instantly extract and save contact information. This is your main dashboard for quick access.",
      icon: <LayoutDashboard className="h-6 w-6" />,
      targetSelector: "[data-tour='dashboard-scanner']",
      position: "bottom",
    },
    {
      id: "contacts",
      title: "Contacts Management",
      description: "View and manage all your networking contacts. Keep track of relationships and interactions in one place.",
      icon: <Users className="h-6 w-6" />,
      targetSelector: "[data-tour='contacts-nav']",
      position: "right",
      action: () => {
        // Highlight the contacts navigation
      },
    },
    {
      id: "events",
      title: "Events & Calendar",
      description: "Create and manage networking events. Connect your Google Calendar to sync seamlessly.",
      icon: <Calendar className="h-6 w-6" />,
      targetSelector: "[data-tour='events-nav']",
      position: "right",
    },
    {
      id: "emails",
      title: "AI Email Agent",
      description: "Use AI to compose and send personalized emails. Manage all your email communications efficiently.",
      icon: <Mail className="h-6 w-6" />,
      targetSelector: "[data-tour='emails-nav']",
      position: "right",
    },
    {
      id: "ai-assistant",
      title: "AI Assistant",
      description: "Chat with your AI assistant using voice or text. Get help with networking, emails, and more.",
      icon: <Bot className="h-6 w-6" />,
      targetSelector: "[data-tour='ai-assistant-nav']",
      position: "right",
    },
    {
      id: "portfolio",
      title: "Portfolio Builder",
      description: "Create and share your professional portfolio. Showcase your work and expertise.",
      icon: <Briefcase className="h-6 w-6" />,
      targetSelector: "[data-tour='portfolio-nav']",
      position: "right",
    },
    {
      id: "profile",
      title: "Network Profile",
      description: "Make your profile discoverable to other networkers. Share your professional information.",
      icon: <Share2 className="h-6 w-6" />,
      targetSelector: "[data-tour='profile-nav']",
      position: "right",
    },
    {
      id: "campaigns",
      title: "AI Campaigns",
      description: "Run automated email campaigns. Reach out to multiple contacts with personalized messages.",
      icon: <Wand2 className="h-6 w-6" />,
      targetSelector: "[data-tour='campaigns-nav']",
      position: "right",
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Track your networking performance. See insights about your contacts, emails, and events.",
      icon: <BarChart3 className="h-6 w-6" />,
      targetSelector: "[data-tour='analytics-nav']",
      position: "right",
    },
    {
      id: "complete",
      title: "You're All Set! 🎉",
      description: "You now know the key features of Netlink. Start networking and grow your professional connections!",
      icon: <Sparkles className="h-6 w-6" />,
      position: "center",
    },
  ]

  useEffect(() => {
    // Check if user has already completed the tour
    const hasCompletedTour = localStorage.getItem(`${TOUR_STORAGE_KEY}-${userId}`)
    
    // Check if user is new (account created in last 7 days)
    const accountAge = localStorage.getItem(`netlink-account-created-${userId}`)
    if (!accountAge) {
      localStorage.setItem(`netlink-account-created-${userId}`, Date.now().toString())
    }

    // Show tour if not completed and account is new
    if (!hasCompletedTour) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [userId])

  useEffect(() => {
    if (!isOpen) return

    const step = tourSteps[currentStep]
    if (step.targetSelector) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(step.targetSelector!) as HTMLElement
        if (element) {
          setTargetElement(element)
          // Scroll element into view
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        } else {
          setTargetElement(null)
        }
      }, 300)
      
      return () => clearTimeout(timer)
    } else {
      setTargetElement(null)
    }

    // Execute action if provided
    if (step.action) {
      step.action()
    }
  }, [currentStep, isOpen])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(`${TOUR_STORAGE_KEY}-${userId}`, "true")
    setIsOpen(false)
  }

  const handleComplete = () => {
    localStorage.setItem(`${TOUR_STORAGE_KEY}-${userId}`, "true")
    setIsOpen(false)
  }

  const currentStepData = tourSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tourSteps.length - 1

  // Update tooltip position
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      if (!targetElement || currentStepData.position === "center") {
        setTooltipStyle({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        })
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      let newStyle: React.CSSProperties = {}

      switch (currentStepData.position) {
        case "top":
          newStyle = {
            top: `${rect.top + scrollY - 20}px`,
            left: `${rect.left + scrollX + rect.width / 2}px`,
            transform: "translate(-50%, -100%)",
          }
          break
        case "bottom":
          newStyle = {
            top: `${rect.bottom + scrollY + 20}px`,
            left: `${rect.left + scrollX + rect.width / 2}px`,
            transform: "translate(-50%, 0)",
          }
          break
        case "left":
          newStyle = {
            top: `${rect.top + scrollY + rect.height / 2}px`,
            left: `${rect.left + scrollX - 20}px`,
            transform: "translate(-100%, -50%)",
          }
          break
        case "right":
          newStyle = {
            top: `${rect.top + scrollY + rect.height / 2}px`,
            left: `${rect.right + scrollX + 20}px`,
            transform: "translate(0, -50%)",
          }
          break
        default:
          newStyle = {
            top: `${rect.bottom + scrollY + 20}px`,
            left: `${rect.left + scrollX + rect.width / 2}px`,
            transform: "translate(-50%, 0)",
          }
      }

      setTooltipStyle(newStyle)
    }

    updatePosition()
    
    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    
    // Also update after a short delay to ensure element is positioned
    const timeoutId = setTimeout(updatePosition, 100)

    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
      clearTimeout(timeoutId)
    }
  }, [currentStep, targetElement, isOpen, currentStepData.position])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with spotlight effect */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={currentStepData.position === "center" ? undefined : handleNext}
            style={{
              cursor: currentStepData.position === "center" ? "default" : "pointer",
            }}
          >
            {targetElement && (
              <motion.div
                className="absolute rounded-lg border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  ...(() => {
                    const rect = targetElement.getBoundingClientRect()
                    return {
                      width: rect.width + 16,
                      height: rect.height + 16,
                      top: rect.top - 8 + window.scrollY,
                      left: rect.left - 8 + window.scrollX,
                    }
                  })(),
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-[9999] w-[90vw] max-w-md",
            )}
            style={tooltipStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2 border-primary/50 shadow-2xl bg-background/95 backdrop-blur-xl">
              <CardHeader className="relative pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8"
                  onClick={handleSkip}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 pr-8">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {currentStepData.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${((currentStep + 1) / tourSteps.length) * 100}%` 
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {currentStep + 1}/{tourSteps.length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  {currentStepData.description}
                </CardDescription>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                    >
                      Skip Tour
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="flex items-center gap-2"
                    >
                      {isLastStep ? "Get Started" : "Next"}
                      {!isLastStep && <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
