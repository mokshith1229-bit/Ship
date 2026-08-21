require('dotenv').config();
const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const task = await InspectionTask.findOne({ category: 'Roadway' });
    console.log(JSON.stringify(task.ratings.map(r => r.parameterKey), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkTasks();
