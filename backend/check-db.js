require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project.model');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const projects = await Project.find().limit(5);
    console.log(projects.map(p => ({ code: p.code, fullName: p.fullName, client: p.client })));
    process.exit(0);
  })
  .catch(err => console.error(err));
