'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Linkedin, Facebook } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getBlogPost, getBlogPosts } from '@/lib/blog/posts'
import ReactMarkdown from 'react-markdown'

export function BlogPostPage() {
    const params = useParams()
    const slug = params.slug as string
    const post = getBlogPost(slug)
    const allPosts = getBlogPosts()
    const relatedPosts = allPosts.filter(p =>
        p.slug !== slug &&
        (p.category === post?.category || p.tags.some(tag => post?.tags.includes(tag)))
    ).slice(0, 3)

    useEffect(() => {
        if (post) {
            // Track page view
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'page_view', {
                    page_title: post.title,
                    page_location: window.location.href,
                    page_path: `/blog/${slug}`,
                })
            }
        }
    }, [post, slug])

    if (!post) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
                    <p className="text-slate-400 mb-8">The blog post you're looking for doesn't exist.</p>
                    <Link href="/blog">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Blog
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = `${post.title} - Network Link AI Blog`

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href="/blog">
                            <Button variant="ghost" className="mb-8 text-blue-300 hover:text-blue-200">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Blog
                            </Button>
                        </Link>

                        <div className="flex items-center gap-3 mb-6">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                {post.category}
                            </Badge>
                            {post.featured && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                    Featured
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                            {post.title}
                        </h1>

                        <p className="text-xl text-slate-300 mb-8">
                            {post.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-8">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {post.readTime} min read
                            </div>
                            <div className="flex items-center gap-2">
                                By {post.author}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {post.tags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-slate-800 text-slate-300"
                                >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        {/* Share Buttons */}
                        <div className="flex items-center gap-4 pb-8 border-b border-slate-700">
                            <span className="text-sm text-slate-400">Share:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                            >
                                <Twitter className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                            >
                                <Linkedin className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                            >
                                <Facebook className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Article Content */}
            <section className="px-4 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <article className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-6
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-blue-300
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-violet-300
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-slate-300 prose-ol:text-slate-300
            prose-li:my-2
            prose-code:text-blue-300 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
            prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-300
          ">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </article>

                    {/* CTA Section */}
                    <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Ready to Transform Your Networking?
                        </h3>
                        <p className="text-slate-300 mb-6">
                            Join thousands of professionals using Network Link AI to grow their networks 10x faster with intelligent automation.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/waitlist">
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                                    Join Waitlist
                                </Button>
                            </Link>
                            <Link href="/resources">
                                <Button size="lg" variant="outline">
                                    Learn More
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="px-4 pb-20">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-8">Related Articles</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {relatedPosts.map((relatedPost, index) => (
                                <motion.div
                                    key={relatedPost.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                >
                                    <Link href={`/blog/${relatedPost.slug}`}>
                                        <div className="h-full p-6 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                                            <Badge variant="outline" className="border-blue-500/30 text-blue-300 mb-4">
                                                {relatedPost.category}
                                            </Badge>
                                            <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-3 line-clamp-2">
                                                {relatedPost.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                                                {relatedPost.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {relatedPost.readTime} min
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
