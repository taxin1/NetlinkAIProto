export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Netlink AI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "Netlink AI is an AI-powered platform for professional networking, business card scanning, and automated outreach.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "120"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Netlink AI",
      "logo": {
        "@type": "ImageObject",
        "url": "https://netlink-ai.vercel.app/Logo1.png"
      }
    },
    "featureList": [
      "AI Business Card Scanner",
      "Automated Email Campaigns",
      "Intelligent Contact Management",
      "Relationship Analytics",
      "AI Assistant for Networking"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
