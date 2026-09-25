import express from 'express';
import { updateColumn, deleteColumn, reorderColumns } from '../controllers/columnController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.put('/reorder', reorderColumns);
router.route('/:id').put(updateColumn).delete(deleteColumn);

export default router;
