import { LegalPage, legalMetadata } from "app/_views/legal";

export const metadata = legalMetadata("terms", "en");

export default function Page() {
  return <LegalPage doc="terms" locale="en" />;
}
