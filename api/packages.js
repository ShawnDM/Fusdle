// This file simply lists dependencies our serverless function needs
// It can help with Vercel dependency detection
const packages = {
  express: '^4.18.2',
  'body-parser': '^1.20.1',
  firebase: '^9.18.0',
  'firebase-admin': '^11.5.0'
};

module.exports = packages;