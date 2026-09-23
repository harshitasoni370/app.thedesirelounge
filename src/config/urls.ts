const environment = import.meta.env.VITE_APP_ENV || (import.meta.env.MODE === "production" ? "production" : "uat");
const defaults = {
  uat: {
    apiBaseUrl: "https://fumesandflavoursapi.cylsysuat.com/api",
    imageBaseUrl: "https://fumesandflavoursapi.cylsysuat.com",
  },
  production: {
    apiBaseUrl: "https://restaurents-api.cylsys.com/api",
    imageBaseUrl: "https://restaurents-api.cylsys.com",
  },
}[environment];

// Use Vite's same-origin proxy during local development to avoid browser CORS.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : defaults.apiBaseUrl);

export const URLS = {
  api: {
    base: apiBaseUrl,
    qrContext: import.meta.env.VITE_QR_CONTEXT_API_URL || `${apiBaseUrl}/QR/qrcontext`,
    checkDevice: import.meta.env.VITE_CHECK_DEVICE_API_URL || `${apiBaseUrl}/QR/checkDevice`,
    imageBase: import.meta.env.VITE_IMAGE_BASE_URL || defaults.imageBaseUrl,
  },
  assets: {
    logo: "https://restaurents-api.cylsys.com/Assets/theDesireLounge/Image/Logo/logo.webp",
  },
  contact: {
    whatsapp: "https://wa.me/971509002202",
    whatsappBooking: (message: string) =>
      `https://wa.me/971509002202?text=${encodeURIComponent(message)}`,
  },
  environment,
};

export const QR_CONTEXT_STORAGE_KEY = "desire_qr_context";
export const QR_CONTEXT_PARAMS = ["type", "location", "name", "resturant"] as const;

export const DEFAULT_COUNTRY_CODE = "+91";

export const SHORT_PARAM_ALIASES: Record<string, string> = {
  cid: "companyId",
  bid: "branchId",
  tid: "tableId",
  mid: "moduleId",
  mid_event: "momentId",
  sid: "sessionId",
  tn: "tableName",
  cat: "category",
  rc: "reservationCategory",
  rt: "reservationTitle",
  bt: "bookingType",
  s: "step",
  hs: "hideSteps",
  hc: "hideCardIcon",
  gid: "gameId",
  gn: "gameName",
  cn: "categoryName",
  xd: "extraDetails",
  p: "price",
  en: "eventName",
  did: "deviceId",
  cc: "countryCode",
  dob: "dateOfBirth",
  gc: "guestCount",
  mn: "mobile",
  em: "email",
};
