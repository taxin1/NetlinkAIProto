import { Metadata } from 'next'

export const siteConfig = {
    name: 'Network Link AI',
    shortName: 'Netlink AI',
    description: 'Transform your professional networking with AI-powered automation. Scan business cards, generate personalized emails, and manage relationships 10x faster with intelligent CRM.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.networklinkai.com',
    ogImage: '/Logo1.png',
    links: {
        twitter: 'https://twitter.com/NetlinkAI',
        linkedin: 'https://linkedin.com/company/netlink-ai',
        github: 'https://github.com/netlink-ai',
    },
    keywords: [
        // Primary Keywords
        'AI networking platform',
        'business card scanner AI',
        'professional networking automation',
        'AI CRM for professionals',

        // Secondary Keywords
        'automated email outreach',
        'contact management software',
        'networking intelligence platform',
        'AI relationship management',
        'business networking tools',

        // Long-tail Keywords
        'how to automate professional networking',
        'best AI tools for networking',
        'business card to CRM automation',
        'personalized email generation AI',
        'professional network growth tools',

        // Industry-specific
        'sales networking automation',
        'entrepreneur networking tools',
        'conference networking app',
        'B2B relationship management',
        'professional contact organizer',
    ],
    creator: 'Network Link AI Team',
    email: 'networklinkai@gmail.com',
}

export function generateMetadata({
    title,
    description,
    image = siteConfig.ogImage,
    keywords = [],
    noIndex = false,
    canonical,
}: {
    title?: string
    description?: string
    image?: string
    keywords?: string[]
    noIndex?: boolean
    canonical?: string
}): Metadata {
    const metaTitle = title
        ? `${title} | ${siteConfig.shortName}`
        : `${siteConfig.name} - Intelligent Professional Networking & Relationship Management`

    const metaDescription = description || siteConfig.description

    const allKeywords = [...siteConfig.keywords, ...keywords]

    return {
        title: metaTitle,
        description: metaDescription,
        keywords: allKeywords,
        authors: [{ name: siteConfig.creator }],
        creator: siteConfig.creator,
        publisher: siteConfig.name,
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        metadataBase: new URL(siteConfig.url),
        alternates: {
            canonical: canonical || '/',
            languages: {
                'en-US': '/',
            },
        },
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: siteConfig.url,
            title: metaTitle,
            description: metaDescription,
            siteName: siteConfig.name,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${siteConfig.name} - ${metaDescription}`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDescription,
            images: [image],
            creator: '@NetlinkAI',
        },
        robots: {
            index: !noIndex,
            follow: !noIndex,
            googleBot: {
                index: !noIndex,
                follow: !noIndex,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        category: 'Technology',
    }
}

export function generateBlogMetadata({
    title,
    description,
    publishedTime,
    modifiedTime,
    authors = [siteConfig.creator],
    tags = [],
    image = siteConfig.ogImage,
    slug,
}: {
    title: string
    description: string
    publishedTime: string
    modifiedTime?: string
    authors?: string[]
    tags?: string[]
    image?: string
    slug: string
}): Metadata {
    const url = `${siteConfig.url}/blog/${slug}`

    return {
        title: `${title} | ${siteConfig.shortName} Blog`,
        description,
        keywords: [...siteConfig.keywords, ...tags],
        authors: authors.map(name => ({ name })),
        creator: siteConfig.creator,
        publisher: siteConfig.name,
        metadataBase: new URL(siteConfig.url),
        alternates: {
            canonical: `/blog/${slug}`,
        },
        openGraph: {
            type: 'article',
            locale: 'en_US',
            url,
            title,
            description,
            siteName: siteConfig.name,
            publishedTime,
            modifiedTime: modifiedTime || publishedTime,
            authors: authors,
            tags,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: '@NetlinkAI',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    }
}
