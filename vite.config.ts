import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Strict Content-Security-Policy, injected ONLY into the production build.
// (A static CSP meta would block Vite's dev react-refresh inline script,
//  so we skip it during `npm run dev`.)
const CSP = [
  "default-src 'none'",
  // 'wasm-unsafe-eval' is required to instantiate the Argon2 WASM (hash-wasm).
  "script-src 'self' https://accounts.google.com 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // Drive REST + GIS token endpoint. No other network egress allowed.
  "connect-src 'self' https://www.googleapis.com https://accounts.google.com",
  "frame-src https://accounts.google.com https://content.googleapis.com",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function cspPlugin(): Plugin {
  return {
    name: "keyva-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "</title>",
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/keyva/" : "/",
  plugins: [react(), tailwindcss(), cspPlugin()],
});
