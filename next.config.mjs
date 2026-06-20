/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/cron/briefing": ["./skills.md"],
    },
  },
};

export default nextConfig;
