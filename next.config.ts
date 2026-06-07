import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
<<<<<<< HEAD
  typescript: {
    ignoreBuildErrors: true,
  },
=======
>>>>>>> feat-token
};

export default nextConfig;
