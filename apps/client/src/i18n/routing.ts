import { defineRouting } from "next-intl/routing";

const locales = process.env.NEXT_PUBLIC_ALLOWED_LOCALE || "en";

function resolveLocalePrefix(
  useCase: string | undefined
):
  "never" | "always" | { mode: "as-needed"; prefixes: Record<string, string> } {
  if (useCase === "never") return "never";
  if (useCase === "always") return "always";
  return {
    mode: "as-needed",
    prefixes: {},
  };
}

export const routing = defineRouting({
  locales: locales.split(","),
  defaultLocale: process.env.NEXT_PUBLIC_APP_LOCALE || "en",
  localePrefix: resolveLocalePrefix(process.env.NEXT_PUBLIC_USE_CASE),
  localeDetection: false,
  domains:
    process.env.NEXT_PUBLIC_USE_CASE === "domains"
      ? [
          {
            domain: "example.com",
            defaultLocale: "en",
            locales: ["en", "vi"],
          },
          {
            domain: "example.vi",
            defaultLocale: "vi",
            locales: ["vi"],
          },
        ]
      : undefined,
  localeCookie:
    process.env.NEXT_PUBLIC_USE_CASE === "cookies"
      ? false
      : {
          // 200 days
          maxAge: 200 * 24 * 60 * 60,
        },
  // pathnames: {
  //   "/": "/",
  //   "/search": "/search",
  //   "/artworks": "/artworks",
  //   "/artworks/[id]": "/artworks/[id]",
  // },
});
