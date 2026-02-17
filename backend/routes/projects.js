const express = require('express');
const { body } = require('express-validator');
const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    getMyProjects,
    selectFreelancer,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProjects);
router.get('/my-projects', protect, authorize('client'), getMyProjects);
router.get('/:id', getProject);

router.post(
    '/',
    protect,
    authorize('client'),
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('budget.min').isNumeric().withMessage('Minimum budget is required'),
        body('budget.max').isNumeric().withMessage('Maximum budget is required'),
        body('deadline').isISO8601().withMessage('Valid deadline is required'),
    ],
    createProject
);

router.put('/:id', protect, authorize('client'), updateProject);
router.delete('/:id', protect, authorize('client'), deleteProject);
router.put('/:id/select-freelancer', protect, authorize('client'), selectFreelancer);

module.exports = router;
