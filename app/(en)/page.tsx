import { HomePage, homeMetadata } from "app/_views/home";

export const metadata = homeMetadata("en");

export default function Page() {
  return <HomePage locale="en" />;
}
