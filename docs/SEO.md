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

## AI agent compatibility

Assessed and intentionally **not implemented**: this is a static portfolio with no actions to perform.

- **Public API / OpenAPI**: no data or operations that justify an API. The RSS feed, sitemap and llms.txt already expose the content in machine-readable form.
- **MCP server**: no tool or private resource an agent needs. Agents can read the public HTML.
- **Forms**: the site has none. If a contact form is added, use semantic `<form>`, `<label>` and native validation.

## Missing content (not invented)

AI assistants can only describe what the site states. These facts are not on the site and would improve "who is Lucas / what has Lucas built" answers if added by the owner:

- Projects (problem, approach, stack, links, verified results)
- Professional experience (roles, dates, companies), or at least a link to the LinkedIn profile summary
- A photo for `Person.image` (the current `logo.png` is a monogram, so it isn't used as a photo)
- Location / languages, if the owner wants them public
