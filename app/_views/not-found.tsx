import Link from "next/link";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";

export function NotFoundPage({ locale }: { locale: Locale }) {
  const { heading, text, home, blog } = getDictionary(locale).notFound;
  const link = "underline underline-offset-2 decoration-neutral-500";

  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">{heading}</h1>
      <p className="mb-4">{text}</p>
      <ul className="mb-4 flex flex-col gap-2">
        <li>
          <Link href={localizePath("/", locale)} className={link}>
            {home}
          </Link>
        </li>
        <li>
          <Link href={localizePath("/blog", locale)} className={link}>
            {blog}
          </Link>
        </li>
      </ul>
    </section>
  );
}
