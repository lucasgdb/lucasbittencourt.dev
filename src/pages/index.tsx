import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Container from '../components/Container';
import BlogPostCard from 'components/BlogPostCard';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Container>
        <div className="flex flex-col justify-center items-start max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pb-16">
          <div className="flex flex-col-reverse sm:flex-row items-start">
            <div className="flex flex-col pr-8">
              <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-1 text-black dark:text-white">
                Lucas Bittencourt
              </h1>
              <h2 className="text-gray-700 dark:text-gray-200 mb-4">
                Desenvolvedor Full Stack no <span className="font-semibold">Hospital Albert Einstein</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-16">
                Meu nome é Lucas Bittencourt, 23, Desenvolvedor Full Stack e amante do DevOps!
              </p>
            </div>
            <div className="w-[80px] sm:w-[176px] relative mb-8 sm:mb-0 mr-auto">
              <Image
                alt="Lucas Bittencourt"
                height={176}
                width={176}
                src="/avatar.jpeg"
                sizes="30vw"
                className="rounded-full filter grayscale"
                priority
              />
            </div>
          </div>

          <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-6 text-black dark:text-white">Destaques</h3>

          <div className="flex gap-6 flex-col md:flex-row">
            <BlogPostCard
              title="Performance no React | Guia completo"
              slug="performance-no-react"
              gradient="from-[#61DAFB] to-[#818CF8]"
            />

            <BlogPostCard
              title="JavaScript moderno | Básico"
              slug="javascript-moderno"
              gradient="from-[#323330] via-[#F0DB4F] to-[#F0DB4F]"
            />

            {/* <BlogPostCard
              title="Edge Computing - O Futuro da Conectividade"
              slug="react-state-management"
              gradient="from-[#FDE68A] via-[#FCA5A5] to-[#FECACA]"
            /> */}
          </div>

          <Link
            href="/blog"
            className="flex mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
          >
            Ver mais postagens
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 ml-1">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
              />
            </svg>
          </Link>

          {/*
          <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-4 mt-16 text-black dark:text-white">
            Canal no YouTube
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-4"></p>

          <VideoCard
            index="01"
            href="https://www.youtube.com/watch?v=MxR5I5_hOKk&list=PL6bwFJ82M6FXgctyoWXqj7H0GK8_YIeF1&index=2"
            length="1:02:45"
            title="Introduction to React 2025"
          />

        
          <VideoCard
            index="02"
            href="https://www.youtube.com/watch?v=AGl52moyISU&list=PL6bwFJ82M6FXgctyoWXqj7H0GK8_YIeF1&index=3"
            length="54:22"
            title="Firestore, Chakra UI, Absolute Imports"
          />

          <VideoCard
            index="03"
            href="https://www.youtube.com/watch?v=3g6-v3_BNbM&list=PL6bwFJ82M6FXgctyoWXqj7H0GK8_YIeF1&index=4"
            length="1:08:30"
            title="Designing & Building the Dashboard"
          />

          <VideoCard
            index="04"
            href="https://www.youtube.com/watch?v=u8iv_yhSRI8&list=PL6bwFJ82M6FXgctyoWXqj7H0GK8_YIeF1&index=5"
            length="1:13:45"
            title="Firebase Admin with Next.js + SWR"
          />

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.youtube.com/channel/UC2FNqFO-vftS6bjwr_0vChg/videos"
            className="flex mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
          >
            Watch all videos
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 ml-1"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
              />
            </svg>
          </a> */}
          <span className="h-16" />
        </div>
      </Container>
    </Suspense>
  );
}
