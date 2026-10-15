# SEO and AI discoverability

How the site exposes itself to search engines and AI assistants, what must be configured outside the repository, and how to measure results.

None of this guarantees rankings, rich results or AI citations. It removes technical obstacles and makes the content unambiguous.

## Where things live

| What | File |
| --- | --- |
| Domain, identity, technologies, profiles, AI training policy | `app/lib/site.ts` (single source of truth) |
| JSON-LD, sitemap, robots, RSS and llms.txt builders | `app/lib/seo.ts` |
| Default metadata, theme color, verification tags | `app/layout.tsx` |
| Per-page canonical and Open Graph | `app/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx` |
| Tests | `tests/seo.test.ts` (`pnpm test`) |

Post frontmatter accepts an optional `updatedAt: "YYYY-MM-DD"`. Set it only when a post changes meaningfully. It feeds the visible "Updated" date, `dateModified` in JSON-LD, `article:modified_time` and the sitemap `lastmod`.

## Languages (English and Brazilian Portuguese)

- **URLs**: English keeps the original URLs (`/`, `/blog/<slug>`, `/mcp`); Portuguese is under `/pt-br` with the same slugs (`/pt-br/blog/<slug>`). Existing links and rankings are untouched.
- **Routing**: one root layout per language (`app/(en)/layout.tsx`, `app/pt-br/layout.tsx`) for the right `<html lang>`, with every page statically rendered (no proxy). Pages are thin wrappers around `app/_views/*`. URLs that match nothing use `app/global-not-found.tsx` (bilingual; requires `experimental.globalNotFound`).
- **No automatic redirect** by browser language: Google crawls without `Accept-Language` and could miss a version. The PT/EN switch in the header is a real, crawlable link to the same page in the other language.
- **hreflang**: every page and every sitemap entry lists `en`, `pt-BR` and `x-default` (English). Each version has its own canonical URL.
- **Metadata**: `og:locale` (+ `og:locale:alternate`), translated titles and descriptions, JSON-LD `inLanguage`, and posts linked to their translation (`workTranslation` / `translationOfWork`).
- **Feeds**: `/rss` (English) and `/pt-br/rss`. `llms.txt` lists both languages. MCP tools accept `language: "pt-BR"`.
- **Content**: UI texts in `app/lib/i18n.ts`; translated posts in `app/blog/posts/pt-br/<same slug>.mdx`; MCP page in `app/mcp/content.pt-br.mdx`. Tests fail if a post has no translation, if code blocks or dates differ from the original, or if a table of contents link points to a missing heading.

## Crawler policy (`/robots.txt`)

robots.txt is a crawling policy, not access control. Well-behaved crawlers follow it, others don't.

| Crawler | Purpose | Policy |
| --- | --- | --- |
| Googlebot, Bingbot | Search indexing (Google also uses it for AI Overviews / AI Mode) | Allowed (`*`) |
| OAI-SearchBot | ChatGPT Search results | Allowed (`*`) |
| ChatGPT-User, Claude-User, Perplexity-User | Fetches triggered by a user's question | Allowed (`*`) |
| PerplexityBot, Claude-SearchBot | AI search indexing | Allowed (`*`) |
| GPTBot, ClaudeBot, CCBot | Collecting data for model training | Allowed (explicit group) |
| Google-Extended, Applebot-Extended | Use of content for Gemini / Apple AI training (not a separate crawler) | Allowed (explicit group) |

To block training without affecting search, set `allowAiTraining = false` in `app/lib/site.ts`.

Preview and development deployments (`VERCEL_ENV !== "production"`) serve `Disallow: /` and `noindex`.

## llms.txt (`/llms.txt`)

