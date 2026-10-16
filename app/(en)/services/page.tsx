import { ServicesPage, servicesMetadata } from "app/_views/services";

export const metadata = servicesMetadata("en");

export default function Page() {
  return <ServicesPage locale="en" />;
}
