import { Metadata } from 'next'
import { BlogPage } from '@/components/blog-page'
import { generateMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = generateMetadata({
    title: 'Blog - AI Networking Insights & Strategies',
    description: 'Learn how to leverage AI for professional networking, automate outreach, manage contacts, and build meaningful relationships. Expert insights on business networking in 2026.',
    keywords: [
        'networking blog',
        'AI networking tips',
        'professional networking advice',
        'business networking strategies',
        'networking automation',
        'CRM best practices',
        'email outreach tips',
    ],
    canonical: '/blog',
})

export default function Blog() {
    return <BlogPage />
}
