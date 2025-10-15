import { MetadataRoute } from 'next'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://givecareapp.com'

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/words',
    '/privacy',
    '/terms',
    '/subscription',
    '/welcome'
  ]

  // Get blog posts
  const getBlogPosts = () => {
    try {
      const contentDir = join(process.cwd(), 'content/posts')
      const files = readdirSync(contentDir)
      
      return files
        .filter(file => file.endsWith('.mdx'))
        .map(file => {
          const slug = file.replace('.mdx', '')
          const filePath = join(contentDir, file)
          const stats = statSync(filePath)
          
          return {
            url: `${baseUrl}/words/${slug}`,
            lastModified: stats.mtime,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }
        })
    } catch (error) {
      console.warn('Error reading blog posts for sitemap:', error)
      return []
    }
  }

  const blogPosts = getBlogPosts()

  // Create sitemap entries for static routes
  const staticEntries = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  return [...staticEntries, ...blogPosts]
}