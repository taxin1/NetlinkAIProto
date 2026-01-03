"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LoadingScreenProps {
    onComplete?: () => void
}

// Evenly distributed global hubs across all continents
const HUBS = [
    // Americas
    { name: "New York", lat: 40.71, lon: -74.00, tier: 1 },
    { name: "Los Angeles", lat: 34.05, lon: -118.24, tier: 2 },
    { name: "São Paulo", lat: -23.55, lon: -46.63, tier: 2 },
    { name: "Mexico City", lat: 19.43, lon: -99.13, tier: 3 },
    // Europe
    { name: "London", lat: 51.50, lon: -0.12, tier: 1 },
    { name: "Frankfurt", lat: 50.11, lon: 8.68, tier: 2 },
    { name: "Moscow", lat: 55.75, lon: 37.61, tier: 3 },
    // Asia
    { name: "Tokyo", lat: 35.67, lon: 139.65, tier: 1 },
    { name: "Singapore", lat: 1.35, lon: 103.81, tier: 1 },
    { name: "Hong Kong", lat: 22.31, lon: 114.16, tier: 2 },
    { name: "Mumbai", lat: 19.07, lon: 72.87, tier: 2 },
    { name: "Seoul", lat: 37.56, lon: 126.97, tier: 3 },
    // Middle East & Africa
    { name: "Dubai", lat: 25.20, lon: 55.27, tier: 2 },
    { name: "Cairo", lat: 30.04, lon: 31.23, tier: 3 },
    { name: "Johannesburg", lat: -26.20, lon: 28.04, tier: 3 },
    // Oceania
    { name: "Sydney", lat: -33.86, lon: 151.20, tier: 2 },
]

