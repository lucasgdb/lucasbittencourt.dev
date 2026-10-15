import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const logoSize = 500; // logo.png's size: drawn 1:1, no resampling
const logo = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), "public", "logo.png"))
  .toString("base64")}`;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
        }}
      >
        <img src={logo} width={logoSize} height={logoSize} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
