'use strict';

const User = require('../../models/User.model');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination.util');

/**
 * Gets all users with optional filtering and pagination
 */
const getAllUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status === 'active') filter.isActive = true;
  if (query.status === 'inactive') filter.isActive = false;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { username: { $regex: query.search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Gets a single user by ID
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

/**
 * Creates a new user
 */
const createUser = async (data) => {
  const { password, ...rest } = data;
  const email = rest.email?.toLowerCase().trim();
  const username = rest.username?.trim();

  const existing = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existing) {
    const field = existing.email === email ? 'Email' : 'Username';
    throw Object.assign(new Error(`${field} already exists`), { statusCode: 409 });
  }

  if (!password || !password.trim()) {
    throw Object.assign(new Error('Password is required'), { statusCode: 400 });
  }

  const user = await User.create({
    ...rest,
    email,
    username,
    name: rest.name?.trim(),
    role: rest.role || 'User',
    mobile: rest.mobile?.trim(),
    manager: rest.manager?.trim(),
    designation: rest.designation?.trim(),
    jobDescription: rest.jobDescription?.trim(),
    roadAssignment: rest.roadAssignment?.trim(),
    passwordHash: password.trim()
  });
  return user;
};

/**
 * Updates a user - allows editing all fields including email, username, and password
 */
const updateUser = async (id, data) => {
  const { password, ...rest } = data;
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  if (rest.email && rest.email.toLowerCase().trim() !== user.email) {
    const existingEmail = await User.findOne({ email: rest.email.toLowerCase().trim(), _id: { $ne: id } });
    if (existingEmail) throw Object.assign(new Error('Email already in use by another account'), { statusCode: 409 });
    user.email = rest.email.toLowerCase().trim();
  }

  if (rest.username && rest.username.trim() !== user.username) {
    const existingUsername = await User.findOne({ username: rest.username.trim(), _id: { $ne: id } });
    if (existingUsername) throw Object.assign(new Error('Username already in use by another account'), { statusCode: 409 });
    user.username = rest.username.trim();
  }

  if (rest.name !== undefined) user.name = rest.name.trim();
  if (rest.role !== undefined) user.role = rest.role;
  if (rest.mobile !== undefined) user.mobile = rest.mobile.trim();
  if (rest.manager !== undefined) user.manager = rest.manager.trim();
  if (rest.designation !== undefined) user.designation = rest.designation.trim();
  if (rest.jobDescription !== undefined) user.jobDescription = rest.jobDescription.trim();
  if (rest.roadAssignment !== undefined) user.roadAssignment = rest.roadAssignment.trim();
  if (rest.isActive !== undefined) user.isActive = rest.isActive;

  if (password && password.trim() !== '') {
    user.passwordHash = password.trim();
  }

  return await user.save();
};

/**
 * Toggles user active status
 */
const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  user.isActive = !user.isActive;
  await user.save();
  return user;
};

/**
 * Deletes a user (soft delete via isActive = false)
 */
const deleteUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

/**
 * Gets user statistics
 */
const getUserStats = async () => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } }
      }
    }
  ]);

  const total = await User.countDocuments();
  const active = await User.countDocuments({ isActive: true });

  return { total, active, inactive: total - active, byRole: stats };
};

/**
 * Gets dashboard data for the logged-in user
 */
const getUserDashboard = async (userId) => {
  const WorkAssignment = require('../../models/WorkAssignment.model');
  const InspectionBatch = require('../../models/InspectionBatch.model');
  const Notification = require('../../models/Notification.model');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    totalAssignments,
    newAssignments,
    inProgress,
    overdue,
    dueToday,
    completedToday,
    assignments,
    notifications,
    unreadNotificationsCount
  ] = await Promise.all([
    WorkAssignment.countDocuments({ assignedTo: userId }),
    WorkAssignment.countDocuments({ assignedTo: userId, status: 'Assigned' }),
    WorkAssignment.countDocuments({ assignedTo: userId, status: 'In Progress' }),
    WorkAssignment.countDocuments({
      assignedTo: userId,
      $or: [
        { status: 'Overdue' },
        { status: { $in: ['Assigned', 'In Progress'] }, dueDate: { $lt: startOfToday } }
      ]
    }),
    WorkAssignment.countDocuments({
      assignedTo: userId,
      status: { $in: ['Assigned', 'In Progress'] },
      dueDate: { $gte: startOfToday, $lte: endOfToday }
    }),
    WorkAssignment.countDocuments({
      assignedTo: userId,
      status: 'Completed',
      updatedAt: { $gte: startOfToday, $lte: endOfToday }
    }),
    WorkAssignment.find({ assignedTo: userId })
      .populate('batchId', 'name status project uniqueChainagesCount selectedQuestionsCount createdAt dateOfSurvey')
      .populate('assignedBy', 'name email username')
      .sort({ createdAt: -1 }),
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ userId, isRead: false })
  ]);

  // Ensure all overdue tasks have notification items in the response
  const mergedNotifications = [...notifications];
  assignments.forEach((a) => {
    const isOverdue = a.status === 'Overdue' || (a.status !== 'Completed' && a.dueDate && new Date(a.dueDate) < startOfToday);
    if (isOverdue) {
      const alreadyHasOverdueNotif = mergedNotifications.some(n => String(n.relatedResourceId) === String(a._id) && n.title?.includes('Overdue'));
      if (!alreadyHasOverdueNotif) {
        const batchName = a.batchName || a.batchId?.name || 'Inspection Batch';
        const project = a.project || 'Project';
        const diffDays = Math.max(1, Math.floor((startOfToday.getTime() - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
        mergedNotifications.unshift({
          _id: `overdue-${a._id}`,
          userId: userId,
          title: `Overdue Task: ${a.category || 'Roadway'} - ${project}`,
          body: `${batchName} • Due date crossed by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
          type: 'WARNING',
          isRead: false,
          link: `/rating/inspector/${a.batchId?._id || a.batchId}`,
          relatedResource: 'WorkAssignment',
          relatedResourceId: String(a._id),
          createdAt: a.createdAt || new Date()
        });
      }
    }
  });

  return {
    kpis: {
      totalAssignments,
      newAssignments,
      inProgress,
      overdue,
      dueToday,
      completedToday
    },
    assignments,
    notifications: mergedNotifications,
    unreadNotificationsCount: unreadNotificationsCount + mergedNotifications.filter(n => !n.isRead && String(n._id).startsWith('overdue-')).length
  };
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, toggleUserStatus, deleteUser, getUserStats, getUserDashboard };
