const mongoose = require('mongoose');
const InspectionBatch = require('./src/models/InspectionBatch.model');
const InspectionTask = require('./src/models/InspectionTask.model');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const batch = await InspectionBatch.findOne({}).sort({ createdAt: -1 });
  console.log('--- LATEST BATCH ---');
  console.log('Status:', batch.status);
  
  const tasks = await InspectionTask.find({ batchId: batch._id });
  console.log('\n--- TASKS FOR LATEST BATCH ---');
  console.log('Count:', tasks.length);
  if (tasks.length > 0) {
    console.log('First Task Status:', tasks[0].status);
    console.log('First Task Image URL:', tasks[0].imageUrl);
  }
  
  process.exit(0);
}

check();
