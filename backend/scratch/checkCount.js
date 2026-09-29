require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const InspectionTask = require('../src/models/InspectionTask.model');

async function checkTaskCount() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tasks = await InspectionTask.find({ project: 'GMC - BS 2' }).lean();
  let imgCount = 0;
  let taskWithImg = 0;
  tasks.forEach(t => {
    let hasImg = false;
    if (t.ratings) {
      t.ratings.forEach(r => {
        if (r.image) {
          imgCount++;
          hasImg = true;
        }
      });
    }
    if (hasImg) taskWithImg++;
  });
  console.log(`Total tasks: ${tasks.length}, Tasks with images: ${taskWithImg}, Total images: ${imgCount}`);
  process.exit(0);
}

checkTaskCount();
