import { Suspense, useState } from 'react';

import Container from 'components/Container';
import BlogPost from 'components/BlogPost';
import { InferGetStaticPropsType } from 'next';
import { indexQuery } from 'lib/queries';
import { getClient } from 'lib/sanity-server';
import { Post } from 'lib/types';

export default function Blog({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [searchValue, setSearchValue] = useState('');
  const filteredBlogPosts = posts.filter((post) => post.title.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <Container
      title="Blog | Lucas Bittencourt"
      description="Pensamentos sobre a indústria de software, programação e tecnologia."
    >
      <div className="flex flex-col items-start justify-center max-w-2xl mx-auto mb-16">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-black md:text-5xl dark:text-white">Blog</h1>

        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Criei este blog com o intuito de aprender ensinando pessoas. Ao total, há {posts.length} artigo
          {posts.length === 1 ? '' : 's'} compartilhado
          {posts.length === 1 ? '' : 's'}. Siga meu{' '}
          <a href="https://twitter.com/lucasgdbi" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>{' '}
          para atualizações de futuras postagens. Tenha bom proveito!
        </p>

        <div className="relative w-full mb-4">
          <input
            aria-label="Procurar artigos"
            type="text"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Procurar artigos"
            className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-200 rounded-md dark:border-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          />

          <svg
            className="absolute w-5 h-5 text-gray-400 right-3 top-3 dark:text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {!searchValue && (
          <>
            <h3 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-black md:text-4xl dark:text-white">
              Destaques
            </h3>

            <BlogPost
              title="Performance no React"
              excerpt="Entenda conceitos de memoização, igualdade referencial, algoritmo de reconciliação, memo, useMemo, useCallback, do porquê utilizamos a propriedade key em loops, além de exemplos práticos com código."
              slug="performance-no-react"
            />

            {/* <BlogPost
              title="Everything I Know About Style Guides, Design Systems, and Component Libraries"
              excerpt="A deep-dive on everything I've learned in the past year building style guides, design systems, component libraries, and their best practices."
              slug="style-guides-component-libraries-design-systems"
            /> */}

            {/* <BlogPost
              title="Building a Design System Monorepo with Turborepo"
              excerpt="Manage multiple packages with a shared build, test, and release process using Turborepo, Changesets, Storybook, and more."
              slug="turborepo-design-system-monorepo"
            /> */}
          </>
        )}

        <Suspense fallback={null}>
          <h3 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-black md:text-4xl dark:text-white">
            Postagens
          </h3>

          {!filteredBlogPosts.length && (
            <p className="mb-4 text-gray-600 dark:text-gray-400">Nenhuma postagem encontrada.</p>
          )}

          {filteredBlogPosts.map((post) => (
            <BlogPost key={post.title} slug={post.slug} title={post.title} excerpt={post.excerpt} />
          ))}
        </Suspense>
      </div>
    </Container>
  );
}

export async function getStaticProps({ preview = false }) {
  const posts: Post[] = await getClient(preview).fetch(indexQuery);

  return { props: { posts } };
}
