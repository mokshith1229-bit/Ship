const createApp = require('../src/app');
const connectDB = require('../src/config/db');

const app = createApp();

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to database in Vercel Serverless:', err);
    return res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
  return app(req, res);
};
