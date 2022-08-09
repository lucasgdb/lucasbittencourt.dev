import Image from 'next/future/image';
import { parseISO, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { PropsWithChildren, Suspense } from 'react';

import Container from 'components/Container';
import { Post } from 'lib/types';
import { urlForImage } from 'lib/sanity';

export default function BlogLayout({
  children,
  post
}: PropsWithChildren<{ post: Post }>) {
  return (
    <Container
      title={`${post.title} – Lucas Bittencourt`}
      description={post.excerpt}
      image={urlForImage(post.coverImage).url()}
      date={new Date(post.date).toISOString()}
      type="article"
    >
      <article className="flex flex-col items-start justify-center w-full max-w-2xl mx-auto mb-16">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-black md:text-5xl dark:text-white">
          {post.title}
        </h1>

        <div className="flex flex-col items-start justify-between w-full mt-2 md:flex-row md:items-center">
          <div className="flex items-center">
            <Image
              alt="Lucas Bittencourt"
              height={24}
              width={24}
              sizes="20vw"
              src="/avatar.jpeg"
              className="rounded-full"
            />
            <p className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
              Lucas Bittencourt /{' '}
              {format(parseISO(post.date), 'MMMM dd, yyyy', {
                locale: ptBR
              })}
            </p>
          </div>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 min-w-32 md:mt-0">
            {post.readingTime}
            {` • `}
          </p>
        </div>

        <Suspense fallback={null}>
          <div className="w-full mt-4 prose dark:prose-dark max-w-none">
            {children}
          </div>

          <div className="mt-8 text-sm text-gray-700 dark:text-gray-300">
            <a
              href={`https://mobile.twitter.com/search?q=${encodeURIComponent(
                `https://lucasbittencourt.dev/blog/${post.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Discutir no Twitter
            </a>
            {' • '}
            <a
              href="https://github.com/lucasgdb/nextjs-portfolio/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sugerir mudanças
            </a>
          </div>
        </Suspense>
      </article>
    </Container>
  );
}
