'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ToastAction {
    label: string
    onClick: () => void
}

interface EngagementToastProps {
    open: boolean
    title: string
    description: string
    actions?: ToastAction[]
    onDismiss: () => void
}

/**
 * EngagementToast - A contextual toast notification component
 * Used to show engagement prompts and contextual help to users
 */
export function EngagementToast({
    open,
    title,
    description,
    actions = [],
    onDismiss,
}: EngagementToastProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' as const }}
                    className="fixed bottom-6 left-6 z-50 max-w-md"
                >
                    <Card className="shadow-2xl border-primary/40 bg-background/95 backdrop-blur">
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
                        {actions.length > 0 && (
                            <CardContent className="pt-0 flex flex-wrap gap-2">
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant={index === 0 ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={action.onClick}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
