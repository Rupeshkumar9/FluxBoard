import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Get all boards for current user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ members: req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json(boards);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single board with columns and tasks
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate({
        path: 'columns',
        options: { sort: { order: 1 } },
        populate: {
          path: 'tasks',
          options: { sort: { order: 1 } },
          populate: [
            { path: 'assignees', select: 'name email avatar' },
            { path: 'comments.user', select: 'name avatar' },
          ],
        },
      });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member
    const isMember = board.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this board.' });
    }

    res.json(board);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res, next) => {
  try {
    const { title, description, background } = req.body;

    const board = await Board.create({
      title,
      description,
      background,
      owner: req.user._id,
      members: [req.user._id],
    });

    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    const columnDocs = [];

    for (let i = 0; i < defaultColumns.length; i++) {
      const column = await Column.create({
        title: defaultColumns[i],
        board: board._id,
        order: i,
      });
      columnDocs.push(column._id);
    }

    board.columns = columnDocs;
    await board.save();

    // Re-fetch with populated data
    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('columns');

    res.status(201).json(populatedBoard);
  } catch (error) {
    next(error);
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private (owner only)
const updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can update settings' });
    }

    const { title, description, background } = req.body;
    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (background) board.background = background;

    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private (owner only)
const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can delete' });
    }

    // Delete all tasks in the board
    await Task.deleteMany({ board: board._id });

    // Delete all columns in the board
    await Column.deleteMany({ board: board._id });

    // Delete the board
    await Board.findByIdAndDelete(board._id);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private
const addMember = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if requester is a member
    const isMember = board.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email } = req.body;
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Check if already a member
    const alreadyMember = board.members.some(
      (m) => m.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    board.members.push(userToAdd._id);
    await board.save();

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from board
// @route   DELETE /api/boards/:id/members/:userId
// @access  Private (owner only)
const removeMember = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }

    if (req.params.userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the board owner' });
    }

    board.members = board.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await board.save();

    // Also remove user from any task assignments in this board
    await Task.updateMany(
      { board: board._id },
      { $pull: { assignees: req.params.userId } }
    );

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

export {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
};
