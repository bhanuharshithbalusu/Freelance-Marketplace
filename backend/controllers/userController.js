const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user profile
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'bio', 'skills', 'portfolio', 'hourlyRate', 'location', 'avatar'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate('relatedProject', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notifications as read
// @route   PUT /api/users/notifications/read
exports.markNotificationsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const Project = require('../models/Project');
        const Bid = require('../models/Bid');

        let stats = {};

        if (req.user.role === 'client') {
            const totalProjects = await Project.countDocuments({ client: req.user._id });
            const openProjects = await Project.countDocuments({ client: req.user._id, status: 'open' });
            const inProgressProjects = await Project.countDocuments({ client: req.user._id, status: 'in-progress' });
            const completedProjects = await Project.countDocuments({ client: req.user._id, status: 'completed' });
            const totalBidsReceived = await Bid.countDocuments({
                project: { $in: await Project.find({ client: req.user._id }).distinct('_id') },
            });

            stats = { totalProjects, openProjects, inProgressProjects, completedProjects, totalBidsReceived };
        } else {
            const totalBids = await Bid.countDocuments({ freelancer: req.user._id });
            const acceptedBids = await Bid.countDocuments({ freelancer: req.user._id, status: 'accepted' });
            const pendingBids = await Bid.countDocuments({ freelancer: req.user._id, status: 'pending' });
            const activeProjects = await Project.countDocuments({ selectedFreelancer: req.user._id, status: 'in-progress' });

            stats = { totalBids, acceptedBids, pendingBids, activeProjects };
        }

        res.json({ success: true, stats });
    } catch (error) {
        next(error);
    }
};
