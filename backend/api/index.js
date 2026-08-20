const createApp = require('../src/app');
const connectDB = require('../src/config/db');

const app = createApp();

// Ensure DB is connected for serverless invocations
connectDB().catch(console.error);

module.exports = app;
