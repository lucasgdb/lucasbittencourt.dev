import { ServicesPage, servicesMetadata } from "app/_views/services";

export const metadata = servicesMetadata("pt-br");

export default function Page() {
  return <ServicesPage locale="pt-br" />;
}
