"use client"

import { useEffect, useState } from "react"
import { Portfolio } from "@/types/portfolio"
import { Linkedin, Twitter, Github, Instagram, Globe, Mail, Phone, Award, Briefcase, GraduationCap, Code, Sparkles, ArrowDown } from "lucide-react"
import { PublicPortfolioShare } from "@/components/public-portfolio-share"
import { motion, useScroll, useTransform } from "framer-motion"

interface PortfolioClientProps {
  portfolio: Portfolio
  networkProfile: any
}

const getSectionIcon = (type: string) => {
  switch (type) {
    case "about": return <Sparkles className="h-5 w-5" />
    case "experience": return <Briefcase className="h-5 w-5" />
    case "skills": return <Code className="h-5 w-5" />
    case "projects": return <Award className="h-5 w-5" />
    case "education": return <GraduationCap className="h-5 w-5" />
    default: return <Sparkles className="h-5 w-5" />
  }
}

const formatContent = (content: string) => {
  if (!content) return <p className="leading-relaxed">{content}</p>
  
  const lines = content.split('\n').filter(line => line.trim())
  const formatted: JSX.Element[] = []
  let currentList: string[] = []
  let listKey = 0

  const formatTextWithEmphasis = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    const allCapsPattern = /\b([A-Z]{3,})\b/g
    let lastIndex = 0
    let match
    let key = 0
    
    while ((match = allCapsPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : text
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('-') || trimmed.match(/^[•·]\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
      const bulletContent = trimmed.replace(/^[-•·]\s*/, '').replace(/^\d+[\.\)]\s*/, '')
      currentList.push(bulletContent)
    } else {
      if (currentList.length > 0) {
        formatted.push(
          <ul key={`list-${listKey++}`} className="space-y-2.5 mb-5 list-none pl-0">
            {currentList.map((item, i) => (
              <motion.li 
                key={i} 
                className="flex items-start gap-2.5 group"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                viewport={{ once: true }}
              >
                <span className="text-primary mt-1.5 flex-shrink-0 transition-transform group-hover:translate-x-1 text-xs">▸</span>
                <span className="flex-1 leading-relaxed text-[15px]">{formatTextWithEmphasis(item)}</span>
              </motion.li>
            ))}
          </ul>
        )
        currentList = []
      }
      
      if (trimmed.length > 0) {
        formatted.push(
          <p key={index} className="mb-3 last:mb-0 leading-relaxed text-[15px]">
            {formatTextWithEmphasis(trimmed)}
          </p>
        )
      }
    }
  })

  if (currentList.length > 0) {
    formatted.push(
      <ul key={`list-${listKey}`} className="space-y-2.5 mb-5 list-none pl-0">
        {currentList.map((item, i) => (
          <motion.li 
            key={i} 
            className="flex items-start gap-2.5 group"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            viewport={{ once: true }}
          >
            <span className="text-primary mt-1.5 flex-shrink-0 transition-transform group-hover:translate-x-1 text-xs">▸</span>
            <span className="flex-1 leading-relaxed text-[15px]">{formatTextWithEmphasis(item)}</span>
          </motion.li>
        ))}
      </ul>
    )
  }

  return formatted.length > 0 ? formatted : <p className="leading-relaxed text-[15px]">{content}</p>
}

