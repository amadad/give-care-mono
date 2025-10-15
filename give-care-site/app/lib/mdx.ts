import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostMeta {
  title: string;
  excerpt: string;
  date: string; // Should be ISO string format
  categories: string[];
  image?: string;
  imageCaption?: string;
  author?: {
    name: string;
    picture?: string;
  };
}

export interface Post extends PostMeta {
  slug: string;
  content: string; // Raw MDX content
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const realSlug = slug.replace(/\.mdx?$/, '');
  const filePath = path.join(postsDirectory, `${realSlug}.mdx`);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Post file not found: ${filePath}`);
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    if (!data.title || !data.date) {
      console.error(`Post ${slug} is missing required frontmatter (title or date).`);
      return null;
    }

    // Ensure date is a valid ISO string
    let isoDate: string;
    if (data.date instanceof Date) {
      isoDate = data.date.toISOString();
    } else if (typeof data.date === 'string') {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        console.error(`Post ${slug} has an invalid date format: ${data.date}`);
        return null;
      }
      isoDate = parsedDate.toISOString();
    } else {
      console.error(`Post ${slug} has an invalid date type.`);
      return null;
    }

    return {
      slug: realSlug,
      title: data.title as string,
      excerpt: (data.excerpt as string) || '',
      date: isoDate,
      categories: (data.categories as string[]) || [],
      image: (data.image as string) || undefined,
      author: data.author
        ? {
            name: data.author.name as string,
            picture: data.author.picture as string | undefined,
          }
        : undefined,
      content: content, // Pass the raw MDX content
    };
  } catch (error) {
    console.error(`Error reading or processing post ${slug}:`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    const postsPromises = fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx?$/, '');
        return getPostBySlug(slug);
      });

    const resolvedPosts = await Promise.all(postsPromises);

    // Filter out null posts (e.g., if a file was problematic) and sort by date
    return resolvedPosts
      .filter((post): post is Post => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading posts directory or processing posts:', error);
    return [];
  }
}

export async function getPostSlugs(): Promise<string[]> {
  try {
    const files = fs.readdirSync(postsDirectory);
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error('Error getting post slugs:', error);
    return [];
  }
}

