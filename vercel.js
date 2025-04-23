// This is a helper file to configure Vercel deployment
// It provides information to CLI for proper deployment

export default {
  version: 2,
  buildCommand: "vite build",
  outputDirectory: "dist/public",
  installCommand: "npm install",
  framework: "vite",
  routes: [
    {
      src: "/api/(.*)",
      dest: "/api/$1"
    },
    {
      handle: "filesystem"
    },
    {
      src: "/(.*)",
      dest: "/index.html"
    }
  ],
  env: {
    NODE_ENV: "production"
  }
};