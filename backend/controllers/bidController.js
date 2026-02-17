const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Create bid
// @route   POST /api/bids
exports.createBid = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { projectId, amount, deliveryDays, proposal } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.status !== 'open') {
            return res.status(400).json({ success: false, message: 'Project is not accepting bids' });
        }

        if (project.client.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot bid on your own project' });
        }

        // Check for existing bid
        const existingBid = await Bid.findOne({ project: projectId, freelancer: req.user._id });
        if (existingBid) {
            return res.status(400).json({ success: false, message: 'You have already placed a bid on this project' });
        }

        const bid = await Bid.create({
            project: projectId,
            freelancer: req.user._id,
            amount,
            deliveryDays,
            proposal,
        });

        // Increment bid count
        await Project.findByIdAndUpdate(projectId, { $inc: { bidCount: 1 } });

        await bid.populate('freelancer', 'name email avatar skills rating completedProjects');

        // Create notification for client
        await Notification.create({
            user: project.client,
            type: 'new_bid',
            title: 'New Bid Received',
            message: `${req.user.name} placed a $${amount} bid on "${project.title}"`,
            relatedProject: project._id,
        });

        // Emit socket events for real-time bidding
        const io = req.app.get('io');
        if (io) {
            io.to(`project-${projectId}`).emit('new-bid', { bid });
            io.to(`user-${project.client}`).emit('notification', {
                type: 'new_bid',
                message: `New bid of $${amount} on "${project.title}"`,
                projectId,
            });
        }

        res.status(201).json({ success: true, bid });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bids for a project
// @route   GET /api/bids/project/:projectId
exports.getProjectBids = async (req, res, next) => {
    try {
        const bids = await Bid.find({ project: req.params.projectId })
            .populate('freelancer', 'name email avatar skills rating completedProjects hourlyRate')
            .sort({ createdAt: -1 });

        res.json({ success: true, bids });
    } catch (error) {
        next(error);
    }
};

// @desc    Get freelancer's bids
// @route   GET /api/bids/my-bids
exports.getMyBids = async (req, res, next) => {
    try {
        const bids = await Bid.find({ freelancer: req.user._id })
            .populate({
                path: 'project',
                populate: { path: 'client', select: 'name email avatar' },
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, bids });
    } catch (error) {
        next(error);
    }
};
