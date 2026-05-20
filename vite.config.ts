import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["TENCENT_MAP_KEY"])

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_TENCENT_MAP_KEY": JSON.stringify(
        env.VITE_TENCENT_MAP_KEY || env.TENCENT_MAP_KEY || "",
      ),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
