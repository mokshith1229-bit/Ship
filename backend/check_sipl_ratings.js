require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project.model');
const Inspection = require('./src/models/Inspection.model');

async function checkRatings() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const projects = await Project.find({});
  console.log(`Found ${projects.length} total projects.`);
  projects.forEach(p => console.log(`Project: ${p.code} - ${p.fullName}, ID: ${p._id}`));
  
  const inspections = await Inspection.find({});
  console.log(`Found ${inspections.length} total inspections.`);
  
  // See which project IDs have inspections
  const counts = await Inspection.aggregate([
    { $group: { _id: '$projectId', count: { $sum: 1 } } }
  ]);
  console.log('Inspection counts by project ID:', counts);
  
  process.exit(0);
}

checkRatings().catch(console.error);
