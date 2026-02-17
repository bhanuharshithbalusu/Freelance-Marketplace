const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Project description is required'],
            maxlength: [5000, 'Description cannot exceed 5000 characters'],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Web Development',
                'Mobile Development',
                'UI/UX Design',
                'Graphic Design',
                'Content Writing',
                'Digital Marketing',
                'Data Science',
                'DevOps',
                'Video Production',
                'Other',
            ],
        },
        skills: [
            {
                type: String,
                trim: true,
            },
        ],
        budget: {
            min: {
                type: Number,
                required: [true, 'Minimum budget is required'],
                min: [1, 'Budget must be at least $1'],
            },
            max: {
                type: Number,
                required: [true, 'Maximum budget is required'],
            },
        },
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
        },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'completed', 'cancelled'],
            default: 'open',
        },
        selectedFreelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        bidCount: {
            type: Number,
            default: 0,
        },
        attachments: [
            {
                type: String,
            },
        ],
    },
    { timestamps: true }
);

// Index for efficient queries
projectSchema.index({ status: 1, category: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
