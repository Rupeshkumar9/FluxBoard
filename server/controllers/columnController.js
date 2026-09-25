import Column from '../models/Column.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';

// @desc    Create a column
// @route   POST /api/boards/:boardId/columns
// @access  Private
const createColumn = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check membership
    const isMember = board.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get next order number
    const maxOrder = await Column.findOne({ board: board._id })
      .sort({ order: -1 })
      .select('order');
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const column = await Column.create({
      title: req.body.title || 'New Column',
      board: board._id,
      order,
    });

    // Add column to board
    board.columns.push(column._id);
    await board.save();

    res.status(201).json(column);
  } catch (error) {
    next(error);
  }
};

// @desc    Update column title
// @route   PUT /api/columns/:id
// @access  Private
const updateColumn = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.id);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    if (req.body.title) column.title = req.body.title;
    await column.save();

    res.json(column);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete column
// @route   DELETE /api/columns/:id
// @access  Private
const deleteColumn = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.id);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Delete all tasks in the column
    await Task.deleteMany({ column: column._id });

    // Remove column from board
    await Board.findByIdAndUpdate(column.board, {
      $pull: { columns: column._id },
    });

    // Delete the column
    await Column.findByIdAndDelete(column._id);

    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder columns
// @route   PUT /api/columns/reorder
// @access  Private
const reorderColumns = async (req, res, next) => {
  try {
    const { boardId, columnOrder } = req.body;
    // columnOrder is an array of column IDs in the new order

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Update column order in board
    board.columns = columnOrder;
    await board.save();

    // Update individual column order values
    for (let i = 0; i < columnOrder.length; i++) {
      await Column.findByIdAndUpdate(columnOrder[i], { order: i });
    }

    res.json({ message: 'Columns reordered successfully' });
  } catch (error) {
    next(error);
  }
};

export { createColumn, updateColumn, deleteColumn, reorderColumns };
