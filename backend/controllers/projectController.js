const Project = require('../models/Project');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Create project
// @route   POST /api/projects
exports.createProject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        req.body.client = req.user._id;
        const project = await Project.create(req.body);
        await project.populate('client', 'name email avatar');

        res.status(201).json({ success: true, project });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects (with filtering & pagination)
// @route   GET /api/projects
exports.getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.status) filter.status = req.query.status;
        if (req.query.category) filter.category = req.query.category;
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
            ];
        }
        if (req.query.minBudget || req.query.maxBudget) {
            filter['budget.min'] = {};
            if (req.query.minBudget) filter['budget.min'].$gte = parseInt(req.query.minBudget);
            if (req.query.maxBudget) filter['budget.max'] = { $lte: parseInt(req.query.maxBudget) };
        }

        const total = await Project.countDocuments(filter);
        const projects = await Project.find(filter)
            .populate('client', 'name email avatar')
            .populate('selectedFreelancer', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            projects,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name email avatar bio')
            .populate('selectedFreelancer', 'name email avatar');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const bids = await Bid.find({ project: req.params.id })
            .populate('freelancer', 'name email avatar skills rating completedProjects')
            .sort({ createdAt: -1 });

        res.json({ success: true, project, bids });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('client', 'name email avatar');

        res.json({ success: true, project });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
        }

        await Bid.deleteMany({ project: req.params.id });
        await Project.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get client's projects
// @route   GET /api/projects/my-projects
exports.getMyProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({ client: req.user._id })
            .populate('selectedFreelancer', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({ success: true, projects });
    } catch (error) {
        next(error);
    }
};

// @desc    Select freelancer for project
// @route   PUT /api/projects/:id/select-freelancer
exports.selectFreelancer = async (req, res, next) => {
    try {
        const { bidId } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        // Update project
        project.selectedFreelancer = bid.freelancer;
        project.status = 'in-progress';
        await project.save();

        // Accept the selected bid, reject others
        await Bid.findByIdAndUpdate(bidId, { status: 'accepted' });
        await Bid.updateMany(
            { project: req.params.id, _id: { $ne: bidId } },
            { status: 'rejected' }
        );

        // Create notification for the selected freelancer
        await Notification.create({
            user: bid.freelancer,
            type: 'bid_accepted',
            title: 'Bid Accepted!',
            message: `Your bid on "${project.title}" has been accepted!`,
            relatedProject: project._id,
        });

        // Notify rejected bidders
        const rejectedBids = await Bid.find({
            project: req.params.id,
            _id: { $ne: bidId },
        });

        for (const rejBid of rejectedBids) {
            await Notification.create({
                user: rejBid.freelancer,
                type: 'bid_rejected',
                title: 'Bid Update',
                message: `Another freelancer was selected for "${project.title}".`,
                relatedProject: project._id,
            });
        }

        const updatedProject = await Project.findById(req.params.id)
            .populate('client', 'name email avatar')
            .populate('selectedFreelancer', 'name email avatar');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`project-${req.params.id}`).emit('freelancer-selected', {
                project: updatedProject,
                selectedBidId: bidId,
            });
            io.to(`user-${bid.freelancer}`).emit('notification', {
                type: 'bid_accepted',
                message: `Your bid on "${project.title}" has been accepted!`,
            });
        }

        res.json({ success: true, project: updatedProject });
    } catch (error) {
        next(error);
    }
};
