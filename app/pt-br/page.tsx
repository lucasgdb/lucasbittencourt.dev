import { HomePage, homeMetadata } from "app/_views/home";

export const metadata = homeMetadata("pt-br");

export default function Page() {
  return <HomePage locale="pt-br" />;
}
