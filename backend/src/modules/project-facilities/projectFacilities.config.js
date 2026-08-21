'use strict';

const PROJECT_FACILITY_QUESTION_CONFIG = {
  'BUS_BAY': [
    { code: 'BUS_BAY_SHELTER_CONDITION', question: 'Physical condition of bus shelter shed', category: 'Project Facilities' },
    { code: 'BUS_BAY_SEATING_CONDITION', question: 'Physical condition of seating arrangement', category: 'Project Facilities' },
    { code: 'BUS_BAY_PLATFORM_CONDITION', question: 'Physical condition of platform', category: 'Project Facilities' },
    { code: 'BUS_BAY_PAVEMENT_MARKING_PHYSICAL', question: 'Physical condition of pavement marking', category: 'Project Facilities' },
    { code: 'BUS_BAY_PAVEMENT_MARKING_FUNCTIONAL', question: 'Functional condition of pavement marking', category: 'Project Facilities' },
    { code: 'BUS_BAY_AREA_CONDITION', question: 'Condition of bus bay area', category: 'Project Facilities' },
    { code: 'BUS_BAY_SHELTER_PAINTING', question: 'Painting of bus shelter', category: 'Project Facilities' },
    { code: 'BUS_BAY_CLEANLINESS', question: 'Cleanliness of bus bay', category: 'Project Facilities' }
  ],
  'TRUCK_LAY_BY': [
    { code: 'TRUCK_LAY_BY_BUILDING_CONDITION', question: 'Physical condition of truck lay by building', category: 'Project Facilities' },
    { code: 'TRUCK_LAY_BY_BUILDING_PAINTING', question: 'Painting of truck lay by building', category: 'Project Facilities' },
    { code: 'TRUCK_LAY_BY_CLEANLINESS', question: 'Cleanliness of truck lay by', category: 'Project Facilities' },
    { code: 'TRUCK_LAY_BY_PAVEMENT_MARKING_PHYSICAL', question: 'Physical condition of pavement marking', category: 'Project Facilities' },
    { code: 'TRUCK_LAY_BY_PAVEMENT_MARKING_FUNCTIONAL', question: 'Functional condition of pavement marking', category: 'Project Facilities' }
  ]
};

module.exports = {
  PROJECT_FACILITY_QUESTION_CONFIG
};
