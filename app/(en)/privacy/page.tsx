import { LegalPage, legalMetadata } from "app/_views/legal";

export const metadata = legalMetadata("privacy", "en");

export default function Page() {
  return <LegalPage doc="privacy" locale="en" />;
}
