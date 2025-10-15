import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from './Components';

interface MDXRendererProps {
  content: string;
}

export function MDXRenderer({ content }: MDXRendererProps) {
  return (
    <div className="max-w-none">
      <div className="text-amber-900 leading-relaxed text-lg">
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            parseFrontmatter: false,
          }}
        />
      </div>
    </div>
  );
}
