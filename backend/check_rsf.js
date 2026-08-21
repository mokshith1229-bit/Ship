const mongoose = require('mongoose');
require('dotenv').config();
const MasterList = require('./src/models/MasterList.model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const rsfRecords = await MasterList.find({ category: { $regex: /rsf/i } });
  console.log('RSF By Regex:', rsfRecords.length);
  const distinctCategories = await MasterList.distinct('category');
  console.log('Distinct Categories:', distinctCategories);
  
  const distinctAssets = await MasterList.distinct('assetType');
  console.log('Distinct Assets:', distinctAssets);

  const activeRSF = await MasterList.countDocuments({ category: 'RSF', status: 'Active' });
  console.log('Active RSF Records:', activeRSF);

  process.exit(0);
});
