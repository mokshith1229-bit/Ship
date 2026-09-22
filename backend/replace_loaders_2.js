const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: '../frontend/src/components/ProjectMap.jsx',
    importPath: "import HiRateRoadLoader from './common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" \/>\s*<span[^>]*>(.*?)<\/span>/g,
        '<HiRateRoadLoader size="medium" message="$1" />'
      );
    }
  },
  {
    file: '../frontend/src/components/dashboard/SkipAnalytics.jsx',
    importPath: "import HiRateRoadLoader from '../common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="flex flex-col items-center justify-center h-64 gap-4">\s*<div className="w-10 h-10 border-4 border-\[#166534\] border-t-transparent rounded-full animate-spin"><\/div>\s*<p[^>]*>(.*?)<\/p>\s*<\/div>/g,
        '<div className="flex flex-col items-center justify-center h-64 gap-4">\n<HiRateRoadLoader size="medium" message="$1" />\n</div>'
      );
    }
  },
  {
    file: '../frontend/src/components/dashboard/UserDashboard.jsx',
    importPath: "import HiRateRoadLoader from '../common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"><\/div><\/div>;/g,
        'return <div className="p-8 flex justify-center items-center h-full"><HiRateRoadLoader size="medium" /></div>;'
      );
    }
  },
  {
    file: '../frontend/src/components/dashboard/comparison/InspectionComparison.jsx',
    importPath: "import HiRateRoadLoader from '../../common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="flex flex-col items-center justify-center h-64">\s*<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"><\/div>\s*<p[^>]*>(.*?)<\/p>\s*<\/div>/g,
        '<div className="flex flex-col items-center justify-center h-64">\n<HiRateRoadLoader size="medium" message="$1" />\n</div>'
      );
    }
  },
  {
    file: '../frontend/src/pages/RoadSummaryPage.jsx',
    importPath: "import HiRateRoadLoader from '../components/common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="w-7 h-7 border-4 border-\[#5cb85c\] border-t-transparent rounded-full animate-spin"><\/div>\s*<span[^>]*>(.*?)<\/span>/g,
        '<HiRateRoadLoader size="small" message="$1" />'
      );
    }
  },
  {
    file: '../frontend/src/pages/MasterList/components/MasterListTable.jsx',
    importPath: "import HiRateRoadLoader from '../../../components/common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"><\/div>\s*<p[^>]*>(.*?)<\/p>/g,
        '<HiRateRoadLoader size="medium" message="$1" />'
      );
    }
  },
  {
    file: '../frontend/src/pages/InspectionEngine/components/BatchListTable.jsx',
    importPath: "import HiRateRoadLoader from '../../../components/common/HiRateRoadLoader';",
    replaceFn: (content) => {
      return content.replace(
        /<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"><\/div>\s*<p[^>]*>(.*?)<\/p>/g,
        '<HiRateRoadLoader size="medium" message="$1" />'
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
