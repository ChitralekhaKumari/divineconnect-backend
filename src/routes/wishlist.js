const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');

// Every wishlist route requires a signed-in user.
router.get('/', requireAuth, getWishlist);
router.post('/', requireAuth, addToWishlist);
router.delete('/:itemType/:itemId', requireAuth, removeFromWishlist);

module.exports = router;
