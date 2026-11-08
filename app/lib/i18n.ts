// No Next.js imports, so `node --test` can import it.

export const locales = ["en", "pt-br"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeConfig = {
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    intl: "en-US",
    pathPrefix: "",
    label: "EN",
    name: "English",
  },
  "pt-br": {
    htmlLang: "pt-BR",
    ogLocale: "pt_BR",
    intl: "pt-BR",
    pathPrefix: "/pt-br",
    label: "PT",
    name: "Português",
  },
} as const satisfies Record<Locale, unknown>;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function localizePath(path: string, locale: Locale) {
  const prefix = localeConfig[locale].pathPrefix;
  if (!prefix) {
    return path;
  }
  return path === "/" ? prefix : `${prefix}${path}`;
}

export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  for (const locale of locales) {
    const prefix = localeConfig[locale].pathPrefix;
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return { locale, path: pathname.slice(prefix.length) || "/" };
    }
  }
  return { locale: defaultLocale, path: pathname };
}

export function switchLocalePath(pathname: string, target: Locale) {
  return localizePath(splitLocalePath(pathname).path, target);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "pt-br" : "en";
}

const en = {
  jobTitle: "AI Software Engineer",
  siteDescription:
    "AI software engineer building AI and agent systems for production. AI Forward Deployed Engineer services, a technical blog and tools like AI Summarizer.",
  blogDescription:
    "Articles on software engineering and AI: JavaScript, Node.js, React, algorithms and self-hosting, written from building real systems.",
  nav: {
    label: "Main",
    home: "home",
    blog: "blog",
    tools: "tools",
    services: "services",
    mcp: "mcp",
  },
  theme: {
    label: "Theme",
    system: "System",
    light: "Light",
    sepia: "Sepia",
    dark: "Dark",
    black: "Black",
  },
  languageSwitch: "Read in English",
  footer: {
    source: "view source",
    license: "MIT Licensed",
    contact: "Contact",
    terms: "Terms of use",
    privacy: "Privacy policy",
  },
  services: {
    title: "AI Forward Deployed Engineer services",
    description:
      "AI Forward Deployed Engineer services: building, customizing and deploying real-world AI and agentic systems with your team, hourly or per project.",
    contact: "Talk about your project",
    email: "Email me",
    fde: "Software engineer embedded with clients or internal product groups to build, customize, and deploy real-world AI and agentic systems. Hourly (price on request) or per project.",
  },
  legal: {
    updated: "Last updated",
    terms: {
      title: "Terms of use",
      description:
        "Terms of use of lucasbittencourt.dev: content, services, digital products, payments and refunds.",
    },
    privacy: {
      title: "Privacy policy",
      description:
        "How lucasbittencourt.dev collects, uses and protects personal data, under the Brazilian General Data Protection Law (LGPD).",
    },
  },
  home: {
    intro:
      "Software engineer focused on AI. I design, build and ship AI and agent systems to production, integrated with the systems and processes they serve.",
    writing: ["I also write about software engineering and AI on ", "my blog", "."],
    feed: { post: "Post", tool: "Tool" },
    work: "Work with me",
    email: "Email me",
  },
  blog: {
    title: "Software engineering and AI blog",
    heading: "Software engineering and AI blog",
    name: (author: string) => `${author}'s blog`,
  },
  post: {
    by: "By",
    updated: "Updated",
    more: "More posts",
    services: [
      "Need AI or agent systems built and shipped to production? See my ",
      "AI Forward Deployed Engineer services",
      ".",
    ],
    readAloud: {
      listen: "Listen",
      resume: "Resume listening",
      player: "Read aloud",
      play: "Play",
      pause: "Pause",
      previous: "Previous passage",
      next: "Next passage",
      restart: "Start over",
      close: "Stop and close",
      speed: "Speed",
      voice: "Voice",
      follow: "Follow the reading",
      fromHere: "Listen from here",
      nowReading: "Reading",
      codeBlock: "Code block.",
      checking: "Checking whether your browser can read aloud…",
      unsupported: "Your browser can't read aloud (no speech synthesis).",
      noVoices: "Your system has no voice installed for reading aloud.",
    },
    reading: {
      open: "Reading settings",
      description: "How posts look for you. Saved in this browser.",
      medium: "Medium",
      normal: "Normal",
      progressHint: "The line at the top that shows how far you've read.",
      font: "Font",
      fonts: { sans: "Sans", serif: "Serif", legible: "Legible" },
      size: "Font size",
      small: "Small",
      large: "Large",
      width: "Column width",
      narrow: "Narrow",
      wide: "Wide",
      spacing: "Line spacing",
      compact: "Compact",
      relaxed: "Relaxed",
      progress: "Reading progress bar",
      reset: "Reset",
    },
  },
  tools: {
    title: "AI tools, browser extensions and web apps",
    heading: "AI tools, browser extensions and web apps",
    description:
      "AI Summarizer summarizes only the part of a page you pick; Video Downloader saves a page's videos; Deckr builds Clash Royale decks; QR Code Generator creates QR codes; 4People brings together more than 100 tools for developers and students; Cheatsheets puts tmux, kubectl, Docker and Terraform commands on searchable pages. Extensions for Chrome, Edge, Firefox and more, and web apps.",
    links: "Links",
    install: "Install from the Chrome Web Store",
    comingSoon: "Chrome Web Store (coming soon)",
    installNow: "Install now",
    open: (tool: string) => `Open ${tool}`,
    otherBrowsers: "Other browsers",
    tabs: { about: "About", install: "Install" },
    manual: {
      title: "Install before it's in the stores",
      storeTitle: "How to install",
      download: (version: string, size: string) => `Download version ${version} (.zip, ${size})`,
      released: "Released",
      checksum: "SHA-256",
    },
    privacy: "Privacy policy",
    eula: "End user license agreement (EULA)",
    terms: "Terms of use",
    support: "Support",
    all: "All tools",
    packs: { pack: "Pack", price: "Price", bonus: "Bonus", total: "Total", credits: "credits" },
    privacyTitle: (tool: string) => `${tool} privacy policy`,
    privacyDescription: (tool: string) =>
      `How ${tool} collects, uses and protects personal data, under the Brazilian General Data Protection Law (LGPD).`,
    eulaTitle: (tool: string) => `${tool} End user license agreement (EULA)`,
    eulaDescription: (tool: string) =>
      `The license to use the ${tool} extension: what it grants, its restrictions, intellectual property and responsibilities.`,
  },
  breadcrumbs: { home: "Home", blog: "Blog" },
  notFound: {
    title: "Page not found",
    heading: "404 - Page Not Found",
    text: "The page you are looking for does not exist.",
    home: "Go to the home page",
    blog: "Read the blog",
  },
  mcp: {
    title: "MCP server",
    description:
      "Connect your AI assistant to this website with the Model Context Protocol, and learn the AI concepts behind it: LLMs, tool calling, MCP and RAG.",
    toolsTable: { tool: "Tool", returns: "What it returns" },
    tools: {
      get_profile:
        "Who Lucas Bittencourt is: role, areas of expertise, profiles and links.",
      list_posts: "All blog posts, newest first, with summary, dates and URL.",
      get_post: "The full content (Markdown/MDX) of a blog post by its slug.",
      search_blog:
        "Ranked passages (post sections) that best match a question, with links to the exact section.",
    },
    exampleQuery: "How does process.nextTick differ from promises?",
  },
};

