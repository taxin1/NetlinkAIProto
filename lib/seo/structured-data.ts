import { siteConfig } from './metadata'

export interface Article {
    title: string
    description: string
    publishedTime: string
    modifiedTime?: string
    authors: string[]
    image: string
    slug: string
}

export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        alternateName: siteConfig.shortName,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        description: siteConfig.description,
        email: siteConfig.email,
        sameAs: [
            siteConfig.links.twitter,
            siteConfig.links.linkedin,
            siteConfig.links.github,
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            email: siteConfig.email,
            contactType: 'Customer Service',
            availableLanguage: ['English'],
        },
    }
}

export function generateWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: {
                '@type': 'ImageObject',
                url: `${siteConfig.url}/logo.png`,
            },
        },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteConfig.url}/blog?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }
}

export function generateSoftwareApplicationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '6.00',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '127',
            bestRating: '5',
            worstRating: '1',
        },
        description: siteConfig.description,
        screenshot: `${siteConfig.url}/logo.png`,
        featureList: [
            'AI-Powered Business Card Scanning',
            'Automated Email Generation',
            'Contact Relationship Management',
            'Event Networking Tools',
            'Portfolio Builder',
            'Voice AI Assistant',
        ],
    }
}

export function generateArticleSchema(article: Article) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        image: article.image,
        datePublished: article.publishedTime,
        dateModified: article.modifiedTime || article.publishedTime,
        author: article.authors.map(author => ({
            '@type': 'Person',
            name: author,
        })),
        publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            logo: {
                '@type': 'ImageObject',
                url: `${siteConfig.url}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteConfig.url}/blog/${article.slug}`,
        },
    }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${siteConfig.url}${item.url}`,
        })),
    }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }
}

export function generateHowToSchema({
    name,
    description,
    steps,
    totalTime,
}: {
    name: string
    description: string
    steps: { name: string; text: string }[]
    totalTime?: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        totalTime,
        step: steps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
        })),
    }
}
