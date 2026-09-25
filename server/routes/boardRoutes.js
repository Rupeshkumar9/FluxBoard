import express from 'express';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} from '../controllers/boardController.js';
import { createColumn } from '../controllers/columnController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All board routes require auth
router.use(auth);

router.route('/').get(getBoards).post(createBoard);
router.route('/:id').get(getBoard).put(updateBoard).delete(deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:boardId/columns', createColumn);

export default router;
