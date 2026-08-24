require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const path = require('path');

const start = async () => {
  require('./src/config/cloudinary').initCloudinary();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const SurveyAsset = require('./src/models/SurveyAsset.model');
  const InspectionTask = require('./src/models/InspectionTask.model');
  const surveyProcessingService = require('./src/modules/survey-processing/services/surveyProcessing.service');

  const project = 'GMC - BS 2';

  // Find all tasks that are PENDING_IMAGE or EXTRACTION_FAILED
  const tasks = await InspectionTask.find({ 
    project, 
    status: { $in: ['PENDING_IMAGE', 'EXTRACTION_FAILED'] } 
  });
  
  console.log(`Found ${tasks.length} tasks needing extraction`);
  
  if (tasks.length === 0) {
    console.log('Nothing to do');
    process.exit(0);
  }

  const batchIds = [...new Set(tasks.map(t => t.batchId.toString()))];
  
  const assets = await SurveyAsset.find({ project, status: { $in: ['READY', 'COMPLETED'] } });

  console.log('Starting extraction in background...');
  
  // Call the service (await it so the script doesn't exit prematurely)
  try {
    const result = await surveyProcessingService.processImagesInBackground(project, null, {
      assets,
      tasks,
      batchIds
    });
    console.log('Extraction Result:', result);
  } catch (err) {
    console.error('Extraction Error:', err);
  }
  
  process.exit(0);
};

start();
