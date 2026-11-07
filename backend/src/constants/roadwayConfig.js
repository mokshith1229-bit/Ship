const ROADWAY_PARAMETER_CONFIG = [
  { group: 'Pavement', parameterKey: 'cracks', parameterName: 'Cracks' },
  { group: 'Pavement', parameterKey: 'pothole', parameterName: 'Pothole' },
  { group: 'Shoulder', parameterKey: 'edgeDrop', parameterName: 'Edge Drop' },
  { group: 'Shoulder', parameterKey: 'unevenness', parameterName: 'Unevenness' },
  { group: 'Shoulder', parameterKey: 'vegetationGrowth', parameterName: 'Vegetation Growth' },
  { group: 'Kerb', parameterKey: 'cleanliness', parameterName: 'Cleanliness' },
  { group: 'Kerb', parameterKey: 'kerbPainting', parameterName: 'Kerb Painting' },
  { group: 'Kerb', parameterKey: 'physicalCondition', parameterName: 'Physical Condition' },
  { group: 'Pavement Markings', parameterKey: 'edgeLineMarking', parameterName: 'Edge Line Marking' },
  { group: 'Pavement Markings', parameterKey: 'laneLineMarking', parameterName: 'Lane Line Marking' },
  { group: 'Pavement Markings', parameterKey: 'shyLineMarking', parameterName: 'Shy Line Marking' },
  { group: 'ROW', parameterKey: 'cleanlinessOfRow', parameterName: 'Cleanliness of ROW' },
  { group: 'Median Plantation', parameterKey: 'physicalConditionOfMedianPlants', parameterName: 'Physical condition of median plants' },
  { group: 'Median Plantation', parameterKey: 'cleanlinessOfMedianGrass', parameterName: 'Cleanliness of median grass' },
  { group: 'Rigid Crash Barriers', parameterKey: 'RCB_HAND_RAIL', parameterName: 'Hand rail pipe – missing / rusted / damaged' },
  { group: 'Rigid Crash Barriers', parameterKey: 'RCB_PAINTING', parameterName: 'Painting of RC crash barrier inner face – faded / not faded' },
  { group: 'Rigid Crash Barriers', parameterKey: 'RCB_CRACKS', parameterName: 'Cracks' },
  { group: 'Rigid Crash Barriers', parameterKey: 'RCB_CHIPPED', parameterName: 'Chipped concrete due to accidents' }
];

module.exports = { ROADWAY_PARAMETER_CONFIG };
