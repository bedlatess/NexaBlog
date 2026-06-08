import { site } from "@/data/site";

export function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap.xml", site.url)}
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    }
  );
}
