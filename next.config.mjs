/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ["en", "fr"], // Ajoutez toutes les langues que vous souhaitez prendre en charge
    defaultLocale: "fr",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.HOST_IMAGES,
      },
    ],
  },
};

export default nextConfig;
