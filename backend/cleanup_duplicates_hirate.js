require('dotenv').config();
const mongoose = require('mongoose');
const InspectionTask = require('./src/models/InspectionTask.model');

async function cleanDuplicates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Find tasks that have at least some ratings
    const tasks = await InspectionTask.find({ 'ratings.0': { $exists: true } });
    console.log(`Found ${tasks.length} tasks with saved ratings.`);

    let updatedCount = 0;
    let totalRemoved = 0;

    for (const task of tasks) {
      if (task.ratings && task.ratings.length > 0) {
        const uniqueRatingsMap = new Map();
        
        // Loop through the ratings and keep only the latest instance of each parameterKey
        task.ratings.forEach(rating => {
          const key = rating.parameterKey || rating.masterListId || rating.parameterName;
          if (key) {
             uniqueRatingsMap.set(key, rating);
          }
        });

        // If the unique map size is less than the array length, we have duplicates!
        if (uniqueRatingsMap.size < task.ratings.length) {
          const removed = task.ratings.length - uniqueRatingsMap.size;
          totalRemoved += removed;
          console.log(`Task ${task._id} (Chainage ${task.chainage || 'N/A'}): Reduced from ${task.ratings.length} to ${uniqueRatingsMap.size} (Removed ${removed} duplicates)`);
          
          task.ratings = Array.from(uniqueRatingsMap.values());
          await task.save();
          updatedCount++;
        }
      }
    }

    console.log(`\n=== CLEANUP SUMMARY ===`);
    console.log(`Total tasks updated: ${updatedCount}`);
    console.log(`Total duplicate parameters removed: ${totalRemoved}`);
    console.log(`=======================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanDuplicates();
