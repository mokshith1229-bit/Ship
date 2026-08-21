const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models/MasterList.model');
const InspectionTask = require('./src/models/InspectionTask.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const latestBatch = await InspectionTask.findOne().sort({ createdAt: -1 });
  if (latestBatch) {
    const categories = await InspectionTask.distinct('category', { batchId: latestBatch.batchId });
    console.log(`Categories in Batch ${latestBatch.batchId}:`, categories);
    
    // Also check what categories the FIRST parameter has
    const sampleTask = await InspectionTask.findOne({ 
      batchId: latestBatch.batchId,
      parameters: { $exists: true, $not: { $size: 0 } }
    }).populate('parameters');
    
    if (sampleTask && sampleTask.parameters.length > 0) {
      console.log('Sample task first parameter category:', sampleTask.parameters[0].category);
      console.log('Sample task task category:', sampleTask.category);
    }
  }
  process.exit(0);
});
