"use client";

import { DownloadIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "app/components/ui/tabs";

type Tab = "about" | "install";

const installHash = "#install";
const openInstall = "tool-tabs:install";

/**
 * A tool's page while it isn't in a store: what it does ("About") apart
 * from how to install it by hand ("Install"). #install in the URL opens the
 * second tab, so the instructions can be linked to. Both panels are in the
 * HTML (forceMount), for search engines and Ctrl+F.
 */
export function ToolTabs({
  labels,
  about,
  install,
}: {
  labels: Record<Tab, string>;
  about: ReactNode;
  install: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("about");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => location.hash === installHash && setTab("install");
    const onOpen = () => {
      change("install");
      root.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener(openInstall, onOpen);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener(openInstall, onOpen);
    };
  }, []);

  function change(next: Tab) {
    setTab(next);
    history.replaceState(null, "", next === "install" ? installHash : location.pathname + location.search);
  }

  return (
    <Tabs ref={root} value={tab} onValueChange={(value) => change(value as Tab)} className="mt-10 scroll-mt-20">
      <TabsList>
        <TabsTrigger value="about">{labels.about}</TabsTrigger>
        <TabsTrigger value="install">{labels.install}</TabsTrigger>
      </TabsList>
      <TabsContent value="about" forceMount className="text-[length:inherit] data-[state=inactive]:hidden">
        {about}
      </TabsContent>
      <TabsContent value="install" forceMount className="text-[length:inherit] data-[state=inactive]:hidden">
        {install}
      </TabsContent>
    </Tabs>
  );
}

/** The page's main action while there's no store: opens the "Install" tab */
export function InstallNowButton({ children }: { children: ReactNode }) {
  return (
    <Button size="lg" onClick={() => window.dispatchEvent(new Event(openInstall))}>
      <DownloadIcon />
      {children}
    </Button>
  );
}
