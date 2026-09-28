require('dotenv').config();
const mongoose = require('mongoose');
const SurveyAsset = require('./src/models/SurveyAsset.model');
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const assets = await SurveyAsset.find({ project: 'GMC-BS', 'vtt.path': { $exists: true, $ne: null } });
  console.log('Found assets:', assets.length);
  for (const asset of assets) {
    console.log('Asset ID:', asset._id, 'VTT Path:', asset.vtt.path);
    try {
      if (fs.existsSync(asset.vtt.path)) {
        const content = fs.readFileSync(asset.vtt.path, 'utf8');
        console.log('VTT Content length:', content.length);
        const metadataPattern = /Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+),\s*Speed:\s*([0-9.-]+)[kK]m\/hr\s*chainage:\s*([0-9.-]+)/i;
        const blocks = content.trim().split(/\n\s*\n/);
        let matchCount = 0;
        for (const block of blocks) {
          if (block.match(metadataPattern)) matchCount++;
        }
        console.log('Matched blocks:', matchCount, 'out of', blocks.length);
        if (matchCount === 0 && blocks.length > 0) {
            console.log('Sample block 1:\n', blocks[1] || blocks[0]);
            console.log('Sample block 2:\n', blocks[2]);
        }
      } else {
        console.log('VTT File does not exist');
      }
    } catch (e) {
      console.log('Error reading VTT:', e.message);
    }
  }
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
