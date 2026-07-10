// GITHUB_PAGES=true (set by the deploy workflow) builds a static export
// served from https://altradits.github.io/YeboBank. Local dev/build is unchanged.
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/YeboBank" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isGitHubPages && { output: "export", images: { unoptimized: true } }),
};

export default nextConfig;
