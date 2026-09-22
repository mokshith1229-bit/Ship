const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: '../frontend/src/pages/ReportsPage.jsx',
    importPath: "import HiRateRoadLoader from '../components/common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="flex flex-col items-center justify-center min-h-\[400px\] text-gray-500">\s*<Loader2 className="w-8 h-8 text-indigo-600 animate-spin" \/>\s*<p[^>]*>(.*?)<\/p>\s*<\/div>/g,
        '<div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">\n<HiRateRoadLoader size="medium" message="$1" />\n</div>'
      );
    }
  },
  {
    file: '../frontend/src/pages/SurveyLibraryPage.jsx',
    importPath: "import HiRateRoadLoader from '../components/common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="flex flex-col items-center justify-center h-64">\s*<LuLoader className="animate-spin text-3xl text-primary mb-3" \/>\s*<span[^>]*>(.*?)<\/span>\s*<\/div>/g,
        '<div className="flex flex-col items-center justify-center h-64">\n<HiRateRoadLoader size="medium" message="$1" />\n</div>'
      );
    }
  }
];

replacements.forEach(rep => {
  const filePath = path.join(__dirname, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('HiRateRoadLoader')) {
      const match = content.match(/import.*?;/);
      if (match) {
        content = content.replace(match[0], match[0] + '\n' + rep.importPath);
      } else {
        content = rep.importPath + '\n' + content;
      }
    }

    content = rep.replaceFn(content);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${rep.file}`);
  } else {
    console.log(`File not found: ${rep.file}`);
  }
});
