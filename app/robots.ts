import { buildRobots } from "app/lib/seo";

export default function robots() {
  return buildRobots(process.env.VERCEL_ENV);
}
