"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ToastAction {
    label: string
    onClick: () => void
}

interface EngagementToastProps {
    open: boolean
    title: string
    description: string
    actions: ToastAction[]
    onDismiss: () => void
}

export function EngagementToast({
    open,
    title,
    description,
    actions,
    onDismiss,
}: EngagementToastProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 z-50 max-w-md"
                >
                    <Card className="border-primary/40 shadow-2xl bg-background/95 backdrop-blur">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <CardTitle className="text-base">{title}</CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                        {description}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={onDismiss}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-2">
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant={index === 0 ? "default" : "outline"}
                                        size="sm"
                                        onClick={action.onClick}
                                        className="text-xs"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
