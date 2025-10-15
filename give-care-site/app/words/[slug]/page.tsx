import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPosts, type Post } from '@/app/lib/mdx';
import { MDXRenderer } from '@/app/components/mdx/MDXRenderer';
import { RelatedArticles } from '@/app/components/mdx/RelatedArticles';
import { BlogNewsletterSignup } from '@/app/components/mdx/BlogNewsletterSignup';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

// Helper for consistent badge colors by category
// const getBadgeColor = (category: string) => {
//   // Simple hash function to convert category to a consistent number
//   const hash = category.split('').reduce((acc, char) => {
//     return char.charCodeAt(0) + ((acc << 5) - acc);
//   }, 0);
//   
//   // Use absolute value and modulo to get a consistent index
//   const colors = [
//     'badge-primary',
//     'badge-secondary',
//     'badge-accent',
//     'badge-info',
//     'badge-success',
//     'badge-warning',
//     'badge-error',
//   ];
//   
//   return colors[Math.abs(hash) % colors.length];
// };

// interface PostPageProps {
//   params: {
//     slug: string;
//   };
// }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: currentSlug } = await params;

  if (!currentSlug) {
    return {
      title: 'Invalid Post Request',
      description: 'The post slug was not provided.',
    };
  }

  const post = await getPostBySlug(currentSlug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }

  return {
    title: `${post.title} - GiveCare`,
    description: post.excerpt,
  };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: currentSlug } = await params;

  if (!currentSlug) {
    notFound(); // Should not happen if generateStaticParams is correct
  }

  const postData = await getPostBySlug(currentSlug);

  if (!postData) {
    notFound();
  }

  const post: Post = postData;
  const allPosts = await getAllPosts();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      
      {/* Hero Section with Featured Image */}
      {post.image && (
        <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="container mx-auto px-6 max-w-5xl">
              <div className="max-w-4xl">
                {post.categories && post.categories.length > 0 && (
                  <div className="flex gap-2 mb-6">
                    {post.categories.slice(0, 3).map((category: string) => (
                      <span
                        key={category}
                        className="text-xs text-white uppercase tracking-widest px-3 py-1 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white mb-6 leading-tight tracking-tight">
                  {post.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl font-light">
                  {post.excerpt}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <article className="max-w-4xl mx-auto">
            {/* Article Header (for posts without images) */}
            {!post.image && (
              <header className="mb-16 text-center">
                {post.categories && post.categories.length > 0 && (
                  <div className="flex justify-center gap-2 mb-6">
                    {post.categories.slice(0, 3).map((category: string) => (
                      <span
                        key={category}
                        className="text-xs text-amber-800 uppercase tracking-widest px-3 py-1 rounded-full border border-amber-300 bg-white"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-amber-950 mb-6 leading-tight tracking-tight">
                  {post.title}
                </h1>
                <p className="text-lg md:text-xl text-amber-700 leading-relaxed max-w-3xl mx-auto font-light">
                  {post.excerpt}
                </p>
              </header>
            )}

            {/* Article Meta */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-16 pb-8 border-b border-amber-200/50">
              <div className="flex items-center gap-4">
                {post.author && (
                  <>
                    {post.author.picture && (
                      <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        <Image
                          src={post.author.picture}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-normal text-amber-950">{post.author.name}</div>
                      <div className="text-sm text-amber-700 font-light">Contributing Writer</div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 text-amber-700">
                <time dateTime={post.date} className="flex items-center gap-2 text-sm text-amber-700 font-light">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(parseISO(post.date), 'MMMM d, yyyy')}
                </time>

                <div className="flex items-center gap-2 text-sm text-amber-700 font-light">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>5 min read</span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="max-w-none">
              <MDXRenderer content={post.content} />
            </div>

            {/* Newsletter Signup */}
            <BlogNewsletterSignup />

            {/* Article Footer */}
            <footer className="mt-20 pt-10 pb-4 border-t border-amber-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <Link
                  href="/words"
                  className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-950 transition-colors text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to all words
                </Link>

                <div className="flex items-center gap-4">
                  <span className="text-amber-700">Share this story:</span>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-800 hover:text-amber-950 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-800 hover:text-amber-950 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98a8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-800 hover:text-amber-950 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </footer>

            {/* Related Articles */}
            <RelatedArticles articles={allPosts} currentSlug={currentSlug} />
          </article>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
