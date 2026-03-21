import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // Don't expose Next.js version
  
  // CORS configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevent MIME type sniffing
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevent clickjacking attacks
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Enable browser XSS filters
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Control referrer information
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()", // Disable unused APIs
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload", // Force HTTPS for 1 year
          },
          // CORS headers - restrict to same origin by default
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGIN || "null", // Same-origin only by default
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400", // 24 hours
          },
        ],
      },
      {
        // API routes get stricter CSP
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; script-src 'self'; style-src 'self'", // No inline scripts
          },
        ],
      },
      {
        // Cache busting for static assets
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1 year for immutable assets
          },
        ],
      },
    ];
  },

  async redirects() {
    // In production, force HTTPS (requires proper reverse proxy setup)
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_HTTP) {
      return [
        {
          source: "/",
          destination: "https://:host",
          permanent: true,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
