const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models/MasterList.model');
const InspectionTask = require('./src/models/InspectionTask.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const latestBatch = await InspectionTask.findOne().sort({ createdAt: -1 });
  if (!latestBatch) return process.exit(0);
  
  const tasks = await InspectionTask.find({ batchId: latestBatch.batchId }).populate('parameters').lean();
  
  const rsfTasks = tasks.filter(t => t.parameters && t.parameters.length > 0 && t.parameters.some(p => p.category === 'Road Signage and Furniture'));
  
  console.log(`Found ${rsfTasks.length} tasks with RSF parameters.`);
  if (rsfTasks.length > 0) {
    const t = rsfTasks[0];
    console.log('Sample Task parameters category:', t.parameters.map(p => p.category));
    console.log('Task status:', t.status);
    console.log('Has image?', !!t.image?.cloudinaryUrl);
  }
  process.exit(0);
});
