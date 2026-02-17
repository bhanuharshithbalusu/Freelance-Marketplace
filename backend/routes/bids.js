const express = require('express');
const { body } = require('express-validator');
const { createBid, getProjectBids, getMyBids } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post(
    '/',
    protect,
    authorize('freelancer'),
    [
        body('projectId').notEmpty().withMessage('Project ID is required'),
        body('amount').isNumeric().withMessage('Bid amount is required'),
        body('deliveryDays').isNumeric().withMessage('Delivery days is required'),
        body('proposal').trim().notEmpty().withMessage('Proposal is required'),
    ],
    createBid
);

router.get('/project/:projectId', protect, getProjectBids);
router.get('/my-bids', protect, authorize('freelancer'), getMyBids);

module.exports = router;
