const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  '../frontend/src/components/Ship/SpatialIntelligence.jsx',
  '../frontend/src/components/Ship/RelationshipIntelligence.jsx',
  '../frontend/src/components/Ship/DecisionIntelligence.jsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Add import if not exists
    if (!content.includes('HiRateRoadLoader')) {
      content = content.replace(/(import.*from 'react-icons\/md';\r?\n)/, '$1import HiRateRoadLoader from \'../common/HiRateRoadLoader\';\n');
    }

    // Replace loaders
    content = content.replace(
      /<div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"[^>]*><\/div>\s*<p[^>]*>(.*?)<\/p>/g,
      '<HiRateRoadLoader size="medium" message="$1" />'
    );
    
    // Some might be self-closing <div ... />
    content = content.replace(
      /<div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"[^>]*\/>\s*<p[^>]*>(.*?)<\/p>/g,
      '<HiRateRoadLoader size="medium" message="$1" />'
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
