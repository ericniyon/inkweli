import { redirect } from "next/navigation";

/**
 * Convenience path from subscription flow; forwards to `/login` with query string preserved.
 */
export default async function AuthPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val == null) continue;
    if (Array.isArray(val)) val.forEach((v) => qs.append(key, String(v)));
    else qs.set(key, String(val));
  }
  const q = qs.toString();
  redirect(q ? `/login?${q}` : "/login");
}
