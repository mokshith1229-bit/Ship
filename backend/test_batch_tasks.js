const mongoose = require('mongoose');
const { getBatchTasks } = require('./src/modules/ratings/rating.service');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SHIP-dbupgrade');
    try {
        const InspectionBatch = require('./src/models/InspectionBatch.model');
        const batch = await InspectionBatch.findOne({ status: { $in: ['READY_FOR_RATING', 'IN_PROGRESS'] } });
        if (batch) {
            console.log(`Testing with batchId: ${batch._id}`);
            const result = await getBatchTasks(batch._id, null);
            console.log(`Success: ${result.length} tasks returned`);
        } else {
            console.log('No batches found');
        }
    } catch (e) {
        console.error('Error occurred:', e);
    }
    await mongoose.connection.close();
};
run();
