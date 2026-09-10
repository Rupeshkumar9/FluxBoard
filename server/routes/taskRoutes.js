const express = require('express');
const {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addComment,
} = require('../controllers/taskController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.put('/reorder', reorderTasks);
router.post('/columns/:columnId', createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
