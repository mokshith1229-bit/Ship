'use strict';

const reportsService = require('./reports.service');

const getSPVLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await reportsService.getSPVLeaderboard();
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

const getSPVAnalytics = async (req, res, next) => {
  try {
    const spvId = req.params.spvId;
    const analytics = await reportsService.getSPVAnalytics(spvId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSPVLeaderboard,
  getSPVAnalytics
};
