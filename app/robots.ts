import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/dashboard/',
                    '/auth/',
                    '/onboarding/',
                    '/_next/',
                    '/checkout/',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/dashboard/',
                    '/auth/',
                    '/onboarding/',
                    '/_next/',
                    '/checkout/',
                ],
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/dashboard/',
                    '/auth/',
                    '/onboarding/',
                    '/_next/',
                    '/checkout/',
                ],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.networklinkai.com'}/sitemap.xml`,
    }
}
