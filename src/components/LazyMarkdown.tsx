import React, { Suspense, lazy } from 'react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface LazyMarkdownProps {
  children: string;
}

export default function LazyMarkdown({ children }: LazyMarkdownProps) {
  return (
    <Suspense fallback={<span>Loading...</span>}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </Suspense>
  );
}
