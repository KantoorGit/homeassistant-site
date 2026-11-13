import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Het kale adres verwijst naar de Nederlandse voorpagina.
  async redirects() {
    return [{ source: "/", destination: "/nl", permanent: false }];
  },
};

export default nextConfig;
