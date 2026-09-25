import express from 'express';
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addComment,
} from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.put('/reorder', reorderTasks);
router.post('/columns/:columnId', createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

export default router;