export type Dictionary = typeof en;

const ptBr: Dictionary = {
  jobTitle: "Engenheiro de Software de IA",
  siteDescription:
    "Engenheiro de software de IA: sistemas de IA e de agentes em produção, serviços de AI Forward Deployed Engineer, blog técnico e ferramentas como o AI Summarizer.",
  blogDescription:
    "Artigos sobre engenharia de software e IA: JavaScript, Node.js, React, algoritmos e servidor em casa, escritos a partir de sistemas reais.",
  nav: {
    label: "Principal",
    home: "início",
    blog: "blog",
    tools: "ferramentas",
    services: "serviços",
    mcp: "mcp",
  },
  theme: {
    label: "Tema",
    system: "Sistema",
    light: "Claro",
    sepia: "Sépia",
    dark: "Escuro",
    black: "Preto",
  },
  languageSwitch: "Ler em português",
  footer: {
    source: "ver código-fonte",
    license: "Licença MIT",
    contact: "Contato",
    terms: "Termos de uso",
    privacy: "Política de privacidade",
  },
  services: {
    title: "Serviços de AI Forward Deployed Engineer",
    description:
      "Serviços de AI Forward Deployed Engineer: construo, customizo e coloco em produção sistemas de IA e de agentes com o seu time, por hora ou por projeto.",
    contact: "Fale sobre o seu projeto",
    email: "Mandar e-mail",
    fde: "Engenheiro de software que trabalha junto ao cliente ou a times de produto internos para construir, customizar e colocar em produção sistemas reais de IA e de agentes. Por hora (sob consulta) ou por projeto.",
  },
  legal: {
    updated: "Última atualização",
    terms: {
      title: "Termos de uso",
      description:
        "Termos de uso de lucasbittencourt.dev: conteúdo, serviços, produtos digitais, pagamentos e reembolsos.",
    },
    privacy: {
      title: "Política de privacidade",
      description:
        "Como lucasbittencourt.dev coleta, usa e protege dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD).",
    },
  },
  home: {
    intro:
      "Engenheiro de software focado em IA. Projeto, construo e coloco em produção sistemas de IA e de agentes, integrados aos sistemas e processos de cada negócio.",
    writing: ["Também escrevo sobre engenharia de software e IA no ", "meu blog", "."],
    feed: { post: "Post", tool: "Ferramenta" },
    work: "Trabalhe comigo",
    email: "Mandar e-mail",
  },
  blog: {
    title: "Blog de engenharia de software e IA",
    heading: "Blog de engenharia de software e IA",
    name: (author) => `Blog de ${author}`,
  },
  post: {
    by: "Por",
    updated: "Atualizado em",
    more: "Mais posts",
    services: [
      "Precisa construir e colocar em produção sistemas de IA ou de agentes? Veja os meus ",
      "serviços de AI Forward Deployed Engineer",
      ".",
    ],
    readAloud: {
      listen: "Ouvir",
      resume: "Continuar ouvindo",
      player: "Leitura em voz alta",
      play: "Tocar",
      pause: "Pausar",
      previous: "Trecho anterior",
      next: "Próximo trecho",
      restart: "Recomeçar",
      close: "Parar e fechar",
      speed: "Velocidade",
      voice: "Voz",
      follow: "Seguir a leitura",
      fromHere: "Ouvir a partir daqui",
      nowReading: "Lendo",
      codeBlock: "Bloco de código.",
      checking: "Verificando se o seu navegador consegue ler em voz alta…",
      unsupported: "Seu navegador não tem leitura em voz alta (síntese de fala).",
      noVoices: "Seu sistema não tem nenhuma voz instalada para leitura em voz alta.",
    },
    reading: {
      open: "Configurações de leitura",
      description: "Como os posts aparecem para você. Fica salvo neste navegador.",
      medium: "Média",
      normal: "Normal",
      progressHint: "A linha no topo que mostra quanto você já leu.",
      font: "Fonte",
      fonts: { sans: "Sem serifa", serif: "Serifa", legible: "Legível" },
      size: "Tamanho da fonte",
      small: "Pequeno",
      large: "Grande",
      width: "Largura da coluna",
      narrow: "Estreita",
      wide: "Larga",
      spacing: "Espaçamento entre linhas",
      compact: "Compacto",
      relaxed: "Amplo",
      progress: "Barra de progresso de leitura",
      reset: "Restaurar padrão",
    },
  },
  tools: {
    title: "Ferramentas de IA, extensões para navegador e apps web",
    heading: "Ferramentas de IA, extensões para navegador e apps web",
    description:
      "O AI Summarizer resume só o trecho da página que você escolhe; o Video Downloader baixa os vídeos de uma página; o Deckr monta decks de Clash Royale; o Gerador de QR Code cria QR Codes; o 4People reúne mais de 100 ferramentas para quem programa e estuda; o Cheatsheets reúne comandos de tmux, kubectl, Docker e Terraform em páginas pesquisáveis. Extensões para Chrome, Edge, Firefox e outros, e apps web.",
    links: "Links",
    install: "Instalar pela Chrome Web Store",
    comingSoon: "Chrome Web Store (em breve)",
    installNow: "Instalar agora",
    open: (tool) => `Abrir o ${tool}`,
    otherBrowsers: "Outros navegadores",
    tabs: { about: "Sobre", install: "Instalar" },
    manual: {
      title: "Instale antes de chegar às lojas",
      storeTitle: "Como instalar",
      download: (version: string, size: string) => `Baixar a versão ${version} (.zip, ${size})`,
      released: "Lançada em",
      checksum: "SHA-256",
    },
    privacy: "Política de privacidade",
    eula: "Contrato de licença de usuário final (EULA)",
    terms: "Termos de uso",
    support: "Suporte",
    all: "Todas as ferramentas",
    packs: { pack: "Pacote", price: "Preço", bonus: "Bônus", total: "Total", credits: "créditos" },
    privacyTitle: (tool) => `Política de privacidade do ${tool}`,
    privacyDescription: (tool) =>
      `Como o ${tool} coleta, usa e protege dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD).`,
    eulaTitle: (tool) => `Contrato de licença de usuário final (EULA) do ${tool}`,
    eulaDescription: (tool) =>
      `A licença de uso da extensão ${tool}: o que ela concede, as restrições, a propriedade intelectual e as responsabilidades.`,
  },
  breadcrumbs: { home: "Início", blog: "Blog" },
  notFound: {
    title: "Página não encontrada",
    heading: "404 - Página não encontrada",
    text: "A página que você procura não existe.",
    home: "Ir para o início",
    blog: "Ler o blog",
  },
  mcp: {
    title: "Servidor MCP",
    description:
      "Conecte seu assistente de IA a este site com o Model Context Protocol e aprenda os conceitos de IA por trás dele: LLMs, tool calling, MCP e RAG.",
    toolsTable: { tool: "Ferramenta", returns: "O que retorna" },
    tools: {
      get_profile:
        "Quem é Lucas Bittencourt: cargo, áreas de atuação, perfis e links.",
      list_posts:
        "Todos os posts do blog, do mais recente ao mais antigo, com resumo, datas e URL.",
      get_post: "O conteúdo completo (Markdown/MDX) de um post pelo slug.",
      search_blog:
        "Trechos (seções dos posts) que melhor respondem a uma pergunta, ranqueados, com links para a seção exata.",
    },
    exampleQuery: "Qual a diferença entre process.nextTick e promises?",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, "pt-br": ptBr };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
