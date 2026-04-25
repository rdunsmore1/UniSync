"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizations", label: "Organizations" },
  { href: "/events", label: "Events" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <a
            className={
              isActive
                ? "shell-nav-link shell-nav-link-active"
                : "shell-nav-link ui-hover-accent"
            }
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        );
      })}
    </>
  );
}
