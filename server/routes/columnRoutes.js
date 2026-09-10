const express = require('express');
const { updateColumn, deleteColumn, reorderColumns } = require('../controllers/columnController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.put('/reorder', reorderColumns);
router.route('/:id').put(updateColumn).delete(deleteColumn);

module.exports = router;
