import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import Container from 'components/Container';
import mediumZoom from 'medium-zoom';

export default function About() {
  useEffect(() => {
    mediumZoom('#my-photo');
    mediumZoom('#setup-photo');
    mediumZoom('#family-photo');
  }, []);

  return (
    <Container title="Sobre | Lucas Bittencourt">
      <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">Sobre mim</h1>
        <div className="mb-8 prose dark:prose-dark leading-6">
          <h2>Links</h2>

          <ul>
            <li>
              Twitter: <a href="https://twitter.com/lucasgdbi">@lucasgdbi</a>
            </li>

            <li>
              GitHub: <a href="https://github.com/lucasgdb">@lucasgdb</a>
            </li>

            <li>
              Website: <Link href="https://lucasbittencourt.dev">https://lucasbittencourt.dev</Link>
            </li>

            <li>
              LinkedIn:{' '}
              <a href="https://www.linkedin.com/in/lucas-bittencourt/">https://www.linkedin.com/in/lucas-bittencourt</a>
            </li>
          </ul>

          <h2>Bio</h2>

          <h3>Profissão</h3>
          <p>Desenvolvedor Full Stack | Hospital Albert Einstein</p>

          <h3>Um pouco sobre mim</h3>
          <p>
            E aí, meu nome é Lucas. Sou Desenvolvedor Full Stack no{' '}
            <a href="https://www.einstein.br/Pages/Home.aspx">Hospital Albert Einstein</a>, onde tenho desafios cada vez
            maiores e aprendo constantemente novas coisas, procurando sempre me aperfeiçoar. Stack utilizada: React.js,
            Node.js, MongoDB, AWS, Git, entre outras.
          </p>

          <h2>Fotos</h2>

          <div className="flex flex-col gap-y-4">
            <div className="flex space-x-8">
              <Image
                alt="Lucas Bittencourt"
                width={300}
                height={300}
                quality={100}
                src="/static/images/me.jpeg"
                className="rounded-md"
                id="my-photo"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Image
                alt="Setup"
                width={300}
                height={300}
                quality={100}
                src="/static/images/setup.jpg"
                className="rounded-md"
                id="setup-photo"
              />

              <Image
                alt="Family"
                width={300}
                height={300}
                quality={100}
                src="/static/images/family.jpg"
                className="rounded-md"
                id="family-photo"
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
