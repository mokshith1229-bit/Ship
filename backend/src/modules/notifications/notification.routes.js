'use strict';

const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, clearAllNotifications } = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
