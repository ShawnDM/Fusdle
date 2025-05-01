// Configuration file for direct Vercel deployments
// Allows manual deployment instead of relying on GitHub integration

module.exports = {
  name: 'fusdle',
  version: 2,
  public: true,
  // Build configuration
  build: {
    env: {
      // Ensure Firebase environment variables are passed to the build
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID
    }
  },
  // Routes configuration similar to vercel.json
  routes: [
    // Static file routes
    { src: '^/favicon.ico$', dest: '/public/favicon.ico' },
    { src: '^/preview.png$', dest: '/public/preview.png' },
    { src: '^/sitemap.xml$', dest: '/public/sitemap.xml' },
    { src: '^/robots.txt$', dest: '/public/robots.txt' },
    // API endpoints
    { src: '^/api$', dest: '/api/index.js' },
    { src: '^/api/puzzles/today', dest: '/api/puzzles/today.js' },
    { src: '^/api/puzzles/archive', dest: '/api/puzzles/archive.js' },
    { src: '^/api/puzzles/([^/]+)/guess', dest: '/api/puzzles/[id]/guess/index.js?id=$1' },
    { src: '^/api/puzzles/([^/]+)/hints/([^/]+)', dest: '/api/puzzles/[id]/hints/[index]/index.js?id=$1&index=$2' },
    { src: '^/api/puzzles/([^/]+)/answer', dest: '/api/puzzles/[id]/answer/index.js?id=$1' },
    // Fallback to client SPA
    { src: '/(.*)', dest: '/index.html' }
  ],
  // Headers configuration
  headers: [
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
      ]
    }
  ]
};