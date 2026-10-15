import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { site } from "app/lib/site";

// Fonts and logo are read from disk, so next.config.ts bundles them with this
// function (outputFileTracingIncludes).
const fontsDir = path.join(process.cwd(), "app", "og", "fonts");
const geistBold = fs.readFileSync(path.join(fontsDir, "Geist-Bold.ttf"));
const logo = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), "public", "logo.png"))
  .toString("base64")}`;

// Everything is centered: chat apps (e.g. WhatsApp) crop the center of the
// image for small previews.
export function GET(request: Request) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || site.name).slice(0, 100);
  const fontSize = title.length > 60 ? 72 : title.length > 30 ? 88 : 112;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "48px 80px",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "Geist",
          textAlign: "center",
        }}
      >
        <img src={logo} width={200} height={200} />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Geist", data: geistBold, weight: 700, style: "normal" }],
    }
  );
}
