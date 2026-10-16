import { LegalPage, legalMetadata } from "app/_views/legal";

export const metadata = legalMetadata("privacy", "pt-br");

export default function Page() {
  return <LegalPage doc="privacy" locale="pt-br" />;
}
