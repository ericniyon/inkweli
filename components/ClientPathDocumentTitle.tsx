"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const BRAND = "usethinkup";

function looksLikeDynamicId(segment: string): boolean {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true;
  if (/^c[a-z0-9]{20,}$/i.test(segment)) return true;
  if (segment.length >= 20 && /^[a-z0-9]+$/i.test(segment)) return true;
  return false;
}

function humanizeSegment(segment: string): string | null {
  if (looksLikeDynamicId(segment)) return null;
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function titleFromPathname(pathname: string): string {
  if (pathname === "/" || pathname === "") return `Home | ${BRAND}`;
  const parts = pathname
    .split("/")
    .filter(Boolean)
    .map(humanizeSegment)
    .filter((p): p is string => Boolean(p));
  if (parts.length === 0) return `Home | ${BRAND}`;
  return `${parts.join(" · ")} | ${BRAND}`;
}

/** Sets the browser tab title from the pathname. Skips `/detail/*` — article titles come from ArticleDetailClient + generateMetadata. */
export default function ClientPathDocumentTitle() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (pathname.startsWith("/detail")) return;
    document.title = titleFromPathname(pathname);
  }, [pathname]);

  return null;
}
