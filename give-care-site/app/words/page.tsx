import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { getAllPosts, type Post } from '../lib/mdx';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Words - Caregiving Insights & Stories | GiveCare',
  description: 'Real stories, research, and resources for family caregivers. Evidence-based guidance on burnout prevention, self-care, and navigating the caregiving journey.',
  openGraph: {
    title: 'Caregiving Insights & Stories from GiveCare',
    description: 'Real stories, research, and resources for family caregivers navigating the challenges of caring for loved ones.',
    type: 'website',
  },
};

export default async function WordsPage() {
  const posts = await getAllPosts();
  const featuredPost = posts[0]; // First post as featured
  const regularPosts = posts.slice(1);
  
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="section-hero bg-base-100">
          <div className="container-editorial">
            <div className="text-center">
              <h1 className="heading-hero mb-6">
                Stories That See You
              </h1>
              <p className="body-large max-w-2xl mx-auto">
                Real voices from caregivers navigating what no one prepares you for
              </p>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredPost && (
          <section className="pt-8 pb-20 md:pt-12 md:pb-24 bg-base-100">
            <div className="container-editorial">
              <div className="max-w-4xl mx-auto overflow-hidden">
                {featuredPost.image && (
                  <figure>
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-64 md:h-80 object-cover"
                      width={800}
                      height={320}
                      priority
                    />
                  </figure>
                )}
                <div className="p-0 md:p-0 mt-8">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="text-sm text-amber-700">
                      {format(parseISO(featuredPost.date), 'MMMM d, yyyy')}
                    </div>
                    {featuredPost.categories && featuredPost.categories.length > 0 && (
                      <div className="flex gap-2">
                        {featuredPost.categories.slice(0, 3).map((category) => (
                          <div key={category} className="text-xs text-amber-800 uppercase tracking-widest px-3 py-1 rounded-full border border-amber-300 bg-white">
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif font-light text-amber-950 mb-4 leading-tight">
                    <Link href={`/words/${featuredPost.slug}`} className="hover:text-amber-700 transition-colors">
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-base md:text-lg text-amber-700 mb-8 leading-relaxed font-light">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex justify-between items-center mt-10">
                    {featuredPost.author && (
                      <div className="flex items-center gap-4">
                        {featuredPost.author.picture && (
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={featuredPost.author.picture}
                              alt={featuredPost.author.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-normal text-amber-950">{featuredPost.author.name}</div>
                          <div className="text-sm text-amber-700 font-light">Contributing Writer</div>
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/words/${featuredPost.slug}`}
                      className="btn-editorial-primary"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Latest Stories */}
        {regularPosts.length > 0 && (
          <section className="section-standard bg-amber-950">
            <div className="container-editorial">
              <div className="text-center mb-16">
                <h2 className="heading-section-dark mb-4">More Stories</h2>
                <p className="text-lg text-amber-100 font-light">Continued moments from our community</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {regularPosts.map((post: Post) => (
                  <div key={post.slug} className="overflow-hidden hover:opacity-90 transition-opacity">
                    {post.image && (
                      <figure>
                        <Image
                          src={post.image}
                          alt={post.title}
                          className="w-full h-56 object-cover"
                          width={600}
                          height={224}
                        />
                      </figure>
                    )}


                    <div className="mt-6">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="text-xs text-amber-100">
                          {format(parseISO(post.date), 'MMMM d, yyyy')}
                        </div>
                        {post.categories && post.categories.length > 0 && (
                          <div className="text-xs text-amber-100 uppercase tracking-widest px-3 py-1 rounded-full border border-amber-100/30 bg-amber-950/50">
                            {post.categories[0]}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg md:text-xl font-serif font-light text-amber-50 mb-3 leading-tight">
                        <Link href={`/words/${post.slug}`} className="hover:text-amber-100 transition-colors">
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-sm text-amber-100 leading-relaxed mb-6 line-clamp-3 font-light">
                        {post.excerpt}
                      </p>

                      <div className="flex justify-between items-center mt-auto">
                        {post.author && (
                          <div className="flex items-center gap-3">
                            {post.author.picture && (
                              <div className="w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                  src={post.author.picture}
                                  alt={post.author.name}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              </div>
                            )}
                            <span className="text-xs text-amber-100 font-light">{post.author.name}</span>
                          </div>
                        )}

                        <Link
                          href={`/words/${post.slug}`}
                          className="inline-flex items-center gap-1 text-amber-100 hover:text-white text-xs font-light transition-colors tracking-wide"
                        >
                          Read More
                          <span className="text-sm">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
