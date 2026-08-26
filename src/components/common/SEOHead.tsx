import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = "GizmoTek.lk | Buy Electronics, Smartwatches & Tech Gadgets Sri Lanka";
const DEFAULT_DESC =
  "Shop trending wireless earbuds, smartwatches, fast chargers, power banks & PC gear in Sri Lanka. Islandwide Cash on Delivery (COD) with 2-4 day dispatch.";
const DEFAULT_IMAGE = "https://gizmotek.lk/images/og-banner.jpg";
const BASE_URL = "https://gizmotek.lk";

export function SEOHead({
  title,
  description = DEFAULT_DESC,
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();

  const formattedTitle = title
    ? title.includes("GizmoTek")
      ? title
      : `${title} | GizmoTek.lk`
    : DEFAULT_TITLE;

  const currentCanonical = canonical || `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = formattedTitle;

    // Helper to safely set or create a meta tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper to safely set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", description);
    if (keywords) {
      setMetaTag('meta[name="keywords"]', "name", "keywords", keywords);
    }
    setMetaTag(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    // 3. Canonical Link
    setLinkTag("canonical", currentCanonical);

    // 4. Open Graph Tags
    setMetaTag('meta[property="og:title"]', "property", "og:title", formattedTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:image"]', "property", "og:image", ogImage);
    setMetaTag('meta[property="og:url"]', "property", "og:url", currentCanonical);
    setMetaTag('meta[property="og:type"]', "property", "og:type", ogType);
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", "GizmoTek.lk");

    // 5. Twitter Tags
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", formattedTitle);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    setMetaTag('meta[name="twitter:url"]', "name", "twitter:url", currentCanonical);
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    // 6. Dynamic JSON-LD Structured Data
    const scriptId = "page-specific-jsonld";
    let jsonLdScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = scriptId;
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(
        Array.isArray(jsonLd)
          ? {
              "@context": "https://schema.org",
              "@graph": jsonLd,
            }
          : {
              "@context": "https://schema.org",
              ...jsonLd,
            }
      );
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      // Cleanup custom JSON-LD on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, [formattedTitle, description, keywords, currentCanonical, ogImage, ogType, noIndex, jsonLd]);

  return null;
}