Generated at build time from the posts, following the [llms.txt proposal](https://llmstxt.org). It is **experimental**: it's not a Google, Bing or ChatGPT ranking requirement, and most crawlers ignore it. It's kept because it costs nothing to maintain (generated from the same data as the site).

## Manual actions (outside the repository)

1. **Canonical domain (Vercel → Project → Settings → Domains)**: today `lucasbittencourt.dev` redirects to `www.lucasbittencourt.dev`, but the canonical URLs, sitemap and RSS use `https://lucasbittencourt.dev`. Make the apex the primary domain and redirect `www` → apex (308). Until then, search engines receive conflicting signals.
2. **Vercel Firewall**: check that no bot protection or "AI bots" managed rule blocks the crawlers allowed above. A robots.txt `Allow` is useless if the firewall returns 403. (This can't be verified from outside: spoofed user agents are not the real crawlers' IPs.)
3. **Google Search Console**: add a *Domain property* for `lucasbittencourt.dev` (DNS TXT verification, no code needed), then submit `https://lucasbittencourt.dev/sitemap.xml`. If you prefer the HTML tag method, set `GOOGLE_SITE_VERIFICATION` in Vercel.
4. **Bing Webmaster Tools**: import the site from Search Console (or set `BING_SITE_VERIFICATION`) and submit the sitemap. Bing's index also powers other AI search products.
5. **After each deploy with metadata changes**: test a post with [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org), and share a URL in [opengraph.xyz](https://www.opengraph.xyz) to check the preview image.

## Monitoring

### AI referral traffic (Vercel Web Analytics, already installed)

In Vercel → Analytics → Referrers, watch for: `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`. ChatGPT also appends `utm_source=chatgpt.com` to links. No extra analytics provider is needed.

### Monthly checklist

- [ ] Search Console: indexed pages, "Duplicate, Google chose different canonical", Core Web Vitals, crawl errors
- [ ] Bing Webmaster Tools: indexed pages and crawl errors
- [ ] Vercel Analytics: sessions from AI referrers (compare with the previous month)
- [ ] Vercel Speed Insights: LCP, INP and CLS of real users
- [ ] Run the question set below and record the results

### Recurring question set

Ask in ChatGPT (with search), Perplexity, Gemini and Google (AI Mode), then record the date, whether the site/blog was cited, and which URL:

1. Who is Lucas Bittencourt, the software engineer?
2. What technologies does Lucas Bittencourt work with?
3. Lucas Bittencourt blog about the Node.js event loop
4. How does the Node.js event loop handle microtasks and process.nextTick? (topic query)
5. React performance: when to use useMemo, useCallback and the React Compiler? (topic query)
6. Big-O notation explained with JavaScript examples (topic query)

Results vary by user, location and time. Look for trends, not single answers.

## AI agent compatibility (MCP server)

The site is also an MCP server, documented at `/mcp`:

- **Endpoint**: `https://lucasbittencourt.dev/api/mcp` (Streamable HTTP, stateless, read-only, no authentication, CORS open).
- **Code**: `app/lib/mcp.ts` (tools, search, HTTP handler) and `app/api/mcp/route.ts`. Tests in `tests/mcp.test.ts` use the official MCP client against the real handler.
- **Tools**: `get_profile`, `list_posts`, `get_post`, `search_blog` (BM25 over post sections, results link to the section anchor).
- **Same source of truth** as the pages, JSON-LD and llms.txt, so answers stay consistent with the site and cite canonical URLs.
- **Not a discovery channel**: search engines don't crawl MCP servers. `/api/` is disallowed in robots.txt and the endpoint sends `X-Robots-Tag: noindex`. The `/mcp` page is in the sitemap and listed in llms.txt.
- **Deploy**: the route reads the `.mdx` posts at request time; `outputFileTracingIncludes` in `next.config.ts` bundles them with the function. If the endpoint is abused, add a rate limit rule for `/api/mcp` in the Vercel Firewall.
- **Monitoring**: Vercel → Logs/Observability, filter by `/api/mcp`.

There is no public API/OpenAPI: the MCP tools, the RSS feed, the sitemap and llms.txt already expose the content in machine-readable form.

## Missing content (not invented)

AI assistants can only describe what the site states. These facts are not on the site and would improve "who is Lucas / what has Lucas built" answers if added by the owner:

- Projects (problem, approach, stack, links, verified results)
- Professional experience (roles, dates, companies), or at least a link to the LinkedIn profile summary
- A photo for `Person.image` (the current `logo.png` is a monogram, so it isn't used as a photo)
- Location / languages, if the owner wants them public
