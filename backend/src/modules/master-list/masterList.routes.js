'use strict';

const express = require('express');
const router = express.Router();
const masterListController = require('./masterList.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { uploadExcel } = require('../../middleware/upload.middleware');

router.use(authenticate);

// Flat APIs for Question Bank & Projects (Read-only for all authenticated users)
router.get('/', requirePermission('Master List', 'view'), masterListController.getMasterList);
router.get('/projects', masterListController.getProjects);
router.get('/categories', masterListController.getCategories);
router.get('/assets', masterListController.getAssetTypes); 
router.get('/road-types', masterListController.getRoadTypes);
router.get('/parameters', masterListController.getParameters);
router.get('/chainages', masterListController.getChainages);
router.get('/kpis', masterListController.getStats);

// Mutation APIs (Governed by RBAC permissions)
router.post('/import', requirePermission('Master List', 'create'), uploadExcel.single('file'), masterListController.importMasterList);
router.put('/:id', requirePermission('Master List', 'edit'), masterListController.updateMasterListItem);
router.delete('/project/:projectName', requirePermission('Master List', 'delete'), masterListController.deleteProjectMasterList);
router.delete('/:id', requirePermission('Master List', 'delete'), masterListController.deleteMasterListItem);

module.exports = router;
