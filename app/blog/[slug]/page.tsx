import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostPage } from '@/components/blog-post-page'
import { getBlogPost, getBlogPosts } from '@/lib/blog/posts'
import { generateBlogMetadata } from '@/lib/seo/metadata'
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data'

export async function generateStaticParams() {
    const posts = getBlogPosts()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = getBlogPost(params.slug)

    if (!post) {
        return {
            title: 'Post Not Found',
        }
    }

    return generateBlogMetadata({
        title: post.title,
        description: post.description,
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author],
        tags: post.tags,
        image: post.image,
        slug: post.slug,
    })
}

export default function BlogPost({ params }: { params: { slug: string } }) {
    const post = getBlogPost(params.slug)

    if (!post) {
        notFound()
    }

    const articleSchema = generateArticleSchema({
        title: post.title,
        description: post.description,
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author],
        image: post.image,
        slug: post.slug,
    })

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
    ])

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <BlogPostPage />
        </>
    )
}
