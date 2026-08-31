const environment = import.meta.env.VITE_APP_ENV || (import.meta.env.MODE === "production" ? "production" : "uat");
const defaults = {
  uat: {
    apiBaseUrl: "https://fumesandflavoursapi.cylsysuat.com/api",
    imageBaseUrl: "https://fumesandflavoursapi.cylsysuat.com",
  },
  production: {
    apiBaseUrl: "https://api.thedesirelounge.com/api",
    imageBaseUrl: "https://api.thedesirelounge.com",
  },
}[environment];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaults.apiBaseUrl;

export const URLS = {
  api: {
    base: apiBaseUrl,
    qrContext: import.meta.env.VITE_QR_CONTEXT_API_URL || `${apiBaseUrl}/QR/qrcontext`,
    imageBase: import.meta.env.VITE_IMAGE_BASE_URL || defaults.imageBaseUrl,
  },
  assets: {
    logo: "/logo.svg",
  },
  environment,
};

export const QR_CONTEXT_STORAGE_KEY = "desire_qr_context";
export const QR_CONTEXT_PARAMS = ["type", "location", "name", "resturant"] as const;
