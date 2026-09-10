import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardService } from '../services/boardService';
import { taskService, columnService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import {
  getSocket,
  joinBoardRoom,
  leaveBoardRoom,
  emitBoardUpdate,
  emitTaskUpdate,
  emitColumnUpdate,
} from '../services/socket';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  X,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  CheckSquare,
  MessageSquare,
  Users,
  Clock,
  LayoutDashboard,
  GripVertical,
  UserPlus,
  Settings,
  AlertTriangle,
  UserCheck,
  Check,
  Palette,
  Send,
} from 'lucide-react';

const LABEL_COLORS = [
  { name: 'Green', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Yellow', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Orange', color: '#f97316' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

const BoardView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Column operation states
  const [addingTaskCol, setAddingTaskCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [editingCol, setEditingCol] = useState(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [colMenu, setColMenu] = useState(null);

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Drag states for Tasks
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Drag states for Columns
  const [draggedColIdx, setDraggedColIdx] = useState(null);
  const [dragOverColIdx, setDragOverColIdx] = useState(null);

  useEffect(() => {
    fetchBoard();

    // Socket.io real-time connection
    joinBoardRoom(id);
    const socket = getSocket();

    const handleBoardUpdate = () => fetchBoard(false);
    const handleTaskUpdate = () => fetchBoard(false);
    const handleColumnUpdate = () => fetchBoard(false);

    socket.on('board-updated', handleBoardUpdate);
    socket.on('task-updated', handleTaskUpdate);
    socket.on('column-updated', handleColumnUpdate);

    return () => {
      leaveBoardRoom(id);
      socket.off('board-updated', handleBoardUpdate);
      socket.off('task-updated', handleTaskUpdate);
      socket.off('column-updated', handleColumnUpdate);
    };
  }, [id]);

  const fetchBoard = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await boardService.getById(id);
      setBoard(data);
      // Synchronize open task modal live if open
      setSelectedTask((prev) => {
        if (!prev) return null;
        for (const col of data.columns || []) {
          const found = col.tasks?.find((t) => t._id === prev._id);
          if (found) return found;
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const isOwner = () => {
    if (!board || !user) return false;
    const ownerId = board.owner?._id || board.owner;
    return ownerId?.toString() === user._id?.toString();
  };

  // ---- Column Operations ----
  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    try {
      await boardService.createColumn(id, newColTitle);
      setNewColTitle('');
      setAddingColumn(false);
      emitColumnUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditColumn = async (colId) => {
    if (!editColTitle.trim()) return;
    try {
      await columnService.update(colId, editColTitle);
      setEditingCol(null);
      emitColumnUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteColumn = async (colId) => {
    if (!confirm('Delete this column and all its tasks?')) return;
    try {
      await columnService.delete(colId);
      setColMenu(null);
      emitColumnUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Column Drag and Drop ----
  const onColumnDragStart = (e, index) => {
    setDraggedColIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'column');
  };

  const onColumnDragOver = (e, index) => {
    e.preventDefault();
    if (draggedColIdx !== null && draggedColIdx !== index) {
      setDragOverColIdx(index);
    }
  };

  const onColumnDrop = async (e, destIdx) => {
    e.preventDefault();
    setDragOverColIdx(null);
    if (draggedColIdx === null || draggedColIdx === destIdx) {
      setDraggedColIdx(null);
      return;
    }

    const reorderedCols = [...board.columns];
    const [removed] = reorderedCols.splice(draggedColIdx, 1);
    reorderedCols.splice(destIdx, 0, removed);

    // Optimistic state
    setBoard({ ...board, columns: reorderedCols });
    setDraggedColIdx(null);

    try {
      const colIds = reorderedCols.map((c) => c._id);
      await columnService.reorder(board._id, colIds);
      emitColumnUpdate(id);
    } catch (err) {
      console.error(err);
      fetchBoard(false);
    }
  };

  // ---- Task Operations ----
  const handleAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;
    try {
      await taskService.create(columnId, { title: newTaskTitle });
      setNewTaskTitle('');
      setAddingTaskCol(null);
      emitTaskUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.delete(taskId);
      setSelectedTask(null);
      emitTaskUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const updated = await taskService.update(taskId, updates);
      setSelectedTask(updated);
      emitTaskUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (taskId, text) => {
    if (!text.trim()) return;
    try {
      const updated = await taskService.addComment(taskId, text);
      setSelectedTask(updated);
      emitTaskUpdate(id);
      fetchBoard(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Task Drag & Drop ----
  const onDragStart = (e, task, sourceColId) => {
    e.stopPropagation();
    setDraggedTask({ ...task, sourceColId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'task');
  };

  const onDragEnd = () => {
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const onDragOver = (e, colId) => {
    e.preventDefault();
    if (draggedTask) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverCol(colId);
    }
  };

  const onDrop = async (e, destColId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);
    if (!draggedTask || draggedTask.sourceColId === destColId) {
      setDraggedTask(null);
      return;
    }

    const updatedBoard = { ...board };
    const srcCol = updatedBoard.columns.find((c) => c._id === draggedTask.sourceColId);
    const destCol = updatedBoard.columns.find((c) => c._id === destColId);

    if (srcCol && destCol) {
      srcCol.tasks = srcCol.tasks.filter((t) => t._id !== draggedTask._id);
      destCol.tasks = [...destCol.tasks, { ...draggedTask, column: destColId }];
      setBoard(updatedBoard);
    }

    const movingTaskId = draggedTask._id;
    const srcColId = draggedTask.sourceColId;
    setDraggedTask(null);

    try {
      const srcTasks = srcCol.tasks.map((t) => t._id);
      const destTasks = destCol.tasks.map((t) => t._id);
      await taskService.reorder({
        taskId: movingTaskId,
        sourceColumnId: srcColId,
        destColumnId: destColId,
        sourceTaskOrder: srcTasks,
        destTaskOrder: destTasks,
      });
      emitTaskUpdate(id);
    } catch (err) {
      console.error(err);
      fetchBoard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Board Top Navigation Bar */}
      <header className="glass sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost btn-icon text-surface-400 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {board.title}
            </h1>
            {board.description && (
              <p className="text-[11px] text-surface-400 truncate max-w-sm sm:max-w-md">
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Member Avatars & Invite button */}
          <div
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1.5 bg-surface-900/80 hover:bg-surface-800/80 border border-white/5 py-1 px-2.5 rounded-xl cursor-pointer transition-colors"
            title="Manage Board Members"
          >
            <div className="flex -space-x-2">
              {board.members?.slice(0, 4).map((m) => (
                <img
                  key={m._id}
                  src={m.avatar}
                  alt={m.name}
                  title={m.name}
                  className="w-6 h-6 rounded-full ring-2 ring-surface-950 object-cover"
                />
              ))}
              {board.members?.length > 4 && (
                <div className="w-6 h-6 rounded-full ring-2 ring-surface-950 bg-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-200">
                  +{board.members.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-surface-300 ml-1 flex items-center gap-1">
              <UserPlus size={13} className="text-primary-400" />
              <span className="hidden sm:inline">Invite</span>
            </span>
          </div>

          {/* Board Settings & Delete Menu */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn btn-ghost btn-icon text-surface-400 hover:text-white"
            title="Board Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Board Columns Canvas */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-6">
        <div className="flex gap-4 sm:gap-5 items-start min-h-full" style={{ minWidth: 'max-content' }}>
          {board.columns?.map((col, colIdx) => (
            <div
              key={col._id}
              draggable
              onDragStart={(e) => onColumnDragStart(e, colIdx)}
              onDragOver={(e) => onColumnDragOver(e, colIdx)}
              onDrop={(e) => onColumnDrop(e, colIdx)}
              className={`w-72 sm:w-80 flex-shrink-0 rounded-2xl transition-all duration-200 border flex flex-col ${
                dragOverCol === col._id
                  ? 'bg-primary-500/10 border-primary-500/40 ring-2 ring-primary-500/20'
                  : dragOverColIdx === colIdx
                  ? 'border-indigo-400/60 bg-surface-900/90'
                  : 'bg-surface-900/60 border-white/5 shadow-xl'
              }`}
              onDragOverCapture={(e) => onDragOver(e, col._id)}
              onDragLeaveCapture={() => setDragOverCol(null)}
              onDropCapture={(e) => onDrop(e, col._id)}
            >
              {/* Column Header */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between border-b border-white/5 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GripVertical size={14} className="text-surface-600 flex-shrink-0" />
                  {editingCol === col._id ? (
                    <input
                      value={editColTitle}
                      onChange={(e) => setEditColTitle(e.target.value)}
                      onBlur={() => handleEditColumn(col._id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditColumn(col._id)}
                      className="input py-1 px-2 text-xs font-bold"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xs sm:text-sm font-bold text-surface-100 truncate flex items-center gap-2">
                      {col.title}
                      <span className="text-[11px] font-semibold text-surface-400 bg-surface-800/90 px-2 py-0.5 rounded-full ring-1 ring-white/5">
                        {col.tasks?.length || 0}
                      </span>
                    </h3>
                  )}
                </div>

                {/* Column Action Menu */}
                <div className="relative">
                  <button
                    onClick={() => setColMenu(colMenu === col._id ? null : col._id)}
                    className="btn btn-ghost btn-icon btn-sm text-surface-500 hover:text-surface-200"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {colMenu === col._id && (
                    <div className="absolute right-0 top-8 glass rounded-xl py-1.5 w-36 shadow-2xl z-20 animate-slide-down border border-white/10">
                      <button
                        onClick={() => {
                          setEditingCol(col._id);
                          setEditColTitle(col.title);
                          setColMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-surface-200 hover:bg-surface-800/80 transition-colors"
                      >
                        <Edit3 size={13} className="text-primary-400" /> Rename
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(col._id)}
                        className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-2.5 sm:p-3 space-y-2.5 min-h-[4rem] flex-1 overflow-y-auto max-h-[calc(100vh-210px)]">
                {col.tasks?.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task, col._id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setSelectedTask(task)}
                    className="glass-card rounded-xl p-3.5 cursor-pointer hover:border-primary-500/35 transition-all duration-200 group active:scale-[0.98]"
                  >
                    {/* Labels */}
                    {task.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {task.labels.map((l, i) => (
                          <span
                            key={i}
                            className="h-1.5 w-7 rounded-full shadow-sm"
                            style={{ background: l.color }}
                            title={l.text}
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-surface-100 font-semibold leading-snug">
                      {task.title}
                    </p>

                    {/* Task Meta Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-surface-400">
                      {task.priority && (
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-medium text-surface-400 bg-surface-800/60 px-1.5 py-0.5 rounded-md">
                          <Calendar size={11} className="text-surface-500" />
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {task.comments?.length > 0 && (
                        <span className="flex items-center gap-1 font-medium text-surface-400">
                          <MessageSquare size={11} />
                          {task.comments.length}
                        </span>
                      )}
                      {task.checklist?.length > 0 && (
                        <span className="flex items-center gap-1 font-medium text-surface-400 bg-surface-800/50 px-1.5 py-0.5 rounded-md">
                          <CheckSquare size={11} className="text-primary-400" />
                          {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                        </span>
                      )}
                    </div>

                    {/* Assignee Avatars */}
                    {task.assignees?.length > 0 && (
                      <div className="flex -space-x-1.5 mt-2.5 pt-2 border-t border-white/5">
                        {task.assignees.slice(0, 3).map((a) => (
                          <img
                            key={a._id}
                            src={a.avatar}
                            alt={a.name}
                            title={a.name}
                            className="w-5 h-5 rounded-full ring-1 ring-surface-900 object-cover"
                          />
                        ))}
                        {task.assignees.length > 3 && (
                          <span className="w-5 h-5 rounded-full bg-surface-700 ring-1 ring-surface-900 flex items-center justify-center text-[9px] text-white">
                            +{task.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Inline Add Task Form */}
                {addingTaskCol === col._id ? (
                  <div className="space-y-2 p-2 bg-surface-800/60 rounded-xl border border-white/10 animate-scale-in">
                    <textarea
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Write a task title…"
                      rows={2}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddTask(col._id);
                        }
                      }}
                      className="input resize-none text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddTask(col._id)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => {
                          setAddingTaskCol(null);
                          setNewTaskTitle('');
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTaskCol(col._id)}
                    className="w-full flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-white hover:bg-surface-800/60 rounded-xl p-2.5 transition-colors"
                  >
                    <Plus size={15} /> Add a card
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add New Column Button */}
          {addingColumn ? (
            <div className="w-72 sm:w-80 flex-shrink-0 bg-surface-900/80 rounded-2xl p-3.5 space-y-2.5 border border-white/10 animate-scale-in">
              <input
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="Column title (e.g. In Review)…"
                autoFocus
                className="input text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              />
              <div className="flex gap-2">
                <button onClick={handleAddColumn} className="btn btn-primary btn-sm flex-1">
                  Create Column
                </button>
                <button
                  onClick={() => {
                    setAddingColumn(false);
                    setNewColTitle('');
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="w-72 sm:w-80 flex-shrink-0 flex items-center justify-center gap-2 text-xs font-bold text-surface-400 hover:text-white bg-surface-900/40 hover:bg-surface-900/80 rounded-2xl p-3.5 border border-dashed border-white/10 transition-all"
            >
              <Plus size={16} /> Add column
            </button>
          )}
        </div>
      </div>

      {/* ===== Task Detail Modal ===== */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          board={board}
          user={user}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onAddComment={handleAddComment}
        />
      )}

      {/* ===== Members Management Modal ===== */}
      {showMembersModal && (
        <MembersManagementModal
          board={board}
          user={user}
          isOwner={isOwner()}
          onClose={() => setShowMembersModal(false)}
          onBoardUpdated={() => {
            fetchBoard(false);
            emitBoardUpdate(id);
          }}
        />
      )}

      {/* ===== Board Settings Modal ===== */}
      {showSettingsModal && (
        <BoardSettingsModal
          board={board}
          isOwner={isOwner()}
          onClose={() => setShowSettingsModal(false)}
          onBoardUpdated={() => {
            fetchBoard(false);
            emitBoardUpdate(id);
          }}
          onDelete={() => {
            setShowSettingsModal(false);
            setShowDeleteModal(true);
          }}
        />
      )}

      {/* ===== Board Delete Confirmation Modal ===== */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="glass w-full max-w-sm rounded-2xl p-6 animate-scale-in border border-danger/30 text-center">
            <div className="w-12 h-12 rounded-2xl bg-danger/15 text-danger mx-auto flex items-center justify-center mb-4 ring-1 ring-danger/30">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete this board?</h3>
            <p className="text-surface-300 text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-white">"{board.title}"</span>? All columns and tasks inside will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await boardService.delete(board._id);
                    navigate('/dashboard');
                  } catch (err) {
                    console.error('Failed to delete board', err);
                  }
                }}
                className="btn btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// ===== Task Detail Modal (With Assignees & Checklist) =====
// =========================================================
const TaskDetailModal = ({ task, board, user, onClose, onUpdate, onDelete, onAddComment }) => {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [comment, setComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  // Checklist state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDesc(task.description || '');
    setPriority(task.priority || 'medium');
  }, [task]);

  // Assignee toggle
  const toggleAssignee = (memberId) => {
    const currentAssigneeIds = (task.assignees || []).map((a) => a._id || a);
    const exists = currentAssigneeIds.some((id) => id.toString() === memberId.toString());
    const updatedIds = exists
      ? currentAssigneeIds.filter((id) => id.toString() !== memberId.toString())
      : [...currentAssigneeIds, memberId];
    onUpdate(task._id, { assignees: updatedIds });
  };

  // Checklist operations
  const toggleChecklistItem = (index) => {
    const updated = [...(task.checklist || [])];
    updated[index].completed = !updated[index].completed;
    onUpdate(task._id, { checklist: updated });
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const updated = [...(task.checklist || []), { text: newChecklistItem.trim(), completed: false }];
    onUpdate(task._id, { checklist: updated });
    setNewChecklistItem('');
    setAddingChecklist(false);
  };

  const handleDeleteChecklistItem = (index) => {
    const updated = task.checklist.filter((_, i) => i !== index);
    onUpdate(task._id, { checklist: updated });
  };

  const completedChecklistCount = (task.checklist || []).filter((c) => c.completed).length;
  const totalChecklistCount = (task.checklist || []).length;
  const checklistPercentage = totalChecklistCount === 0 ? 0 : Math.round((completedChecklistCount / totalChecklistCount) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-3xl rounded-2xl animate-scale-in mb-8 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-start justify-between bg-surface-900/60">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  onUpdate(task._id, { title });
                  setEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdate(task._id, { title });
                    setEditingTitle(false);
                  }
                }}
                className="input text-base sm:text-lg font-bold"
                autoFocus
              />
            ) : (
              <h2
                className="text-base sm:text-lg font-bold text-white cursor-pointer hover:text-primary-300 transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {title}
              </h2>
            )}
            <p className="text-xs text-surface-400 mt-1">
              in column{' '}
              <span className="text-surface-200 font-semibold">
                {board.columns?.find((c) => c._id === task.column || c._id === task.column?._id)?.title || '—'}
              </span>
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onDelete(task._id)}
              className="btn btn-ghost btn-icon text-surface-400 hover:text-danger"
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-icon" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Edit3 size={13} className="text-primary-400" /> Description
              </h4>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="input resize-none text-xs leading-relaxed"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdate(task._id, { description: desc });
                        setEditingDesc(false);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingDesc(false)} className="btn btn-ghost btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="text-xs text-surface-300 bg-surface-850/80 rounded-xl p-3 min-h-[60px] cursor-pointer hover:bg-surface-800/80 transition-colors border border-white/5 leading-relaxed"
                >
                  {desc || 'Add a more detailed description…'}
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={13} className="text-primary-400" /> Checklist
                </h4>
                {totalChecklistCount > 0 && (
                  <span className="text-[11px] font-semibold text-surface-400">
                    {completedChecklistCount} of {totalChecklistCount} ({checklistPercentage}%)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {totalChecklistCount > 0 && (
                <div className="w-full h-1.5 bg-surface-800 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-indigo-400 transition-all duration-300 rounded-full"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-1.5 mb-2.5">
                {(task.checklist || []).map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-surface-800/60 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(index)}
                        className="w-4 h-4 rounded border-surface-600 text-primary-500 focus:ring-primary-500/30 accent-primary-500 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          item.completed
                            ? 'line-through text-surface-500'
                            : 'text-surface-200'
                        } truncate`}
                      >
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteChecklistItem(index)}
                      className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-danger transition-opacity p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item */}
              {addingChecklist ? (
                <form onSubmit={handleAddChecklistItem} className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add an item…"
                    autoFocus
                    className="input text-xs py-1.5"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary btn-sm">
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingChecklist(false);
                        setNewChecklistItem('');
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingChecklist(true)}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  <Plus size={13} /> Add item
                </button>
              )}
            </div>

            {/* Comments Section */}
            <div>
              <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare size={13} className="text-primary-400" /> Discussion ({task.comments?.length || 0})
              </h4>
              {/* Comment Input */}
              <div className="flex gap-2.5 mb-4">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5 ring-1 ring-primary-500/30"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment…"
                    className="input text-xs py-1.5"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onAddComment(task._id, comment);
                        setComment('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      onAddComment(task._id, comment);
                      setComment('');
                    }}
                    disabled={!comment.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>

              {/* Comment History */}
              <div className="space-y-3">
                {task.comments
                  ?.slice()
                  .reverse()
                  .map((c, i) => (
                    <div key={i} className="flex gap-2.5 bg-surface-900/50 p-3 rounded-xl border border-white/5">
                      <img
                        src={c.user?.avatar}
                        alt={c.user?.name}
                        className="w-7 h-7 rounded-full object-cover mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-surface-200">
                            {c.user?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-surface-500">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-surface-300 mt-1 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar Controls (1/3 width) */}
          <div className="space-y-5">
            {/* Assignees Selector */}
            <div>
              <h4 className="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={12} className="text-primary-400" /> Assignees
              </h4>
              <div className="space-y-1 bg-surface-900/60 p-2 rounded-xl border border-white/5 max-h-40 overflow-y-auto">
                {board.members?.map((member) => {
                  const isAssigned = (task.assignees || []).some(
                    (a) => (a._id || a).toString() === member._id.toString()
                  );
                  return (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => toggleAssignee(member._id)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                        isAssigned
                          ? 'bg-primary-500/20 text-white font-semibold'
                          : 'text-surface-300 hover:bg-surface-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="truncate">{member.name}</span>
                      </div>
                      {isAssigned && <Check size={14} className="text-primary-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <h4 className="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-2">
                Priority
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPriority(p.value);
                      onUpdate(task._id, { priority: p.value });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                      priority === p.value
                        ? 'bg-surface-800 text-white border-white/20 shadow'
                        : 'bg-surface-900/60 text-surface-400 border-transparent hover:bg-surface-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="capitalize">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Labels Selector */}
            <div>
              <h4 className="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-2">
                Color Labels
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {LABEL_COLORS.map((lc) => {
                  const active = task.labels?.some((l) => l.color === lc.color);
                  return (
                    <button
                      key={lc.color}
                      type="button"
                      onClick={() => {
                        const newLabels = active
                          ? task.labels.filter((l) => l.color !== lc.color)
                          : [...(task.labels || []), { text: lc.name, color: lc.color }];
                        onUpdate(task._id, { labels: newLabels });
                      }}
                      className="h-6 rounded-md transition-all hover:scale-105 shadow-sm"
                      style={{
                        background: lc.color,
                        opacity: active ? 1 : 0.35,
                        outline: active ? '2px solid white' : 'none',
                        outlineOffset: '1px',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-[11px] font-bold text-surface-400 uppercase tracking-wider mb-2">
                Due Date
              </h4>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => onUpdate(task._id, { dueDate: e.target.value || null })}
                className="input text-xs py-1.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ===== Members Management Modal (Invite & Remove) ========
// =========================================================
const MembersManagementModal = ({ board, user, isOwner, onClose, onBoardUpdated }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await boardService.addMember(board._id, email.trim());
      setSuccess('Member added successfully!');
      setEmail('');
      onBoardUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member. Check if email is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member from the board?')) return;
    try {
      await boardService.removeMember(board._id, memberId);
      onBoardUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-md rounded-2xl p-6 animate-scale-in border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-400" />
            <h3 className="text-base font-bold text-white">Board Members</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-6 space-y-3">
          <label className="block text-xs font-bold text-surface-300 uppercase tracking-wider">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@enterprise.io"
              required
              className="input text-xs flex-1"
            />
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm text-xs">
              {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Invite'}
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          {success && <p className="text-xs text-success">{success}</p>}
        </form>

        {/* Member List */}
        <div>
          <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2.5">
            Current Members ({board.members?.length || 0})
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {board.members?.map((m) => {
              const memberIsOwner = (board.owner?._id || board.owner)?.toString() === m._id?.toString();
              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{m.name}</p>
                      <p className="text-[11px] text-surface-400 truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memberIsOwner ? (
                      <span className="text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    ) : isOwner ? (
                      <button
                        onClick={() => handleRemove(m._id)}
                        className="btn btn-ghost btn-sm text-xs text-danger hover:bg-danger/10"
                        title="Remove member"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ===== Board Settings Modal (Edit Details & Delete) ======
// =========================================================
const BoardSettingsModal = ({ board, isOwner, onClose, onBoardUpdated, onDelete }) => {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [background, setBackground] = useState(board.background);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await boardService.update(board._id, { title, description, background });
      onBoardUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-md rounded-2xl p-6 animate-scale-in border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary-400" />
            <h3 className="text-base font-bold text-white">Board Settings</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
              Board Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isOwner}
              required
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner}
              rows={3}
              className="input text-xs resize-none"
            />
          </div>

          {isOwner && (
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-surface-300 mb-2 uppercase tracking-wider">
                <Palette size={13} className="text-primary-400" /> Theme Accent
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map((bg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBackground(bg)}
                    className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                    style={{
                      background: bg,
                      outline: background === bg ? '2.5px solid #ffffff' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            {isOwner && (
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
              </button>
            )}
          </div>
        </form>

        {isOwner && (
          <div className="mt-6 pt-5 border-t border-white/5">
            <h4 className="text-xs font-bold text-danger uppercase tracking-wider mb-2">Danger Zone</h4>
            <p className="text-[11px] text-surface-400 mb-3">
              Permanently delete this board along with all its columns and tasks.
            </p>
            <button onClick={onDelete} className="btn btn-danger btn-sm w-full">
              <Trash2 size={14} /> Delete Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardView;
