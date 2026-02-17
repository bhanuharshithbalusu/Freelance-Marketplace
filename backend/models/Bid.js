const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Bid amount is required'],
            min: [1, 'Bid amount must be at least $1'],
        },
        deliveryDays: {
            type: Number,
            required: [true, 'Delivery time is required'],
            min: [1, 'Delivery time must be at least 1 day'],
        },
        proposal: {
            type: String,
            required: [true, 'Proposal is required'],
            maxlength: [2000, 'Proposal cannot exceed 2000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// Prevent duplicate bids
bidSchema.index({ project: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
