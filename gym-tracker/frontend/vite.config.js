
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),

        VitePWA({
            registerType: "autoUpdate",

            devOptions: {
                enabled: true,
                type: "module",
            },

            manifest: {
                name: "Momentum Gym Membership System",
                short_name: "Momentum Gym",
                description:
                    "Gym Membership and Payment Management System",

                theme_color: "#111827",
                background_color: "#ffffff",

                display: "standalone",
                orientation: "portrait",

                start_url: "/",
                scope: "/",

                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                ],
            },
        }),
    ],
});
