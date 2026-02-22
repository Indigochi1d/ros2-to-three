import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
  },
  assetsInclude: ["**/*.urdf", "**/*.stl", "**/*.dae"],
});
