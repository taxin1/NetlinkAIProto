"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { isNativeApp } from "@/lib/native-app"

export function ClientLoadingWrapper({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true)
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        if (isNativeApp()) {
            setIsLoading(false)
            return
        }

        setShowContent(true)
    }, [])

    const handleLoadingComplete = () => {
        setIsLoading(false)
    }

    return (
        <>
            {showContent && isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
            <div style={{ display: isLoading ? 'none' : 'contents' }}>
                {children}
            </div>
        </>
    )
}
