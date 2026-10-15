import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { site } from "app/lib/site";

// Fonts and logo are read from disk, so next.config.ts bundles them with this
// function (outputFileTracingIncludes).
const fontsDir = path.join(process.cwd(), "app", "og", "fonts");
const geistRegular = fs.readFileSync(path.join(fontsDir, "Geist-Regular.ttf"));
const geistBold = fs.readFileSync(path.join(fontsDir, "Geist-Bold.ttf"));
const logo = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), "public", "logo.png"))
  .toString("base64")}`;

// Everything is centered: chat apps (e.g. WhatsApp) crop the center of the
// image for small previews.
export function GET(request: Request) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || site.name).slice(0, 100);
  const subtitle = url.searchParams.get("subtitle")?.slice(0, 120);

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
          padding: "64px 96px",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "Geist",
          textAlign: "center",
        }}
      >
        <img src={logo} width={112} height={112} style={{ borderRadius: 16 }} />
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: title.length > 40 ? 56 : 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 32,
              color: "#a3a3a3",
            }}
          >
            {subtitle}
          </div>
        )}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 48,
            fontSize: 26,
            color: "#737373",
          }}
        >
          {site.name}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistBold, weight: 700, style: "normal" },
      ],
    }
  );
}
