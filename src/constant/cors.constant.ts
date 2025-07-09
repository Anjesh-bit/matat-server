export const whiteListUrlsDev = ['http://localhost:3000', 'http://localhost:3001'];
export const whiteListUrlsProd = ['https://woocommerce-sync-frontend.vercel.app'];
export const whiteListUrls =
  process.env.NODE_ENV === 'production' ? whiteListUrlsProd : whiteListUrlsDev;
