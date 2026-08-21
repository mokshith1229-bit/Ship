const mongoose = require('mongoose');
require('dotenv').config();
require('./src/models/MasterList.model');
const InspectionTask = require('./src/models/InspectionTask.model');
const Inspection = require('./src/models/Inspection.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const latestBatch = await InspectionTask.findOne().sort({ createdAt: -1 });
  if (latestBatch) {
    const rsfTasks = await InspectionTask.find({ 
      batchId: latestBatch.batchId,
      category: 'Road Signage and Furniture' 
    }).populate('parameters');
    
    console.log(`Found ${rsfTasks.length} RSF tasks in Batch ${latestBatch.batchId}`);
    
    // Check if any of them are completed
    const completedTasks = rsfTasks.filter(t => t.status === 'COMPLETED');
    console.log(`Of those, ${completedTasks.length} are COMPLETED`);
    
    if (completedTasks.length > 0) {
      console.log('Sample Completed Task ID:', completedTasks[0]._id);
      // Check if it exists in the Inspection collection
      const inspection = await Inspection.findOne({ taskId: completedTasks[0]._id });
      console.log('Exists in Inspection collection?', !!inspection);
      if (inspection) {
        console.log('Inspection Category:', inspection.category);
      }
    }
  }
  process.exit(0);
});
