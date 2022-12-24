import Container from 'components/Container';
import mediumZoom from 'medium-zoom';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Uses() {
  useEffect(() => {
    mediumZoom('#my-setup');
  }, []);

  return (
    <Container
      title="Equipamentos | Lucas Bittencourt"
      description="Aqui está o que estou usando atualmente para programar, ver vídeos e ouvir música."
    >
      <article className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          Meus equipamentos
        </h1>

        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          Aqui está o que estou usando atualmente para programar, ver vídeos e
          ouvir música. A maioria deles foi acumulada ao longo dos últimos anos,
          com uma atualização recente do escritório em 2021.
        </p>

        <Image
          className="rounded-lg"
          id="my-setup"
          alt="Meu setup"
          src="/static/images/setup.jpg"
          width={1082}
          height={773}
          priority
        />

        <div className="prose dark:prose-dark w-full">
          <h3 id="computer-office">Computador / Escritório</h3>

          <ul>
            <li>16&quot; Notebook Dell</li>
            <li>27&quot; Dell P2719H</li>
            <li>Mouse Wireless Dell KM5221W</li>
            <li>Teclado Wireless Dell KM5221W</li>
            <li>Suporte Uptable Octoo Black</li>
            <li>Microfone HyperX Quadcast</li>
          </ul>

          <h3 id="coding">Codificação</h3>
          <ul>
            <li>Editor: VSCode</li>
            <li>Tema: Dracula</li>
            <li>Terminal: zsh</li>
          </ul>
        </div>
      </article>
    </Container>
  );
}
