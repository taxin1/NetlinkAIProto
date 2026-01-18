import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://netlink-ai.vercel.app'
  
  const routes = [
    '',
    '/pricing',
    '/public/networkers',
    '/public/about',
    '/resources',
    '/resources/getting-started',
    '/resources/setup-guide',
    '/resources/faq',
    '/resources/pricing',
    '/waitlist',
    '/terms',
    '/privacy',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }))
}
