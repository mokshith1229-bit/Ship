const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SHIP-dbupgrade');
    try {
        const InspectionTask = require('./src/models/InspectionTask.model');
        const tasks = await InspectionTask.find({ batchId: '6a7d4a1398028ebfd158ed67' }).limit(5);
        console.log(tasks.map(t => ({ id: t._id, project: t.project, projectId: t.projectId })));
    } catch (e) {
        console.error('Error occurred:', e);
    }
    await mongoose.connection.close();
};
run();
