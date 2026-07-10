import { Helmet } from "react-helmet-async";

const SITE_URL = "https://sportlabai.com";
const SITE_NAME = "SportLab AI";
const DEFAULT_IMAGE = `${SITE_URL}/sportslab_logo.png`;
const DEFAULT_DESCRIPTION =
  "SportLab AI is your all-in-one sports science platform. Track athlete readiness, recovery, and training load. Get AI-powered coaching, mental health support, and sport matching.";

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export default function Seo({ title, description = DEFAULT_DESCRIPTION, path = "", noIndex = false }: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
    </Helmet>
  );
}
