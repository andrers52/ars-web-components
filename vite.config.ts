import { defineConfig } from "vite";

// Dev-only rewrite: existing demo pages import /dist/... for release verification.
// In Vite dev mode, map those requests to source files so edits reload without rebuilding.
function distToSrcRewritePlugin() {
  return {
    name: "ars-web-components-dist-to-src-rewrite",
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        const url = req.url as string | undefined;
        if (!url) {
          next();
          return;
        }

        // Keep root package stylesheet/assets served from package root.
        if (url === "/dist/index.js") {
          req.url = "/src/index.ts";
        } else if (url === "/dist/design-system.js") {
          req.url = "/src/design-system.ts";
        } else if (url.startsWith("/dist/components/") && url.endsWith(".js")) {
          req.url = url.replace(/^\/dist\//, "/src/").replace(/\.js$/, ".ts");
        } else if (url.startsWith("/dist/mixins/") && url.endsWith(".js")) {
          req.url = url.replace(/^\/dist\//, "/src/").replace(/\.js$/, ".ts");
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [distToSrcRewritePlugin()],
  server: {
    port: 8080,
    open: "/",
  },
});
