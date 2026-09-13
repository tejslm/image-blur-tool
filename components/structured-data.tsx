import { SITE } from "@/lib/site";

interface StructuredDataProps {
  pageUrl: string;
}

function jsonLd(data: Record<string, unknown>) {
  return { __html: JSON.stringify(data) };
}

export function SoftwareAppSchema({ pageUrl }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        description: SITE.description,
        url: pageUrl,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      })}
    />
  );
}

export function WebSiteSchema({ pageUrl }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE.name,
        url: pageUrl,
        description: SITE.description,
      })}
    />
  );
}

interface FAQ {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQ[] }) {
  if (items.length === 0) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      })}
    />
  );
}