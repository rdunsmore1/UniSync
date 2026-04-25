import type { PropsWithChildren } from "react";
import { Button } from "@unisync/ui";
import { SiteNav } from "./site-nav";
import { SiteShellAuth } from "./site-shell-auth";

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-command-bar">
          <div className="shell-brand-block">
            <p className="shell-wordmark">UniSync</p>
            <h1 className="shell-brand">Campus communities with structure</h1>
          </div>
          <nav className="shell-nav">
            <SiteNav />
            <SiteShellAuth />
            <Button href="/signup" variant="secondary">
              Join your campus
            </Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
