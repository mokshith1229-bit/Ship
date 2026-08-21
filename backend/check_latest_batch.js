const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models/MasterList.model');
const InspectionTask = require('./src/models/InspectionTask.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const latestBatch = await InspectionTask.findOne().sort({ createdAt: -1 });
  if (latestBatch) {
    const tasks = await InspectionTask.find({ batchId: latestBatch.batchId }).limit(5).populate('parameters');
    console.log(`Tasks for Batch ${latestBatch.batchId}:`);
    tasks.forEach(t => {
      console.log(`- Task ID: ${t._id}, Category: ${t.category}, Params: ${t.parameters?.length}, FirstParamCategory: ${t.parameters?.[0]?.category}`);
    });
  } else {
    console.log('No tasks found.');
  }
  process.exit(0);
});
