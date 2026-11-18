import { createApp } from '../server/app.ts';

// Vercel serverless entry: all /api/* requests are rewritten here (see vercel.json)
// and handled by the same Express app used in local development.
export default createApp();
