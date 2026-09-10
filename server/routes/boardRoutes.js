const express = require('express');
const {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} = require('../controllers/boardController');
const { createColumn } = require('../controllers/columnController');
const auth = require('../middleware/auth');

const router = express.Router();

// All board routes require auth
router.use(auth);

router.route('/').get(getBoards).post(createBoard);
router.route('/:id').get(getBoard).put(updateBoard).delete(deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:boardId/columns', createColumn);

module.exports = router;
