'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Calendar, Clock, Tag, TrendingUp, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getBlogPosts, getAllCategories, getAllTags } from '@/lib/blog/posts'

export function BlogPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    const allPosts = getBlogPosts()
    const categories = getAllCategories()
    const tags = getAllTags()

    const filteredPosts = allPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesCategory = !selectedCategory || post.category === selectedCategory
        const matchesTag = !selectedTag || post.tags.includes(selectedTag)

        return matchesSearch && matchesCategory && matchesTag
    })

    const featuredPost = allPosts.find(post => post.featured)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-300">Network Link AI Blog</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                            Insights on AI Networking
                        </h1>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            Learn how to leverage AI to grow your professional network, automate outreach, and build meaningful relationships at scale.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl mx-auto mb-12"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                            />
                        </div>
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap gap-4 justify-center mb-12"
                    >
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant={selectedCategory === null ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setSelectedCategory(null)}
                            >
                                All Categories
                            </Badge>
                            {categories.map(category => (
                                <Badge
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Post */}
            {featuredPost && !searchQuery && !selectedCategory && !selectedTag && (
                <section className="px-4 mb-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                            <h2 className="text-2xl font-bold text-white">Featured Article</h2>
                        </div>
                        <Link href={`/blog/${featuredPost.slug}`}>
                            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer group">
                                <CardHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                            Featured
                                        </Badge>
                                        <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                                            {featuredPost.category}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-3xl text-white group-hover:text-blue-300 transition-colors">
                                        {featuredPost.title}
                                    </CardTitle>
                                    <CardDescription className="text-lg text-slate-300">
                                        {featuredPost.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="flex items-center gap-6 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {featuredPost.readTime} min read
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    </div>
                </section>
            )}

            {/* Blog Posts Grid */}
            <section className="px-4 pb-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <Link href={`/blog/${post.slug}`}>
                                    <Card className="h-full bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                                        <CardHeader>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                                                    {post.category}
                                                </Badge>
                                                {post.featured && (
                                                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                                        Featured
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                                                {post.title}
                                            </CardTitle>
                                            <CardDescription className="text-slate-400 line-clamp-3">
                                                {post.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {post.tags.slice(0, 3).map(tag => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="text-xs bg-slate-800 text-slate-300"
                                                    >
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {post.readTime} min
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-slate-400 text-lg">No articles found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Tags Cloud */}
            <section className="px-4 pb-20">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Popular Topics</h2>
                    <div className="flex flex-wrap gap-3">
                        {tags.map(tag => (
                            <Badge
                                key={tag}
                                variant={selectedTag === tag ? "default" : "outline"}
                                className="cursor-pointer text-sm py-2 px-4"
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            >
                                <Tag className="w-3 h-3 mr-2" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
