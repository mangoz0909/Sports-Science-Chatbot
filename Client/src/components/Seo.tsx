import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://sportslabai.onrender.com";
const SITE_NAME = "SportLab AI";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_IMAGE_ALT =
  "SportLab AI — sports science platform for readiness, recovery, and AI coaching.";
const DEFAULT_DESCRIPTION =
  "SportLab AI is your all-in-one sports science platform. Track athlete readiness, recovery, and training load. Get AI-powered coaching, mental health support, and sport matching.";

/**
 * Indexable pages get the expanded directive so Google may show a full-size
 * image and an untruncated snippet. Everything behind auth gets `noindex`.
 */
const INDEX_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex, nofollow";

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  /** Absolute or root-relative URL of a page-specific social image. */
  image?: string;
  imageAlt?: string;
  /** Extra JSON-LD for this route (breadcrumbs, FAQ, ItemList, …). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  noIndex = false,
  image,
  imageAlt = DEFAULT_IMAGE_ALT,
  jsonLd,
}: SeoProps) {
  // Prerendered pages (scripts/prerender.js) ship these tags baked into the
  // HTML so scrapers that never run JavaScript can read them. Helmet does not
  // know it owns those, so once it has injected its own the baked copies are
  // redundant — and two canonicals is worse than none, since Google may
  // discard both. Drop them on mount, leaving exactly one set either way.
  useEffect(() => {
    document.head.querySelectorAll("[data-prerendered]").forEach((el) => el.remove());
  }, []);

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? NOINDEX_ROBOTS : INDEX_ROBOTS} />
      {/*
        Auth-only routes are one SPA shell with many URLs; a canonical pointing
        at a noindex page would just leak signal, so only emit it when indexable.
      */}
      {!noIndex && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(jsonLd)
              ? { "@context": "https://schema.org", "@graph": jsonLd }
              : { "@context": "https://schema.org", ...jsonLd },
          )}
        </script>
      )}
    </Helmet>
  );
}

/** Builds a schema.org BreadcrumbList for a route's ancestor trail. */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
