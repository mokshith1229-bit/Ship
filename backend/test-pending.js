const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');

mongoose.connect('mongodb://localhost:27017/hirate', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const pendingTasks = await InspectionTask.find({ 
      project: 'GMC - BS 2', 
      status: { $in: ['READY_FOR_RATING', 'IN_PROGRESS'] } 
    }).lean();
    
    console.log('Pending Tasks:', JSON.stringify(pendingTasks, null, 2));
    
    const allTasksCount = await InspectionTask.countDocuments({
      project: 'GMC - BS 2'
    });
    console.log('All Tasks Count:', allTasksCount);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
