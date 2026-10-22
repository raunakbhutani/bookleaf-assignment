/** Vite configuration for the React client stored in client/. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ root: "client", plugins: [react()] });
