import Link from "next/link";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";
import { rssUrl } from "app/lib/seo";
import { business, person } from "app/lib/site";

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  );
}

const link =
  "underline underline-offset-2 decoration-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-100";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <footer className="mb-16">
      <ul className="font-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-600 md:flex-row md:space-x-4 md:space-y-0 dark:text-neutral-300">
        <li>
          <a
            className="flex items-center transition-colors hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href={rssUrl(locale)}
          >
            <ArrowIcon />
            <p className="ml-2 h-7">rss</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-colors hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="me noopener noreferrer"
            target="_blank"
            href={person.profiles.github}
          >
            <ArrowIcon />
            <p className="ml-2 h-7">github</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-colors hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="me noopener noreferrer"
            target="_blank"
            href={person.profiles.linkedin}
          >
            <ArrowIcon />
            <p className="ml-2 h-7">linkedin</p>
          </a>
        </li>
        <li>
          <a
            className="flex items-center transition-colors hover:text-neutral-800 dark:hover:text-neutral-100"
            rel="noopener noreferrer"
            target="_blank"
            href={person.sourceCode}
          >
            <ArrowIcon />
            <p className="ml-2 h-7">{dict.footer.source}</p>
          </a>
        </li>
      </ul>
      <div className="mt-8 flex flex-col gap-2 text-neutral-600 dark:text-neutral-300">
        <p>
          {dict.footer.contact}:{" "}
          <a className={link} href={`mailto:${business.email}`}>
            {business.email}
          </a>{" "}
          ·{" "}
          <a
            className={link}
            href={business.whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            WhatsApp {business.whatsapp}
          </a>
        </p>
        <p>
          <Link className={link} href={localizePath("/terms", locale)}>
            {dict.footer.terms}
          </Link>{" "}
          ·{" "}
          <Link className={link} href={localizePath("/privacy", locale)}>
            {dict.footer.privacy}
          </Link>
        </p>
        <p>
          © {new Date().getFullYear()} {business.legalName} · CNPJ {business.cnpj}.{" "}
          {dict.footer.license}
        </p>
      </div>
    </footer>
  );
}
