import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';

interface RelatedArticle {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  categories?: string[];
  image?: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
  currentSlug: string;
}

export function RelatedArticles({ articles, currentSlug }: RelatedArticlesProps) {
  // Filter out current article and limit to 3
  const relatedArticles = articles
    .filter(article => article.slug !== currentSlug)
    .slice(0, 3);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 pt-12 border-t border-amber-200/50">
      <div className="text-center mb-12">
        <h3 className="text-2xl md:text-3xl font-serif font-light text-amber-950">
          Related Words
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {relatedArticles.map((article) => (
          <article key={article.slug} className="group">
            <Link href={`/words/${article.slug}`} className="block">
              {article.image && (
                <div className="aspect-[4/3] overflow-hidden mb-4">
                  <Image
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                    width={400}
                    height={300}
                  />
                </div>
              )}

              <div className="space-y-3">
                {article.categories && article.categories.length > 0 && (
                  <span className="text-xs text-amber-800 uppercase tracking-widest px-3 py-1 rounded-full border border-amber-300 bg-white inline-block">
                    {article.categories[0]}
                  </span>
                )}

                <h4 className="font-serif font-light text-lg text-amber-950 group-hover:text-amber-700 transition-colors line-clamp-2">
                  {article.title}
                </h4>

                <p className="text-amber-700 text-sm leading-relaxed line-clamp-2 font-light">
                  {article.excerpt}
                </p>

                <time className="text-xs text-amber-600 font-light">
                  {format(parseISO(article.date), 'MMM d, yyyy')}
                </time>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}