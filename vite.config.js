import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    watch: {
      // Polling avoids Windows EBUSY/file-lock crashes on public/ assets.
      usePolling: true,
      interval: 300,
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
});
