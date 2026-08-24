const xlsx = require('xlsx');
const fs = require('fs');

const data = [
  ['Facility', 'Chainage'],
  ['Bus Bay', 295.420],
  ['Bus Bay', 301.860],
  ['Truck Lay By', 298.250],
  ['Truck Lay By', 305.700]
];

const ws = xlsx.utils.aoa_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Facilities');

const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync('C:/Users/DP/Desktop/HIGHRATE/SHIP/backend/test_facilities.xlsx', buffer);

const { parseFacilityExcel } = require('./src/modules/project-facilities/services/projectFacilities.service');

async function run() {
  const fileBuffer = fs.readFileSync('C:/Users/DP/Desktop/HIGHRATE/SHIP/backend/test_facilities.xlsx');
  const result = await parseFacilityExcel(fileBuffer, 'project123');
  console.log(JSON.stringify(result, null, 2));
}

run();
