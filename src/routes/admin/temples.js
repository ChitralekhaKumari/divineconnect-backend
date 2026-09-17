const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');
const {
    listTemples, getTemple, createTemple, updateTemple, setActive, deleteTemple,
} = require('../../controllers/admin/templesAdminController');

router.use(requireAdmin);

router.get('/', listTemples);
router.post('/', createTemple);
router.get('/:id', getTemple);
router.put('/:id', updateTemple);
router.patch('/:id/active', setActive);
router.delete('/:id', deleteTemple);

module.exports = router;
