'use strict';

const ATMS_QUESTION_CONFIG = {
  'CCTV': [
    { code: 'CCTV_CAMERA_CONDITION', question: 'CCTV Camera Condition', category: 'ATMS' },
    { code: 'CCTV_CAMERA_MOUNTING', question: 'Camera Mounting', category: 'ATMS' },
    { code: 'CCTV_CAMERA_ORIENTATION', question: 'Camera Orientation', category: 'ATMS' },
    { code: 'CCTV_CAMERA_VISIBILITY', question: 'Camera Visibility', category: 'ATMS' },
    { code: 'CCTV_CAMERA_LENS_CONDITION', question: 'Camera Lens Condition', category: 'ATMS' },
    { code: 'CCTV_POLE_CONDITION', question: 'CCTV Pole Condition', category: 'ATMS' },
    { code: 'CCTV_POLE_MOUNTING', question: 'CCTV Pole Mounting', category: 'ATMS' },
    { code: 'CCTV_CABLE_CONDUIT_CONDITION', question: 'Cable / Conduit Condition', category: 'ATMS' },
    { code: 'CCTV_OBSTRUCTION_AROUND', question: 'Obstruction Around CCTV', category: 'ATMS' },
    { code: 'CCTV_IDENTIFICATION_LABEL', question: 'CCTV Identification / Label', category: 'ATMS' }
  ],
  'VMS': [],
  'TRAFFIC_SIGNAL': [],
  'TRAFFIC_SENSOR': [],
  'WEATHER_STATION': [],
  'ATC': [],
  'ANPR': [],
  'SOS': [],
  'OTHER': []
};

module.exports = {
  ATMS_QUESTION_CONFIG
};
