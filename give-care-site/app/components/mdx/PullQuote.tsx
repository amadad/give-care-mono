interface PullQuoteProps {
  children: React.ReactNode;
  author?: string;
}

export function PullQuote({
  children,
  author
}: PullQuoteProps) {
  return (
    <div className="my-10">
      <div className="pl-6 border-l border-amber-300">
        <div className="text-amber-900 text-lg md:text-xl font-light italic leading-relaxed">
          {children}
        </div>
        {author && (
          <div className="mt-3 text-amber-700 text-sm font-light">
            — {author}
          </div>
        )}
      </div>
    </div>
  );
}