"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Loader2, 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  Share2, 
  Copy,
  CheckCircle2,
  Edit,
  GripVertical,
  Globe,
  Settings,
  Upload,
  FileText,
  X,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Portfolio, PortfolioSection } from "@/types/portfolio"
import { compressImage } from "@/lib/image-compression"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface PortfolioBuilderProps {
  userId: string
}

export function PortfolioBuilder({ userId }: PortfolioBuilderProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [networkProfile, setNetworkProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isExtractingCV, setIsExtractingCV] = useState(false)
  const [isImprovingCV, setIsImprovingCV] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvData, setCvData] = useState<any>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      // Load network profile
      const { data: profileData } = await supabase
        .from("network_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      setNetworkProfile(profileData)

      // Load existing portfolio
      const { data: portfolioData } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (portfolioData) {
        setPortfolio(portfolioData as Portfolio)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: "error", text: "Invalid file type. Please upload PDF, DOCX, or TXT file" })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setMessage({ type: "error", text: "File size too large. Please upload a file smaller than 10MB" })
        return
      }

      setCvFile(file)
    }
  }

  const extractCVData = async () => {
    if (!cvFile) {
      setMessage({ type: "error", text: "Please select a CV/resume file" })
      return
    }

    setIsExtractingCV(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", cvFile)

      const response = await fetch("/api/cv/extract", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to extract CV data")
      }

      const { cvData: extractedData } = await response.json()
      setCvData(extractedData)

      // Build additional info from CV data
      let cvInfo = `CV/RESUME INFORMATION:\n\n`
      if (extractedData.name) cvInfo += `Name: ${extractedData.name}\n`
      if (extractedData.email) cvInfo += `Email: ${extractedData.email}\n`
      if (extractedData.phone) cvInfo += `Phone: ${extractedData.phone}\n`
      if (extractedData.title) cvInfo += `Title: ${extractedData.title}\n`
      if (extractedData.location) cvInfo += `Location: ${extractedData.location}\n`
      if (extractedData.summary) cvInfo += `\nSummary:\n${extractedData.summary}\n`
      if (extractedData.experience) cvInfo += `\nExperience:\n${extractedData.experience}\n`
      if (extractedData.education) cvInfo += `\nEducation:\n${extractedData.education}\n`
      if (extractedData.skills) cvInfo += `\nSkills:\n${extractedData.skills}\n`
      if (extractedData.certifications) cvInfo += `\nCertifications:\n${extractedData.certifications}\n`
      if (extractedData.projects) cvInfo += `\nProjects:\n${extractedData.projects}\n`

      setAdditionalInfo((prev) => prev ? `${prev}\n\n${cvInfo}` : cvInfo)

      // Update network profile with CV data
      const enhancedProfile = {
        ...networkProfile,
        name: extractedData.name || networkProfile?.name,
        email: extractedData.email || networkProfile?.email,
        phone: extractedData.phone || networkProfile?.phone,
        title: extractedData.title || networkProfile?.title,
      }
      setNetworkProfile(enhancedProfile)

      setMessage({ type: "success", text: "CV/Resume extracted successfully! Information has been added to your portfolio data." })
    } catch (error) {
      console.error("Error extracting CV data:", error)
      setMessage({ type: "error", text: "Failed to extract CV data. Please try again." })
    } finally {
      setIsExtractingCV(false)
    }
  }

  const removeCVFile = () => {
    setCvFile(null)
    setCvData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" })
      return
    }

    // Validate file size (5MB limit before compression)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" })
      return
    }

    setIsUploadingImage(true)
    setMessage(null)

    try {
      // Compress the image (800px max width, 75% quality for minimal file size)
      const compressedFile = await compressImage(file, 800, 0.75)
      
      // Upload the compressed image
      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("imageType", "profile")

      const response = await fetch("/api/portfolio/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to upload image"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error("No image URL returned from server")
      }

      // Update portfolio with image URL
      if (portfolio) {
        const updatedPortfolio = { ...portfolio, profile_image_url: url }
        setPortfolio(updatedPortfolio)
        setMessage({ type: "success", text: "Profile image uploaded successfully" })
      } else {
        // If no portfolio exists yet, save URL for when portfolio is created
        setMessage({ type: "success", text: "Profile image uploaded. It will be saved when you generate the portfolio." })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
    }
  }

  const removeProfileImage = async () => {
    if (!portfolio?.profile_image_url) return

    try {
      const updatedPortfolio = { ...portfolio, profile_image_url: null }
      setPortfolio(updatedPortfolio)
      setMessage({ type: "success", text: "Profile image removed" })
    } catch (error) {
      console.error("Error removing image:", error)
      setMessage({ type: "error", text: "Failed to remove image" })
    }
  }

  const syncGooglePicture = async () => {
    setIsSyncingGoogle(true)
    setMessage(null)

    try {
      const response = await fetch("/api/portfolio/sync-google-picture", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to sync Google picture")
      }

      const { url } = await response.json()

      // Update portfolio with synced image URL
      if (portfolio) {
        const updatedPortfolio = { ...portfolio, profile_image_url: url }
        setPortfolio(updatedPortfolio)
        setMessage({ type: "success", text: "Profile picture synced from Google successfully" })
      } else {
        // If no portfolio exists yet, save URL for when portfolio is created
        setMessage({ type: "success", text: "Profile picture synced. It will be saved when you generate the portfolio." })
      }
    } catch (error) {
      console.error("Error syncing Google picture:", error)
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to sync Google picture. Please ensure you're signed in with Google or have connected your Gmail account." 
      })
    } finally {
      setIsSyncingGoogle(false)
    }
  }

  const improveCVData = async () => {
    if (!cvData) {
      setMessage({ type: "error", text: "Please extract CV data first" })
      return
    }

    setIsImprovingCV(true)
    setMessage(null)

    try {
      const response = await fetch("/api/cv/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cvData }),
      })

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = "Failed to improve CV data"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      if (!responseData.cvData) {
        throw new Error("No improved data received from server")
      }

      const { cvData: improvedData } = responseData
      setCvData(improvedData)

      // Update additional info with improved CV data
      let cvInfo = `CV/RESUME INFORMATION (AI-IMPROVED):\n\n`
      if (improvedData.name) cvInfo += `Name: ${improvedData.name}\n`
      if (improvedData.email) cvInfo += `Email: ${improvedData.email}\n`
      if (improvedData.phone) cvInfo += `Phone: ${improvedData.phone}\n`
      if (improvedData.title) cvInfo += `Title: ${improvedData.title}\n`
      if (improvedData.location) cvInfo += `Location: ${improvedData.location}\n`
      if (improvedData.summary) cvInfo += `\nSummary:\n${improvedData.summary}\n`
      if (improvedData.experience) cvInfo += `\nExperience:\n${improvedData.experience}\n`
      if (improvedData.education) cvInfo += `\nEducation:\n${improvedData.education}\n`
      if (improvedData.skills) cvInfo += `\nSkills:\n${improvedData.skills}\n`
      if (improvedData.certifications) cvInfo += `\nCertifications:\n${improvedData.certifications}\n`
      if (improvedData.projects) cvInfo += `\nProjects:\n${improvedData.projects}\n`

      // Replace existing CV info in additionalInfo or add new
      const existingInfo = additionalInfo
      const cvInfoIndex = existingInfo.indexOf("CV/RESUME INFORMATION")
      if (cvInfoIndex !== -1) {
        // Replace existing CV info
        const beforeCv = existingInfo.substring(0, cvInfoIndex)
        const afterCv = existingInfo.substring(cvInfoIndex)
        const afterCvEnd = afterCv.indexOf("\n\n", afterCv.indexOf("\n\n") + 1)
        const newInfo = afterCvEnd !== -1 
          ? beforeCv + cvInfo + afterCv.substring(afterCvEnd + 2)
          : beforeCv + cvInfo
        setAdditionalInfo(newInfo.trim())
      } else {
        // Add new CV info
        setAdditionalInfo((prev) => prev ? `${prev}\n\n${cvInfo}` : cvInfo)
      }

      // Update network profile with improved CV data
      const enhancedProfile = {
        ...networkProfile,
        name: improvedData.name || networkProfile?.name,
        email: improvedData.email || networkProfile?.email,
        phone: improvedData.phone || networkProfile?.phone,
        title: improvedData.title || networkProfile?.title,
      }
      setNetworkProfile(enhancedProfile)

      setMessage({ type: "success", text: "CV/Resume improved successfully with AI! The enhanced information has been updated." })
    } catch (error) {
      console.error("Error improving CV data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to improve CV data. Please try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsImprovingCV(false)
    }
  }

  const generatePortfolio = async () => {
    if (!networkProfile && !cvData) {
      setMessage({ type: "error", text: "Please complete your network profile or upload a CV/Resume" })
      return
    }

    setIsGenerating(true)
    setMessage(null)

    try {
      // Merge network profile with CV data if available
      const finalProfile = {
        ...networkProfile,
        ...(cvData && {
          name: cvData.name || networkProfile?.name,
          email: cvData.email || networkProfile?.email,
          phone: cvData.phone || networkProfile?.phone,
          title: cvData.title || networkProfile?.title,
        }),
      }

      // Include CV data if extracted
      let finalAdditionalInfo = additionalInfo || ""
      if (cvData && !additionalInfo.includes("CV/RESUME INFORMATION")) {
        let cvInfo = `\n\nCV/RESUME INFORMATION:\n`
        if (cvData.summary) cvInfo += `Summary: ${cvData.summary}\n`
        if (cvData.experience) cvInfo += `Experience: ${cvData.experience}\n`
        if (cvData.education) cvInfo += `Education: ${cvData.education}\n`
        if (cvData.skills) cvInfo += `Skills: ${cvData.skills}\n`
        if (cvData.projects) cvInfo += `Projects: ${cvData.projects}\n`
        finalAdditionalInfo = finalAdditionalInfo + cvInfo
      }

      const response = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          networkProfile: finalProfile || {}, 
          additionalInfo: finalAdditionalInfo,
          cvData: cvData || undefined
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate portfolio")
      }

      const { portfolio: generatedPortfolio } = await response.json()

      // Generate slug from title if not exists
      const slug = portfolio?.slug || generateSlug(generatedPortfolio.title || "portfolio")

      // Merge with existing portfolio or create new structure
      const newPortfolio: Partial<Portfolio> = {
        ...portfolio,
        title: generatedPortfolio.title,
        subtitle: generatedPortfolio.subtitle,
        bio: generatedPortfolio.bio,
        sections: generatedPortfolio.sections,
        slug: slug,
        theme: portfolio?.theme || "modern",
        is_public: portfolio?.is_public ?? false,
        show_contact_info: portfolio?.show_contact_info ?? true,
        show_social_links: portfolio?.show_social_links ?? true,
        user_id: userId,
      }

      setPortfolio(newPortfolio as Portfolio)
      setMessage({ type: "success", text: "Portfolio generated successfully! Review and save when ready." })
    } catch (error) {
      console.error("Error generating portfolio:", error)
      setMessage({ type: "error", text: "Failed to generate portfolio. Please try again." })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).substring(2, 9)
  }

  const savePortfolio = async () => {
    if (!portfolio || !portfolio.title) {
      setMessage({ type: "error", text: "Please generate or add portfolio content first" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Ensure slug exists
      let slug = portfolio.slug
      if (!slug) {
        slug = generateSlug(portfolio.title)
      }

      const portfolioData = {
        user_id: userId,
        slug: slug,
        title: portfolio.title,
        subtitle: portfolio.subtitle || null,
        bio: portfolio.bio || null,
        profile_image_url: portfolio.profile_image_url || null,
        sections: portfolio.sections || [],
        theme: portfolio.theme || "modern",
        is_public: portfolio.is_public ?? false,
        show_contact_info: portfolio.show_contact_info ?? true,
        show_social_links: portfolio.show_social_links ?? true,
      }

      // Check if portfolio with this user_id exists
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id, slug")
        .eq("user_id", userId)
        .maybeSingle()

      let result
      if (existing) {
        // Update existing portfolio (use existing slug if we don't have one)
        result = await supabase
          .from("portfolios")
          .update({ ...portfolioData, slug: existing.slug })
          .eq("user_id", userId)
          .select()
          .single()
      } else {
        // Insert new portfolio
        result = await supabase
          .from("portfolios")
          .insert(portfolioData)
          .select()
          .single()
      }

      const { data, error } = result

      if (error) {
        // Extract meaningful error message from Supabase error
        // Supabase errors can have: message, code, details, hint, etc.
        let errorMessage = "Failed to save portfolio"
        
        if (error.message) {
          errorMessage = error.message
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`
          if ((error as any).details) {
            errorMessage += `: ${(error as any).details}`
          }
          if ((error as any).hint) {
            errorMessage += ` (${(error as any).hint})`
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        } else {
          // Try to stringify the error object for debugging
          try {
            const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error))
            if (errorStr && errorStr !== '{}') {
              errorMessage = errorStr
            }
          } catch {
            // If stringify fails, use default message
          }
        }
        
        // Provide user-friendly messages for common errors
        const lowerMessage = errorMessage.toLowerCase()
        if (lowerMessage.includes("violates row-level security") || lowerMessage.includes("new row violates") || lowerMessage.includes("rls policy")) {
          errorMessage = "Permission denied. Please ensure you're logged in and have permission to save portfolios. This may be a database configuration issue."
        } else if (lowerMessage.includes("duplicate key") || lowerMessage.includes("unique constraint") || lowerMessage.includes("already exists")) {
          errorMessage = "A portfolio with this slug already exists. Please try generating again or change the portfolio title."
        } else if (lowerMessage.includes("foreign key") || lowerMessage.includes("user_id")) {
          errorMessage = "Invalid user account. Please log in again."
        } else if (lowerMessage.includes("invalid input") || lowerMessage.includes("syntax")) {
          errorMessage = "Invalid portfolio data. Please check your portfolio content and try again."
        } else if (lowerMessage.includes("json") || lowerMessage.includes("jsonb")) {
          errorMessage = "Invalid portfolio sections format. Please regenerate the portfolio."
        }
        
        throw new Error(errorMessage)
      }

      if (!data) {
        throw new Error("No data returned from save operation")
      }

      setPortfolio(data as Portfolio)
      
      // If portfolio is public, ensure network profile is also public
      if (portfolioData.is_public) {
        try {
          const { data: existingProfile } = await supabase
            .from("network_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
          
          if (existingProfile) {
            await supabase
              .from("network_profiles")
              .update({ is_public_profile: true })
              .eq("user_id", userId)
            setNetworkProfile({ ...existingProfile, is_public_profile: true })
          } else {
            // Create network profile if it doesn't exist
            const { data: newProfile } = await supabase
              .from("network_profiles")
              .insert({
                user_id: userId,
                is_public_profile: true,
              })
              .select()
              .single()
            if (newProfile) {
              setNetworkProfile(newProfile)
            }
          }
        } catch (error) {
          console.error("Error updating network profile:", error)
          // Don't fail the save if this fails
        }
      }
      
      setMessage({ type: "success", text: "Portfolio saved successfully!" })
    } catch (error) {
      console.error("Error saving portfolio:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save portfolio. Please try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  const addSection = () => {
    if (!portfolio) return

    const newSection: PortfolioSection = {
      id: `section-${Date.now()}`,
      type: "custom",
      title: "New Section",
      content: "",
      order: (portfolio.sections?.length || 0) + 1,
    }

    setPortfolio({
      ...portfolio,
      sections: [...(portfolio.sections || []), newSection],
    })
    setEditingSectionId(newSection.id)
  }

  const deleteSection = (sectionId: string) => {
    if (!portfolio) return

    setPortfolio({
      ...portfolio,
      sections: portfolio.sections?.filter((s) => s.id !== sectionId) || [],
    })
  }

  const updateSection = (sectionId: string, updates: Partial<PortfolioSection>) => {
    if (!portfolio) return

    setPortfolio({
      ...portfolio,
      sections: portfolio.sections?.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ) || [],
    })
  }

  const getPortfolioUrl = () => {
    if (!portfolio?.slug) return ""
    return `${window.location.origin}/portfolio/${portfolio.slug}`
  }

  const copyShareLink = async () => {
    const url = getPortfolioUrl()
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const viewPortfolio = async () => {
    if (!portfolio || !portfolio.title) {
      setMessage({ type: "error", text: "Please generate portfolio content first" })
      return
    }

    // Always save/update portfolio before preview to ensure it exists in database
    try {
      setIsSaving(true)
      const supabase = createClient()
      
      const slug = portfolio.slug || generateSlug(portfolio.title)
      const portfolioData = {
        user_id: userId,
        slug: slug,
        title: portfolio.title,
        subtitle: portfolio.subtitle || null,
        bio: portfolio.bio || null,
        profile_image_url: portfolio.profile_image_url || null,
        sections: portfolio.sections || [],
        theme: portfolio.theme || "modern",
        is_public: portfolio.is_public ?? false,
        show_contact_info: portfolio.show_contact_info ?? true,
        show_social_links: portfolio.show_social_links ?? true,
      }

      const { data: existing } = await supabase
        .from("portfolios")
        .select("id, slug")
        .eq("user_id", userId)
        .maybeSingle()

      let result
      if (existing) {
        // Update existing portfolio, preserve slug
        result = await supabase
          .from("portfolios")
          .update({ ...portfolioData, slug: existing.slug })
          .eq("user_id", userId)
          .select()
          .single()
      } else {
        // Insert new portfolio
        result = await supabase
          .from("portfolios")
          .insert(portfolioData)
          .select()
          .single()
      }

      const { data, error } = result
      if (error) {
        // Extract meaningful error message from Supabase error
        // Supabase errors can have: message, code, details, hint, etc.
        let errorMessage = "Failed to save portfolio"
        
        if (error.message) {
          errorMessage = error.message
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`
          if ((error as any).details) {
            errorMessage += `: ${(error as any).details}`
          }
          if ((error as any).hint) {
            errorMessage += ` (${(error as any).hint})`
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        } else {
          // Try to stringify the error object for debugging
          try {
            const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error))
            if (errorStr && errorStr !== '{}') {
              errorMessage = errorStr
            }
          } catch {
            // If stringify fails, use default message
          }
        }
        
        // Provide user-friendly messages for common errors
        const lowerMessage = errorMessage.toLowerCase()
        if (lowerMessage.includes("violates row-level security") || lowerMessage.includes("new row violates") || lowerMessage.includes("rls policy")) {
          errorMessage = "Permission denied. Please ensure you're logged in and have permission to save portfolios. This may be a database configuration issue."
        } else if (lowerMessage.includes("duplicate key") || lowerMessage.includes("unique constraint") || lowerMessage.includes("already exists")) {
          errorMessage = "A portfolio with this slug already exists. Please try generating again or change the portfolio title."
        } else if (lowerMessage.includes("foreign key") || lowerMessage.includes("user_id")) {
          errorMessage = "Invalid user account. Please log in again."
        } else if (lowerMessage.includes("invalid input") || lowerMessage.includes("syntax")) {
          errorMessage = "Invalid portfolio data. Please check your portfolio content and try again."
        } else if (lowerMessage.includes("json") || lowerMessage.includes("jsonb")) {
          errorMessage = "Invalid portfolio sections format. Please regenerate the portfolio."
        }
        
        throw new Error(errorMessage)
      }

      if (!data) {
        throw new Error("No data returned from save operation")
      }

      // Update state with saved portfolio
      setPortfolio(data as Portfolio)
      
      // Open preview
      const url = `${window.location.origin}/portfolio/${data.slug}`
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error saving portfolio:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save portfolio. Please try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create a professional portfolio from your network profile using AI
          </p>
        </div>
        {portfolio && portfolio.slug && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={viewPortfolio}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
            <Button variant="outline" onClick={copyShareLink}>
              {copiedLink ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <Card className={message.type === "success" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
          <CardContent className="pt-6">
            <p className={message.type === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate Portfolio Section */}
      {(!portfolio || !portfolio.sections || portfolio.sections.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              Generate Portfolio with AI
            </CardTitle>
            <CardDescription>
              Use AI to automatically create a professional portfolio from your network profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label>Profile Image (Optional)</Label>
              <div className="space-y-2">
                {portfolio?.profile_image_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                      <img 
                        src={portfolio.profile_image_url} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Profile image uploaded</p>
                        <p className="text-xs text-muted-foreground">Will be displayed on your portfolio</p>
                      </div>
                      <Button
                        onClick={removeProfileImage}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer flex-1"
                        disabled={isUploadingImage || isSyncingGoogle}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={syncGooglePicture}
                        disabled={isUploadingImage || isSyncingGoogle}
                        className="w-full sm:w-auto"
                      >
                        {isSyncingGoogle ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" /> Sync from Google
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer flex-1"
                        disabled={isUploadingImage || isSyncingGoogle}
                      />
                      {isUploadingImage && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={syncGooglePicture}
                      disabled={isUploadingImage || isSyncingGoogle}
                      className="w-full sm:w-auto"
                    >
                      {isSyncingGoogle ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" /> Sync from Google
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a profile photo or sync from your Google account (will be automatically compressed to save storage)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload CV/Resume (Optional)</Label>
              <div className="space-y-2">
                {!cvFile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cvFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(cvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      onClick={removeCVFile}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={extractCVData}
                      disabled={isExtractingCV}
                      variant="outline"
                      size="sm"
                    >
                      {isExtractingCV ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> Extract
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {cvData && (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                        ✓ CV/Resume extracted successfully
                      </p>
                    </div>
                    <Button
                      onClick={improveCVData}
                      disabled={isImprovingCV}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {isImprovingCV ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Improving with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> AI Improve
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload PDF, DOCX, or TXT file to extract information (max 10MB)
              </p>
            </div>

            {!networkProfile && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Complete your network profile first or provide a LinkedIn URL to generate a better portfolio.{" "}
                  <a href="/dashboard/profile" className="underline font-semibold">
                    Go to Profile
                  </a>
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Additional Information (Optional)</Label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Add any additional details about your experience, projects, skills, or achievements to enhance the portfolio..."
                rows={4}
              />
            </div>

            <Button
              onClick={generatePortfolio}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Portfolio with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Editor */}
      {portfolio && (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Image Upload - Always visible in editor */}
              <div className="space-y-2">
                <Label>Profile Image (Optional)</Label>
                <div className="space-y-2">
                  {portfolio?.profile_image_url ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                        <img 
                          src={portfolio.profile_image_url} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Profile image uploaded</p>
                          <p className="text-xs text-muted-foreground">Will be displayed on your portfolio</p>
                        </div>
                        <Button
                          onClick={removeProfileImage}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="cursor-pointer flex-1"
                          disabled={isUploadingImage || isSyncingGoogle}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={syncGooglePicture}
                          disabled={isUploadingImage || isSyncingGoogle}
                          className="w-full sm:w-auto"
                        >
                          {isSyncingGoogle ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" /> Sync from Google
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="cursor-pointer flex-1"
                          disabled={isUploadingImage || isSyncingGoogle}
                        />
                        {isUploadingImage && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={syncGooglePicture}
                        disabled={isUploadingImage || isSyncingGoogle}
                        className="w-full sm:w-auto"
                      >
                        {isSyncingGoogle ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" /> Sync from Google
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload a profile photo or sync from your Google account (will be automatically compressed to save storage)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={portfolio.title || ""}
                  onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                  placeholder="Portfolio Title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={portfolio.subtitle || ""}
                  onChange={(e) => setPortfolio({ ...portfolio, subtitle: e.target.value })}
                  placeholder="Brief subtitle or tagline"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={portfolio.bio || ""}
                  onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
                  placeholder="Professional bio"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Portfolio</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your portfolio accessible via shareable link
                  </p>
                </div>
                <Switch
                  checked={portfolio.is_public || false}
                  onCheckedChange={(checked) =>
                    setPortfolio({ ...portfolio, is_public: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show in Networkers Directory</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible in the public Networkers section for global networking
                  </p>
                </div>
                <Switch
                  checked={networkProfile?.is_public_profile || false}
                  onCheckedChange={async (checked) => {
                    try {
                      const supabase = createClient()
                      if (networkProfile) {
                        await supabase
                          .from("network_profiles")
                          .update({ is_public_profile: checked })
                          .eq("user_id", userId)
                        setNetworkProfile({ ...networkProfile, is_public_profile: checked })
                      } else {
                        // Create network profile if it doesn't exist
                        const { data: user } = await supabase.auth.getUser()
                        if (user.user) {
                          const { data: newProfile } = await supabase
                            .from("network_profiles")
                            .insert({
                              user_id: userId,
                              is_public_profile: checked,
                            })
                            .select()
                            .single()
                          if (newProfile) {
                            setNetworkProfile(newProfile)
                          }
                        }
                      }
                    } catch (error) {
                      console.error("Error updating public profile:", error)
                      setMessage({ type: "error", text: "Failed to update public profile setting" })
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Contact Info</Label>
                  <p className="text-sm text-muted-foreground">
                    Display contact information on portfolio
                  </p>
                </div>
                <Switch
                  checked={portfolio.show_contact_info ?? true}
                  onCheckedChange={(checked) =>
                    setPortfolio({ ...portfolio, show_contact_info: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Social Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Display social media links on portfolio
                  </p>
                </div>
                <Switch
                  checked={portfolio.show_social_links ?? true}
                  onCheckedChange={(checked) =>
                    setPortfolio({ ...portfolio, show_social_links: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={portfolio.theme || "modern"}
                  onValueChange={(value: any) =>
                    setPortfolio({ ...portfolio, theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Sections</CardTitle>
                <Button onClick={addSection} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolio.sections?.length ? (
                portfolio.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <Card key={section.id} className="relative">
                      <CardContent className="pt-6">
                        {editingSectionId === section.id ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{section.type}</Badge>
                                <Input
                                  value={section.title}
                                  onChange={(e) =>
                                    updateSection(section.id, { title: e.target.value })
                                  }
                                  className="flex-1"
                                  placeholder="Section Title"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSectionId(null)}
                                >
                                  Done
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSection(section.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={section.content}
                              onChange={(e) =>
                                updateSection(section.id, { content: e.target.value })
                              }
                              rows={6}
                              placeholder="Section content"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{section.type}</Badge>
                                <h3 className="font-semibold">{section.title}</h3>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSectionId(section.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {section.content}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No sections yet. Generate a portfolio or add sections manually.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={savePortfolio}
              disabled={isSaving}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Portfolio
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
