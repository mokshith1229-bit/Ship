require('dotenv').config();
const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');

async function checkRatings() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const siplTasks = await InspectionTask.find({ project: 'SIPL' });
  console.log(`Found ${siplTasks.length} SIPL tasks.`);
  
  if (siplTasks.length > 0) {
    let count1 = 0;
    let count5 = 0;
    let totalRatings = 0;
    siplTasks.forEach(task => {
      task.ratings.forEach(r => {
        totalRatings++;
        if (r.score === 1) count1++;
        if (r.score === 5) count5++;
      });
    });
    console.log(`Total Ratings: ${totalRatings}`);
    console.log(`Ratings of 1: ${count1}`);
    console.log(`Ratings of 5: ${count5}`);
  }
  
  process.exit(0);
}

checkRatings().catch(console.error);
