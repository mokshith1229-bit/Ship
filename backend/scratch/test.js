require('dotenv').config();
const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const task = await InspectionTask.findOne({ chainage: { $exists: true } }).select('chainage').lean();
  console.log(task);
  process.exit();
}).catch(e => console.log(e));
