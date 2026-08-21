const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models/MasterList.model');
const InspectionTask = require('./src/models/InspectionTask.model');
const InspectionBatch = require('./src/models/InspectionBatch.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const batches = await InspectionBatch.find().sort({ createdAt: -1 }).limit(5);
  for (const batch of batches) {
    const tasks = await InspectionTask.find({ batchId: batch._id }).populate('parameters').lean();
    const rsfTasks = tasks.filter(t => t.parameters && t.parameters.length > 0 && t.parameters.some(p => p.category === 'Road Signage and Furniture'));
    console.log(`Batch ${batch.name} (${batch._id}) - Total tasks: ${tasks.length}, RSF Tasks: ${rsfTasks.length}, Status: ${batch.status}`);
  }
  process.exit(0);
});
