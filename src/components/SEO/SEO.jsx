import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component - Comprehensive Meta Tag Management
 * 
 * This component handles all SEO-related meta tags including:
 * - Basic meta tags (title, description, keywords)
 * - Open Graph tags for social media
 * - Twitter Card tags
 * - Canonical URLs
 * - Structured data (JSON-LD)
 * - Custom meta tags
 */
const SEO = ({
  title = "bugSnap - Intelligent Bug Tracking & Team Collaboration Platform",
  description = "Streamline your development workflow with bugSnap - the modern bug tracking platform designed for developers and teams. Track issues, collaborate seamlessly, and ship better software faster.",
  keywords = "bug tracking, issue tracker, team collaboration, software development, project management, bugSnap, developer tools",
  image = "/og-image.png",
  url,
  type = "website",
  author = "bugSnap Team",
  publishedTime,
  modifiedTime,
  schemaData,
  noIndex = false,
  canonical,
  children
}) => {
  const location = useLocation();
  
  // Get current URL
  const currentUrl = url || `${window.location.origin}${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;
  
  // Default structured data for the application
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "bugSnap",
    "description": description,
    "url": window.location.origin,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "bugSnap Team",
      "url": window.location.origin
    },
    "featureList": [
      "Bug Tracking",
      "Team Collaboration",
      "Issue Management",
      "Project Management",
      "Real-time Updates"
    ]
  };

  // Merge custom schema data with default
  const structuredData = schemaData || defaultSchema;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="1 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image.startsWith('http') ? image : `${window.location.origin}${image}`} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="bugSnap" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `${window.location.origin}${image}`} />
      <meta name="twitter:site" content="@bugsnap" />
      <meta name="twitter:creator" content="@bugsnap" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#4f46e5" />
      <meta name="msapplication-TileColor" content="#4f46e5" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="bugSnap" />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Custom children */}
      {children}
    </Helmet>
  );
};

export default SEO;