/** @type {import('next').NextConfig} */
const imageHostname = process.env.HOST_IMAGES;

const nextConfig = {
  images: {
    ...(imageHostname
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: imageHostname,
            },
          ],
        }
      : {}),
  },
};

export default nextConfig;