export function PortfolioClient({ portfolio: portfolioData, networkProfile }: PortfolioClientProps) {
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0.8, 1])

  const getLinkedInUrl = (linkedin?: string | null) => {
    if (!linkedin) return ""
    if (linkedin.startsWith("http")) return linkedin
    return `https://linkedin.com/in/${linkedin}`
  }

  const getTwitterUrl = (twitter?: string | null) => {
    if (!twitter) return ""
    const username = twitter.replace("@", "")
    return `https://twitter.com/${username}`
  }

  const getGithubUrl = (github?: string | null) => {
    if (!github) return ""
    if (github.startsWith("http")) return github
    return `https://github.com/${github}`
  }

  const getInstagramUrl = (instagram?: string | null) => {
    if (!instagram) return ""
    const username = instagram.replace("@", "")
    return `https://instagram.com/${username}`
  }

  const sections = portfolioData.sections?.sort((a, b) => a.order - b.order) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/5" />
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Sticky Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
        style={{ opacity: headerOpacity }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <motion.h1 
              className="text-base font-semibold tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {portfolioData.title}
            </motion.h1>
            <PublicPortfolioShare title={portfolioData.title} subtitle={portfolioData.subtitle} />
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32 max-w-4xl relative">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Profile Image */}
            {portfolioData.profile_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative mb-4"
              >
                <div className="relative">
                  <img 
                    src={portfolioData.profile_image_url} 
                    alt={portfolioData.title}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-primary/20 shadow-lg ring-4 ring-background"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                </div>
              </motion.div>
            )}

            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide uppercase">Portfolio</span>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {portfolioData.title}
              </motion.h1>
              
              {portfolioData.subtitle && (
                <motion.p
                  className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-normal max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {portfolioData.subtitle}
                </motion.p>
              )}
            </div>
            
            {/* Decorative line */}
            <motion.div
              className="w-24 h-0.5 bg-primary/30 mx-auto mt-6"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            
            {portfolioData.bio && (
              <motion.div
                className="max-w-2xl mx-auto pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="text-base sm:text-[17px] text-foreground/80 leading-relaxed">
                  {portfolioData.bio}
                </p>
              </motion.div>
            )}
          </div>

          {/* Contact & Social Links */}
          {(portfolioData.show_contact_info || portfolioData.show_social_links) && networkProfile && (
            <motion.div
              className="flex flex-wrap gap-3 justify-center mt-12 pt-8 border-t border-border/40"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {portfolioData.show_contact_info && (
                <>
                  {networkProfile.email && (
                    <motion.a
                      href={`mailto:${networkProfile.email}`}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium">Email</span>
                    </motion.a>
                  )}
                  {networkProfile.phone && (
                    <motion.a
                      href={`tel:${networkProfile.phone}`}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium">Phone</span>
                    </motion.a>
                  )}
                </>
              )}
              {portfolioData.show_social_links && (
                <>
                  {networkProfile.linkedin && (
                    <motion.a
                      href={getLinkedInUrl(networkProfile.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500/50 transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </motion.a>
                  )}
                  {networkProfile.twitter && (
                    <motion.a
                      href={getTwitterUrl(networkProfile.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:border-sky-500/50 transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                      <span className="text-sm font-medium">Twitter</span>
                    </motion.a>
                  )}
                  {networkProfile.github && (
                    <motion.a
                      href={getGithubUrl(networkProfile.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-950/20 hover:border-gray-500/50 transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Github className="h-4 w-4 text-muted-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                      <span className="text-sm font-medium">GitHub</span>
                    </motion.a>
                  )}
                  {networkProfile.instagram && (
                    <motion.a
                      href={getInstagramUrl(networkProfile.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:border-pink-500/50 transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Instagram className="h-4 w-4 text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
                      <span className="text-sm font-medium">Instagram</span>
                    </motion.a>
                  )}
                  {networkProfile.website && (
                    <motion.a
                      href={networkProfile.website.startsWith("http") ? networkProfile.website : `https://${networkProfile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium">Website</span>
                    </motion.a>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Scroll Indicator */}
          {sections.length > 0 && (
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </section>

      {/* Portfolio Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative bg-card border border-border/50 rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30 group h-full flex flex-col">
                {/* Decorative corner accent */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-primary/5 rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Section Header */}
                <div className="flex items-start gap-4 mb-6 pb-4 border-b border-border/50 relative">
                  <motion.div
                    className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {getSectionIcon(section.type)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Section Content */}
                <motion.div
                  className="prose prose-lg dark:prose-invert max-w-none flex-1"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="text-foreground/90 leading-relaxed">
                    {formatContent(section.content)}
                  </div>
                </motion.div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        className="border-t border-border/40 mt-20 sm:mt-24 py-10 bg-muted/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Netlink-Cogni</span>
          </p>
          <p className="text-xs text-muted-foreground/80">
            Professional portfolio created with AI-powered tools
          </p>
        </div>
      </motion.footer>
    </div>
  )
}

