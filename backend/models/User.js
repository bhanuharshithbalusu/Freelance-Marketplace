const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
            // No longer required — Google users won't have a password
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values (for non-Google users)
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
        role: {
            type: String,
            enum: ['client', 'freelancer'],
            required: [true, 'Role is required'],
        },
        avatar: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: '',
        },
        skills: [
            {
                type: String,
                trim: true,
            },
        ],
        portfolio: [
            {
                title: { type: String, trim: true },
                description: { type: String, trim: true },
                url: { type: String, trim: true },
            },
        ],
        hourlyRate: {
            type: Number,
            default: 0,
        },
        location: {
            type: String,
            default: '',
        },
        completedProjects: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Hash password before saving (only if password exists and was modified)
userSchema.pre('save', async function (next) {
    if (!this.password || !this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
