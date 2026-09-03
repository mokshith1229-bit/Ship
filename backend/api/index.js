const createApp = require('../src/app');
const connectDB = require('../src/config/db');

const app = createApp();

module.exports = async (req, res) => {
  // Set basic CORS headers for serverless entry point
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing in Vercel!');
    }
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to database in Vercel Serverless:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'CRITICAL ERROR: Database connection failed. You MUST add MONGO_URI to your Vercel Environment Variables.', 
      error: err.message 
    });
  }
  
  return app(req, res);
};
