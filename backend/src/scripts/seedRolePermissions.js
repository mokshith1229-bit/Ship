'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Feature = require('../models/Feature.model');
const RolePermission = require('../models/RolePermission.model');
const PermissionHistory = require('../models/PermissionHistory.model');

const modulesData = [
  {
    moduleId: 'f1',
    moduleName: 'Dashboard',
    sectionId: 'f1-s1',
    sectionName: 'Overview'
  },
  {
    moduleId: 'f2',
    moduleName: 'Master List',
    sectionId: 'f2-s1',
    sectionName: 'Roads'
  },
  {
    moduleId: 'f3',
    moduleName: 'Inspection Engine',
    sectionId: 'f3-s1',
    sectionName: 'Settings'
  },
  {
    moduleId: 'f4',
    moduleName: 'Roadway Sampling',
    sectionId: 'f4-s1',
    sectionName: 'Samples'
  },
  {
    moduleId: 'f5',
    moduleName: 'Structures Sampling',
    sectionId: 'f5-s1',
    sectionName: 'Samples'
  },
  {
    moduleId: 'f6',
    moduleName: 'Project Facilities',
    sectionId: 'f6-s1',
    sectionName: 'Projects'
  },
  {
    moduleId: 'f7',
    moduleName: 'ATMS',
    sectionId: 'f7-s1',
    sectionName: 'Settings'
  },
  {
    moduleId: 'f8',
    moduleName: 'Survey Library',
    sectionId: 'f8-s1',
    sectionName: 'Surveys'
  },
  {
    moduleId: 'f9',
    moduleName: 'Survey Processing',
    sectionId: 'f9-s1',
    sectionName: 'Jobs'
  },
  {
    moduleId: 'f10',
    moduleName: 'Image Review',
    sectionId: 'f10-s1',
    sectionName: 'Gallery'
  },
  {
    moduleId: 'f11',
    moduleName: 'Rating',
    sectionId: 'f11-s1',
    sectionName: 'Ratings'
  },
  {
    moduleId: 'f11v2',
    moduleName: 'Rating V2',
    sectionId: 'f11v2-s1',
    sectionName: 'Ratings'
  },
  {
    moduleId: 'f12',
    moduleName: 'SHIP',
    sectionId: 'f12-s1',
    sectionName: 'Analytics'
  },
  {
    moduleId: 'f13',
    moduleName: 'Reports',
    sectionId: 'f13-s1',
    sectionName: 'Generated Reports'
  },
  {
    moduleId: 'f14',
    moduleName: 'Notifications',
    sectionId: 'f14-s1',
    sectionName: 'Alerts'
  },
  {
    moduleId: 'f15',
    moduleName: 'Users',
    sectionId: 'f15-s1',
    sectionName: 'User List'
  },
  {
    moduleId: 'f15b',
    moduleName: 'User Insights',
    sectionId: 'f15b-s1',
    sectionName: 'Insights'
  },
  {
    moduleId: 'f16',
    moduleName: 'Role',
    sectionId: 'f16-s1',
    sectionName: 'Permissions'
  }
];

const roles = ['Admin', 'SPV', 'User'];

// Default permissions per role
const getRoleDefaultPermissions = (role, moduleName) => {
  if (role === 'Admin') {
    return { view: true, create: true, edit: true, delete: true, export: true };
  }
  if (role === 'SPV') {
    const spvModules = ['Dashboard', 'Rating', 'Rating V2', 'SHIP', 'Reports', 'Notifications', 'Image Review'];
    const hasView = spvModules.includes(moduleName);
    return { view: hasView, create: false, edit: hasView, delete: false, export: hasView };
  }
  if (role === 'User') {
    const userModules = ['Dashboard', 'Rating', 'Rating V2', 'Notifications'];
    const hasView = userModules.includes(moduleName);
    return { view: hasView, create: false, edit: false, delete: false, export: false };
  }
  return { view: false, create: false, edit: false, delete: false, export: false };
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Cleaning existing features and permissions...');

    await Feature.deleteMany({});
    await RolePermission.deleteMany({});
    await PermissionHistory.deleteMany({});

    console.log('Collections cleared. Seeding features and permissions...');

    let order = 1;
    for (const item of modulesData) {
      // 1. Create Module Feature
      await Feature.create({
        featureId: item.moduleId,
        featureName: item.moduleName,
        featureType: 'Module',
        moduleName: item.moduleName,
        parentFeature: null,
        order: order++,
        status: true
      });

      // Module permissions
      for (const role of roles) {
        await RolePermission.create({
          roleId: role,
          featureId: item.moduleId,
          permissions: getRoleDefaultPermissions(role, item.moduleName)
        });
      }

      // 2. Create Section Feature
      await Feature.create({
        featureId: item.sectionId,
        featureName: item.sectionName,
        featureType: 'Section',
        moduleName: item.moduleName,
        parentFeature: item.moduleId,
        order: order++,
        status: true
      });

      // Section permissions
      for (const role of roles) {
        await RolePermission.create({
          roleId: role,
          featureId: item.sectionId,
          permissions: getRoleDefaultPermissions(role, item.moduleName)
        });
      }
    }

    const featureCount = await Feature.countDocuments();
    const permCount = await RolePermission.countDocuments();

    console.log(`Seeding completed successfully! Total Features: ${featureCount}, Total Permissions: ${permCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
