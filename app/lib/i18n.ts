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

function listFormat(locale: Locale, items: readonly string[]) {
  return new Intl.ListFormat(localeConfig[locale].intl, {
    type: "conjunction",
  }).format(items);
}

const en = {
  jobTitle: "Full-stack Software Engineer",
  siteDescription:
    "Portfolio and blog of Lucas Bittencourt, a full-stack software engineer working with React.js, Node.js, PostgreSQL, Docker and TypeScript.",
  blogDescription:
    "Articles by Lucas Bittencourt about JavaScript, TypeScript, React, Node.js and software engineering fundamentals.",
  nav: {
    label: "Main",
    home: "home",
    blog: "blog",
    tools: "tools",
    services: "services",
    mcp: "mcp",
  },
  themeToggle: "Toggle dark mode",
  languageSwitch: "Read in English",
  footer: {
    source: "view source",
    license: "MIT Licensed",
    contact: "Contact",
    terms: "Terms of use",
    privacy: "Privacy policy",
  },
  services: {
    title: "Services and products",
    description:
      "AI Forward Deployed Engineer services and AI Summarizer, a Chrome extension that summarizes only the part of the page you choose.",
    fde: "Software engineer embedded with clients or internal product groups to build, customize, and deploy real-world AI and agentic systems. Hourly (price on request) or per project.",
    summarizer:
      "Chrome extension that uses AI to summarize only the part of the page the user selects, in Portuguese or English. Prepaid credits via Pix, no subscription.",
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
    bio: (jobTitle: string, technologies: readonly string[]) =>
      `${jobTitle} currently working with ${listFormat("en", technologies)}. Developing scalable and robust solutions.`,
    writing: [
      "I write about JavaScript, React, Node.js and software engineering fundamentals on ",
      "my blog",
      ".",
    ],
  },
  blog: {
    title: "Blog",
    heading: "My Blog",
    name: (author: string) => `${author}'s blog`,
  },
  post: { by: "By", updated: "Updated" },
  tools: {
    title: "Tools",
    heading: "Tools",
    description:
      "Tools and digital products by Lucas Bittencourt, such as AI Summarizer, a Chrome extension that summarizes only the part of a page you pick.",
    links: "Links",
    install: "Install from the Chrome Web Store",
    comingSoon: "Chrome Web Store (coming soon)",
    privacy: "Privacy policy",
    terms: "Terms of use",
    support: "Support",
    all: "All tools",
    privacyTitle: (tool: string) => `${tool} privacy policy`,
    privacyDescription: (tool: string) =>
      `How the ${tool} extension collects, uses and protects personal data, under the Brazilian General Data Protection Law (LGPD).`,
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
        "Who Lucas Bittencourt is: role, technologies, profiles and links.",
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
  jobTitle: "Engenheiro de Software Full-stack",
  siteDescription:
    "Portfólio e blog de Lucas Bittencourt, engenheiro de software full-stack que trabalha com React.js, Node.js, PostgreSQL, Docker e TypeScript.",
  blogDescription:
    "Artigos de Lucas Bittencourt sobre JavaScript, TypeScript, React, Node.js e fundamentos de engenharia de software.",
  nav: {
    label: "Principal",
    home: "início",
    blog: "blog",
    tools: "ferramentas",
    services: "serviços",
    mcp: "mcp",
  },
  themeToggle: "Alternar modo escuro",
  languageSwitch: "Ler em português",
  footer: {
    source: "ver código-fonte",
    license: "Licença MIT",
    contact: "Contato",
    terms: "Termos de uso",
    privacy: "Política de privacidade",
  },
  services: {
    title: "Serviços e produtos",
    description:
      "Serviços de AI Forward Deployed Engineer e o AI Summarizer, extensão para Chrome que resume com IA só o trecho da página que você escolhe.",
    fde: "Engenheiro de software que trabalha junto ao cliente ou a times de produto internos para construir, customizar e colocar em produção sistemas reais de IA e de agentes. Por hora (sob consulta) ou por projeto.",
    summarizer:
      "Extensão para Chrome que resume com IA só o trecho da página escolhido pelo usuário, em português ou inglês. Créditos pré-pagos via Pix, sem assinatura.",
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
    bio: (jobTitle, technologies) =>
      `${jobTitle}, atualmente trabalhando com ${listFormat("pt-br", technologies)}. Desenvolvendo soluções escaláveis e robustas.`,
    writing: [
      "Escrevo sobre JavaScript, React, Node.js e fundamentos de engenharia de software no ",
      "meu blog",
      ".",
    ],
  },
  blog: {
    title: "Blog",
    heading: "Meu blog",
    name: (author) => `Blog de ${author}`,
  },
  post: { by: "Por", updated: "Atualizado em" },
  tools: {
    title: "Ferramentas",
    heading: "Ferramentas",
    description:
      "Ferramentas e produtos digitais de Lucas Bittencourt, como o AI Summarizer, uma extensão para o Chrome que resume só o trecho da página que você escolhe.",
    links: "Links",
    install: "Instalar pela Chrome Web Store",
    comingSoon: "Chrome Web Store (em breve)",
    privacy: "Política de privacidade",
    terms: "Termos de uso",
    support: "Suporte",
    all: "Todas as ferramentas",
    privacyTitle: (tool) => `Política de privacidade do ${tool}`,
    privacyDescription: (tool) =>
      `Como a extensão ${tool} coleta, usa e protege dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD).`,
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
        "Quem é Lucas Bittencourt: cargo, tecnologias, perfis e links.",
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
