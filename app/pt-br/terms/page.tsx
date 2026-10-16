import { LegalPage, legalMetadata } from "app/_views/legal";

export const metadata = legalMetadata("terms", "pt-br");

export default function Page() {
  return <LegalPage doc="terms" locale="pt-br" />;
}
