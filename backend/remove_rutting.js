require('dotenv').config();
const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');
const Inspection = require('./src/models/Inspection.model');

async function removeRutting() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Removing rutting parameter from all Roadway InspectionTasks...');
    const result = await InspectionTask.updateMany(
      { category: 'Roadway', 'ratings.parameterKey': 'rutting' },
      { $pull: { ratings: { parameterKey: 'rutting' } } }
    );
    
    console.log(`InspectionTask: Matched ${result.matchedCount} tasks. Modified ${result.modifiedCount} tasks.`);
    
    console.log('Removing rutting parameter from all Roadway Inspections (Legacy)...');
    const inspResult = await Inspection.updateMany(
      { category: 'Roadway', 'parameters.parameter': 'Rutting' },
      { $pull: { parameters: { parameter: 'Rutting' } } }
    );
    console.log(`Inspection: Matched ${inspResult.matchedCount} documents. Modified ${inspResult.modifiedCount} documents.`);
    
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

removeRutting();
