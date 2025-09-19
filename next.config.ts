import type { NextConfig } from "next";

const normalizeBasePath = (value: string | undefined | null): string => {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const inferGithubPagesBasePath = (): string => {
  if (process.env.GITHUB_ACTIONS !== "true") {
    return "";
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return "";
  }

  const [owner, repo] = repository.split("/");
  if (!repo) {
    return "";
  }

  const isUserSite = repo.toLowerCase() === `${owner?.toLowerCase()}.github.io`;
  return isUserSite ? "" : `/${repo}`;
};

const resolvedBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH) || inferGithubPagesBasePath();

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  ...(resolvedBasePath
    ? {
        basePath: resolvedBasePath,
        assetPrefix: resolvedBasePath,
      }
    : {}),
};

export default nextConfig;
