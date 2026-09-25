import Task from '../models/Task.js';
import Column from '../models/Column.js';

// @desc    Create a task
// @route   POST /api/columns/:columnId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const column = await Column.findById(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get next order number
    const maxOrder = await Task.findOne({ column: column._id })
      .sort({ order: -1 })
      .select('order');
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      labels: req.body.labels || [],
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null,
      assignees: req.body.assignees || [],
      column: column._id,
      board: column.board,
      order,
    });

    // Add task to column
    column.tasks.push(task._id);
    await column.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar');

    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get task details
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('comments.user', 'name avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const allowedFields = [
      'title', 'description', 'labels', 'priority',
      'dueDate', 'assignees', 'checklist', 'order',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('comments.user', 'name avatar');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Remove task from column
    await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id },
    });

    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Move / reorder tasks (drag & drop)
// @route   PUT /api/tasks/reorder
// @access  Private
const reorderTasks = async (req, res, next) => {
  try {
    const { taskId, sourceColumnId, destColumnId, sourceTaskOrder, destTaskOrder } = req.body;

    // If moving to a different column
    if (sourceColumnId !== destColumnId) {
      // Remove from source column
      await Column.findByIdAndUpdate(sourceColumnId, {
        $pull: { tasks: taskId },
      });

      // Add to destination column at the right position
      const destColumn = await Column.findById(destColumnId);
      destColumn.tasks.splice(destTaskOrder.indexOf(taskId), 0, taskId);
      destColumn.tasks = destTaskOrder;
      await destColumn.save();

      // Update task's column reference
      await Task.findByIdAndUpdate(taskId, { column: destColumnId });

      // Update source column task order
      const sourceColumn = await Column.findById(sourceColumnId);
      sourceColumn.tasks = sourceTaskOrder;
      await sourceColumn.save();
    } else {
      // Reorder within the same column
      const column = await Column.findById(sourceColumnId);
      column.tasks = sourceTaskOrder;
      await column.save();
    }

    // Update order values for all affected tasks
    const allTaskIds = [...new Set([...sourceTaskOrder, ...destTaskOrder])];
    for (let i = 0; i < sourceTaskOrder.length; i++) {
      await Task.findByIdAndUpdate(sourceTaskOrder[i], { order: i });
    }
    if (sourceColumnId !== destColumnId) {
      for (let i = 0; i < destTaskOrder.length; i++) {
        await Task.findByIdAndUpdate(destTaskOrder[i], { order: i });
      }
    }

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('comments.user', 'name avatar');

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

export {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addComment,
};
