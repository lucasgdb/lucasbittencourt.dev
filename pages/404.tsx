import Link from 'next/link';

import Container from 'components/Container';

export default function NotFound() {
  return (
    <Container title="404 | Lucas Bittencourt">
      <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          451 – Indisponível por motivos legais
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Por que mostrar um 404 genérico quando posso fazê-lo parecer
          misterioso? Parece que você encontrou algo que existia ou escreveu
          algo errado. Imagino que você tenha escrito algo errado. Você pode
          verificar esse URL?
        </p>

        <Link
          href="/"
          className="p-1 sm:p-4 w-64 font-bold mx-auto bg-gray-200 dark:bg-gray-800 text-center rounded-md text-black dark:text-white"
        >
          Página Inicial
        </Link>
      </div>
    </Container>
  );
}
