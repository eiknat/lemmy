// eslint-ignore-next-line
export const isProduction = process.env.NODE_ENV === "production";

export const BASE_PATH = isProduction ? "/static/" : "/";
