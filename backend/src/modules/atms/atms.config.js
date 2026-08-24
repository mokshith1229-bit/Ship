'use strict';

const standardQuestions = [
  {
    code: 'CLEANLINESS',
    question: 'Cleanliness',
    ratingType: 'Point'
  },
  {
    code: 'FUNCTIONAL_CONDITION',
    question: 'Functional condition',
    ratingType: 'Point'
  },
  {
    code: 'PHYSICAL_CONDITION',
    question: 'Physical condition',
    ratingType: 'Point'
  }
];

const ATMS_QUESTION_CONFIG = {
  'CCTV': [...standardQuestions],
  'VMS': [...standardQuestions],
  'TRAFFIC_SIGNAL': [...standardQuestions],
  'TRAFFIC_SENSOR': [...standardQuestions],
  'WEATHER_STATION': [...standardQuestions],
  'ATC': [...standardQuestions],
  'ANPR': [...standardQuestions],
  'SOS': [...standardQuestions],
  'OTHER': [...standardQuestions]
};

module.exports = {
  ATMS_QUESTION_CONFIG
};
