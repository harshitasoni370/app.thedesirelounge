/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: "uat" | "production";
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WAITER_API_BASE_URL?: string;
  readonly VITE_WAITER_API_PROXY_BASE?: string;
  readonly VITE_QR_CONTEXT_API_URL?: string;
  readonly VITE_IMAGE_BASE_URL?: string;
  readonly VITE_WEBSITE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.lottie" {
  const src: string;
  export default src;
}
