import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import waitlistHandler from "./api/waitlist.js";

function waitlistApi() {
  const middleware = (request, response, next) => {
    Promise.resolve(waitlistHandler(request, response)).catch(next);
  };

  return {
    name: "fitroom-waitlist-api",
    configureServer(server) {
      server.middlewares.use("/api/waitlist", middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/waitlist", middleware);
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), waitlistApi()],
});
