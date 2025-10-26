import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

import { PullQuote } from './PullQuote';
import { EditorialCallout } from './EditorialCallout';
import { BlogNewsletterSignup } from './BlogNewsletterSignup';

interface CustomLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  children?: ReactNode;
}

const CustomLink = ({ href, children, ...props }: CustomLinkProps) => {
  if (!href) return <a {...props}>{children}</a>;
  
  const isExternal = href.startsWith('http') || href.startsWith('//');
  
  if (isExternal) {
    return (
      <a 
        href={href} 
        className="text-primary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className="text-primary hover:underline" {...props}>
      {children}
    </Link>
  );
};

// Create a components object that can be used with MDXRemote
export const mdxComponents: MDXComponents = {
  // Headings with editorial styling
  h1: ({ children }) => (
    <h1 className="text-4xl md:text-5xl font-serif font-light text-amber-950 my-8 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl md:text-4xl font-serif font-light text-amber-950 my-7 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl md:text-3xl font-serif font-light text-amber-900 my-6 leading-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl md:text-2xl font-serif font-light text-amber-900 my-5 leading-tight">
      {children}
    </h4>
  ),
  
  // Enhanced paragraph
  p: ({ children, className = '' }) => (
    <p className={`my-4 text-lg leading-relaxed text-amber-900 first:first-letter:float-none first:first-letter:mr-0 first:first-letter:text-inherit first:first-letter:font-normal first:first-letter:leading-normal ${className}`}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#4A2704]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-amber-800">{children}</em>
  ),
  
  // Enhanced lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside pl-4 my-6 space-y-3 text-amber-900">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside pl-4 my-6 space-y-3 text-amber-900">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-lg leading-relaxed">
      <span className="ml-2">{children}</span>
    </li>
  ),
  
  // Enhanced links
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <CustomLink {...props} />,
  
  // Enhanced code blocks
  pre: ({ children }) => (
    <pre className="bg-amber-50 border border-amber-200 p-6 rounded-xl overflow-x-auto my-8 text-amber-900 shadow-sm">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="bg-amber-100 text-amber-900 px-2 py-1 rounded text-sm font-mono border border-amber-200">
      {children}
    </code>
  ),
  
  // Minimal blockquote
  blockquote: ({ children }) => (
    <div className="my-6 pl-4 border-l border-base-300 text-base-content">
      {children}
    </div>
  ),
  
  // Enhanced horizontal rule
  hr: () => (
    <div className="my-12 flex justify-center">
      <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
    </div>
  ),
  
  // Enhanced tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-amber-200 shadow-sm">
      <table className="w-full bg-base-100">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left p-4 bg-amber-50 border-b border-amber-200 font-semibold text-amber-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="p-4 border-b border-amber-100 text-amber-800">
      {children}
    </td>
  ),
  
  // Enhanced images with editorial styling
  img: ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => {
    if (!src) return null;
    
    const altText = alt || title || 'Image';
    
    if (!alt && !title) {
      console.warn(`Image ${src} is missing alt text for accessibility`);
    }
    
    return (
      <figure className="my-10">
        <div className="rounded-xl overflow-hidden shadow-lg border border-amber-200">
          <Image
            src={src}
            alt={altText}
            className="w-full h-auto object-cover"
            width={800}
            height={600}
          />
        </div>
        {title && (
          <figcaption className="text-center text-sm text-amber-700 mt-4 italic font-light">
            {title}
          </figcaption>
        )}
      </figure>
    );
  },

  // Custom editorial components
  PullQuote,
  EditorialCallout,
  BlogNewsletterSignup,
};

// Export the hook version for backward compatibility
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    // Use the same enhanced components as the main export
    ...mdxComponents,
    
    // Allow overrides from the components prop
    ...components,
  };
}