// Better distributed routes covering all regions evenly
const ROUTES = [
    // North-South connections (vertical spread)
    [0, 2], // NY to Sao Paulo (Americas vertical)
    [4, 14], // London to Johannesburg (Europe-Africa vertical)
    [7, 15], // Tokyo to Sydney (Asia-Oceania vertical)

    // East-West connections (horizontal spread)
    [0, 4], // NY to London (Trans-Atlantic)
    [4, 12], // London to Dubai (Europe-Middle East)
    [12, 8], // Dubai to Singapore (Middle East-Asia)
    [8, 15], // Singapore to Sydney (Asia-Oceania)

    // Diagonal cross-globe routes (spread across hemispheres)
    [1, 7], // LA to Tokyo (Trans-Pacific North)
    [2, 15], // Sao Paulo to Sydney (South hemisphere cross)
    [0, 8], // NY to Singapore (Americas-Asia)
    [4, 7], // London to Tokyo (Europe-Asia)

    // Regional mesh (distributed)
    [1, 3], // LA to Mexico (West Americas)
    [5, 6], // Frankfurt to Moscow (Europe spread)
    [9, 11], // Hong Kong to Seoul (East Asia)
    [10, 12], // Mumbai to Dubai (South Asia-Middle East)

    // Long-haul distributed routes
    [3, 13], // Mexico to Cairo (Americas-Africa)
    [6, 11], // Moscow to Seoul (North route)
    [13, 10], // Cairo to Mumbai (Africa-Asia)
    [14, 2], // Johannesburg to Sao Paulo (South cross)

    // Fill gaps for even distribution
    [1, 15], // LA to Sydney (Pacific spread)
    [5, 10], // Frankfurt to Mumbai (Europe-South Asia)
    [9, 15], // Hong Kong to Sydney (East Asia-Oceania)
]

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0)
    const [phase, setPhase] = useState(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [worldData, setWorldData] = useState<any>(null)
    const particlesRef = useRef<Array<{ x: number, y: number, vx: number, vy: number, life: number }>>([])

    // Typing animation state
    const [typedText, setTypedText] = useState("")
    const fullText = "NETWORK LINK AI"

    useEffect(() => {
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json")
            .then(res => res.json())
            .then(data => setWorldData(data))
            .catch(() => { })
    }, [])

    // Typing animation effect
    useEffect(() => {
        let currentIndex = 0
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setTypedText(fullText.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(typingInterval)
            }
        }, 80) // 80ms per character

        return () => clearInterval(typingInterval)
    }, [])

    useEffect(() => {
        let p = 0
        const interval = setInterval(() => {
            p += 0.7
            if (p >= 100) {
                clearInterval(interval)
                setTimeout(() => onComplete?.(), 800)
            } else {
                setProgress(p)
                setPhase(Math.floor((p / 100) * 4))
            }
        }, 30)
        return () => clearInterval(interval)
    }, [onComplete])

    useEffect(() => {
        if (!canvasRef.current || !worldData) return
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvasRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width * dpr
        canvasRef.current.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const cx = rect.width / 2
        const cy = rect.height / 2

        // Responsive globe radius
        const isMobile = window.innerWidth < 768
        const R = isMobile ? 140 : 220
        let rot = 0

        // Decode map
        const arcs = worldData.arcs
        const tf = worldData.transform
        const decodeArc = (i: number) => {
            const c = [], a = arcs[i < 0 ? ~i : i], r = i < 0
            let x = 0, y = 0
            for (let j = 0; j < a.length; j++) {
                x += a[j][0]; y += a[j][1]
                c.push([x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]])
            }
            return r ? c.reverse() : c
        }

        const rings: number[][][] = []
        const process = (g: any) => {
            if (g.type === "MultiPolygon") g.arcs.forEach((p: any) => p.forEach((r: any) => {
                const c: number[][] = []; r.forEach((i: number) => c.push(...decodeArc(i))); rings.push(c)
            }))
            else if (g.type === "GeometryCollection") g.geometries.forEach(process)
        }
        process(worldData.objects.land)

        // Spawn particles
        const spawnParticles = () => {
            for (let i = 0; i < 3; i++) {
                particlesRef.current.push({
                    x: Math.random() * rect.width,
                    y: Math.random() * rect.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 1
                })
            }
        }

        const render = () => {
            ctx.clearRect(0, 0, rect.width, rect.height)
            rot -= 0.004
            const t = Date.now() / 1000

            const cos = Math.cos(rot), sin = Math.sin(rot)
            const tilt = 0.25, ct = Math.cos(tilt), st = Math.sin(tilt)

            const proj = (lon: number, lat: number, alt = 0) => {
                const r = R + alt, phi = lat * Math.PI / 180, theta = -lon * Math.PI / 180
                let x = -(r * Math.cos(phi) * Math.cos(theta))
                let z = r * Math.cos(phi) * Math.sin(theta)
                let y = -(r * Math.sin(phi))
                const x1 = x * cos - z * sin, z1 = z * cos + x * sin
                const y2 = y * ct - z1 * st, z2 = z1 * ct + y * st
                return { x: cx + x1, y: cy + y2, z: z2, v: z2 > 0 }
            }

            // Particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.005
                if (p.life <= 0) return false
                ctx.fillStyle = `rgba(6,182,212,${p.life * 0.3})`
                ctx.fillRect(p.x, p.y, 1, 1)
                return true
            })
            if (Math.random() > 0.7) spawnParticles()

            // BRIGHT Multi-layer atmosphere
            for (let i = 0; i < 3; i++) {
                const g = ctx.createRadialGradient(cx, cy, R * (0.85 + i * 0.1), cx, cy, R * (1.1 + i * 0.15))
                g.addColorStop(0, `rgba(6,182,212,${0.25 - i * 0.05})`) // Much brighter
                g.addColorStop(1, 'transparent')
                ctx.fillStyle = g
                ctx.fillRect(0, 0, rect.width, rect.height)
            }

            // Illuminated Ocean Sphere (not pure black)
            ctx.beginPath()
            ctx.arc(cx, cy, R, 0, Math.PI * 2)
            const oceanGrad = ctx.createRadialGradient(cx, cy - 50, 0, cx, cy, R)
            oceanGrad.addColorStop(0, '#0f1f35') // Brighter center
            oceanGrad.addColorStop(1, '#050a15') // Darker edges
            ctx.fillStyle = oceanGrad
            ctx.fill()

            // Ocean glow ring
            ctx.strokeStyle = 'rgba(6,182,212,0.3)'
            ctx.lineWidth = 2
            ctx.stroke()

            // BRIGHT Grid
            ctx.beginPath()
            for (let l = 0; l < 360; l += 20) {
                let s = true
                for (let la = -80; la <= 80; la += 4) {
                    const p = proj(l, la)
                    if (p.v) { if (s) { ctx.moveTo(p.x, p.y); s = false } else ctx.lineTo(p.x, p.y) }
                    else s = true
                }
            }
            ctx.strokeStyle = 'rgba(6,182,212,0.25)' // Much brighter grid
            ctx.lineWidth = 1
            ctx.stroke()

            // GLOWING Land with shadow
            ctx.beginPath()
            rings.forEach(ring => {
                let s = false
                for (let i = 0; i < ring.length; i += 2) {
                    const p = proj(ring[i][0], ring[i][1])
                    if (p.v) { if (!s) { ctx.moveTo(p.x, p.y); s = true } else ctx.lineTo(p.x, p.y) }
                    else s = false
                }
            })

            // Bright glowing borders
            ctx.strokeStyle = 'rgba(6,182,212,1)' // Full brightness
            ctx.lineWidth = 2
            ctx.shadowColor = '#06b6d4'
            ctx.shadowBlur = 8
            ctx.stroke()
            ctx.shadowBlur = 0

            // Bright fill
            ctx.fillStyle = 'rgba(6,182,212,0.25)' // Much brighter fill
            ctx.fill()

            // BRIGHT Routes
            ROUTES.forEach((route, i) => {
                const h1 = HUBS[route[0]], h2 = HUBS[route[1]]
                const p1 = proj(h1.lon, h1.lat, 15), p2 = proj(h2.lon, h2.lat, 15)

                if (p1.v && p2.v) {
                    const mid = proj((h1.lon + h2.lon) / 2, (h1.lat + h2.lat) / 2, 60)

                    // BRIGHT Line
                    ctx.beginPath()
                    ctx.moveTo(p1.x, p1.y)
                    if (mid.v) ctx.quadraticCurveTo(mid.x, mid.y, p2.x, p2.y)
                    else ctx.lineTo(p2.x, p2.y)
                    ctx.strokeStyle = 'rgba(6,182,212,0.4)' // Much brighter
                    ctx.lineWidth = 2
                    ctx.shadowColor = '#06b6d4'
                    ctx.shadowBlur = 4
                    ctx.stroke()
                    ctx.shadowBlur = 0

                    // BRIGHT Packets (2 per route)
                    for (let n = 0; n < 2; n++) {
                        const pt = ((t * 0.4 + i * 0.07 + n * 0.5) % 1)
                        const px = (1 - pt) * (1 - pt) * p1.x + 2 * (1 - pt) * pt * mid.x + pt * pt * p2.x
                        const py = (1 - pt) * (1 - pt) * p1.y + 2 * (1 - pt) * pt * mid.y + pt * pt * p2.y

                        // BRIGHT Trail
                        for (let tr = 0; tr < 8; tr++) {
                            const tt = Math.max(0, pt - tr * 0.01)
                            const tx = (1 - tt) * (1 - tt) * p1.x + 2 * (1 - tt) * tt * mid.x + tt * tt * p2.x
                            const ty = (1 - tt) * (1 - tt) * p1.y + 2 * (1 - tt) * tt * mid.y + tt * tt * p2.y
                            const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, Math.max(0.5, 4 - tr * 0.4))
                            g.addColorStop(0, `rgba(6,182,212,${0.7 - tr * 0.08})`) // Smoother fade
                            g.addColorStop(1, 'transparent')
                            ctx.fillStyle = g
                            ctx.beginPath()
                            ctx.arc(tx, ty, Math.max(0.5, 4 - tr * 0.4), 0, Math.PI * 2)
                            ctx.fill()
                        }

                        // BRIGHT Core
                        ctx.fillStyle = '#fff'
                        ctx.shadowColor = '#06b6d4'
                        ctx.shadowBlur = 15 // Stronger glow
                        ctx.beginPath()
                        ctx.arc(px, py, 3, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.shadowBlur = 0
                    }
                }
            })

            // Hubs
            HUBS.forEach((hub, i) => {
                const p = proj(hub.lon, hub.lat, 8)
                if (p.v) {
                    const pulse = 0.5 + Math.sin(t * 2 + i) * 0.3
                    const size = hub.tier === 1 ? 6 : hub.tier === 2 ? 4 : 3

                    // Rings
                    for (let r = 0; r < 2; r++) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(6,182,212,${pulse * 0.3})`
                        ctx.lineWidth = 1.5
                        ctx.arc(p.x, p.y, size + r * 4 + pulse * 3, 0, Math.PI * 2)
                        ctx.stroke()
                    }

                    // Core
                    ctx.fillStyle = hub.tier === 1 ? '#06b6d4' : 'rgba(6,182,212,0.8)'
                    ctx.shadowColor = '#06b6d4'
                    ctx.shadowBlur = 12
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.shadowBlur = 0
                }
            })

            requestAnimationFrame(render)
        }
        render()
    }, [worldData])

    const phases = [
        "Initializing Network Nodes",
        "Establishing Connections",
        "Synchronizing Data Streams",
        "Network Link AI Ready"
    ]

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden px-4">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            {/* Tech grid */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

            {/* Globe - Responsive sizing */}
            <div className="relative z-10 mb-6 md:mb-10">
                <canvas ref={canvasRef} className="w-[400px] h-[400px] md:w-[650px] md:h-[650px]" />
            </div>

            {/* UI */}
            <div className="relative z-20 text-center space-y-4 md:space-y-6 max-w-2xl px-4 md:px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2 md:space-y-3"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-cyan-950/30 border border-cyan-800/50 rounded-full backdrop-blur-sm">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-[10px] md:text-xs font-mono text-cyan-300 tracking-wider uppercase">{phases[phase]}</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter">
                            NETWORK <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500">LINK AI</span>
                        </h1>

                        <p className="text-sm md:text-xl text-slate-300 font-light tracking-wide px-4">
                            Network Faster than ever with power of <span className="text-cyan-400 font-semibold">Ai</span>
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Progress */}
                <div className="space-y-2 md:space-y-3">
                    <div className="w-full max-w-xs md:max-w-md mx-auto h-1.5 md:h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 backdrop-blur-sm">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-white relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/50 blur-sm" />
                        </motion.div>
                    </div>

                    <div className="flex justify-between w-full max-w-xs md:max-w-md mx-auto text-[9px] md:text-[10px] text-cyan-500/50 font-mono px-2">
                        <span className="hidden md:inline">NODES: {HUBS.length} | ROUTES: {ROUTES.length}</span>
                        <span className="md:hidden">NODES: {HUBS.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
