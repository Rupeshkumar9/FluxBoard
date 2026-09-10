import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { boardService } from '../services/boardService';
import { Plus, LayoutDashboard, Clock, Users, X, Palette, MoreVertical, Edit3, Trash2, AlertTriangle } from 'lucide-react';

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

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '', background: GRADIENTS[0] });
  const [creating, setCreating] = useState(false);

  // Edit / Delete states
  const [editingBoard, setEditingBoard] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cardMenu, setCardMenu] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  // Close card menus on outside click
  useEffect(() => {
    const closeMenu = () => setCardMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const fetchBoards = async () => {
    try {
      const data = await boardService.getAll();
      setBoards(data);
    } catch (err) {
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoard.title.trim()) return;
    setCreating(true);
    try {
      const board = await boardService.create(newBoard);
      setBoards([board, ...boards]);
      setShowCreateModal(false);
      setNewBoard({ title: '', description: '', background: GRADIENTS[0] });
    } catch (err) {
      console.error('Failed to create board:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    if (!editingBoard?.title?.trim()) return;
    setUpdating(true);
    try {
      const updated = await boardService.update(editingBoard._id, {
        title: editingBoard.title,
        description: editingBoard.description,
        background: editingBoard.background,
      });
      setBoards(boards.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
      setEditingBoard(null);
    } catch (err) {
      console.error('Failed to update board:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;
    setDeleting(true);
    try {
      await boardService.delete(deletingBoard._id);
      setBoards(boards.filter((b) => b._id !== deletingBoard._id));
      setDeletingBoard(null);
    } catch (err) {
      console.error('Failed to delete board:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 px-4 sm:px-8 py-3.5 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <LayoutDashboard size={22} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">FluxBoard</span>
              <span className="text-[11px] text-surface-400 font-medium tracking-wide uppercase">Workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2.5 bg-surface-900/60 border border-white/5 py-1 px-2.5 rounded-xl">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-7 h-7 rounded-lg ring-1 ring-primary-500/40 object-cover"
              />
              <span className="text-xs font-semibold text-surface-200 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm text-xs text-surface-400 hover:text-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Project Boards</h1>
            <p className="text-surface-400 text-sm mt-1">
              Organize sprints, track tasks, and collaborate with your team in real time.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary self-start sm:self-auto py-2.5 px-4 shadow-lg"
            id="create-board-btn"
          >
            <Plus size={18} /> New Board
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="spinner spinner-lg" />
          </div>
        ) : boards.length === 0 ? (
          /* Empty state */
          <div className="glass-card rounded-2xl text-center py-20 px-4 max-w-md mx-auto animate-fade-in border border-dashed border-surface-700">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-surface-800/80 text-primary-400 ring-1 ring-white/10">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No boards created yet</h2>
            <p className="text-surface-400 text-sm mb-6">
              Create your first project board to start assigning tasks and tracking deliverables.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} /> Create First Board
            </button>
          </div>
        ) : (
          /* Board Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {boards.map((board, idx) => (
              <div
                key={board._id}
                className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary-500/10 cursor-pointer animate-fade-in border border-white/5"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Background Banner */}
                <div
                  onClick={() => navigate(`/board/${board._id}`)}
                  className="h-32 p-4.5 flex flex-col justify-between relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ background: board.background }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <h3 className="text-base sm:text-lg font-bold text-white relative z-10 line-clamp-2 leading-snug drop-shadow-md">
                    {board.title}
                  </h3>
                </div>

                {/* Card Top Actions (3-dots menu) */}
                <div className="absolute top-2.5 right-2.5 z-20" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setCardMenu(cardMenu === board._id ? null : board._id)}
                    className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {cardMenu === board._id && (
                    <div className="absolute right-0 top-9 glass rounded-xl py-1.5 w-36 shadow-2xl z-30 animate-slide-down border border-white/10">
                      <button
                        onClick={() => {
                          setEditingBoard({ ...board });
                          setCardMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-surface-200 hover:bg-surface-800/80 transition-colors"
                      >
                        <Edit3 size={14} className="text-primary-400" /> Edit Board
                      </button>
                      <button
                        onClick={() => {
                          setDeletingBoard(board);
                          setCardMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={14} /> Delete Board
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div
                  onClick={() => navigate(`/board/${board._id}`)}
                  className="p-4 bg-surface-900/90 flex flex-col justify-between min-h-[90px]"
                >
                  <p className="text-surface-300 text-xs line-clamp-2 mb-3 leading-relaxed">
                    {board.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-surface-400 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-surface-500" />
                      <span>{formatDate(board.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-surface-800/80 py-0.5 px-2 rounded-full">
                      <Users size={12} className="text-primary-400" />
                      <span>{board.members?.length || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===== Create Board Modal ===== */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="glass w-full max-w-md rounded-2xl p-6 sm:p-7 animate-scale-in border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">Create New Board</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
                  Board Title
                </label>
                <input
                  type="text"
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  placeholder="e.g. Q4 Growth & Infrastructure"
                  required
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
                  Description (optional)
                </label>
                <textarea
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  placeholder="Describe the goals and scope of this board…"
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-300 mb-2 uppercase tracking-wider">
                  <Palette size={13} className="text-primary-400" /> Theme Accent
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((bg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewBoard({ ...newBoard, background: bg })}
                      className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                      style={{
                        background: bg,
                        outline: newBoard.background === bg ? '2.5px solid #ffffff' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div
                className="h-20 rounded-xl flex items-end p-3.5 shadow-inner transition-all duration-300"
                style={{ background: newBoard.background }}
              >
                <span className="text-white font-bold text-sm truncate drop-shadow">
                  {newBoard.title || 'Board Preview'}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newBoard.title.trim()}
                  className="btn btn-primary flex-1"
                >
                  {creating ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Edit Board Modal ===== */}
      {editingBoard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setEditingBoard(null)}
        >
          <div className="glass w-full max-w-md rounded-2xl p-6 sm:p-7 animate-scale-in border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">Edit Board Settings</h2>
              <button onClick={() => setEditingBoard(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
                  Board Title
                </label>
                <input
                  type="text"
                  value={editingBoard.title}
                  onChange={(e) => setEditingBoard({ ...editingBoard, title: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={editingBoard.description || ''}
                  onChange={(e) => setEditingBoard({ ...editingBoard, description: e.target.value })}
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-300 mb-2 uppercase tracking-wider">
                  <Palette size={13} className="text-primary-400" /> Theme Accent
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((bg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditingBoard({ ...editingBoard, background: bg })}
                      className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
                      style={{
                        background: bg,
                        outline: editingBoard.background === bg ? '2.5px solid #ffffff' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div
                className="h-20 rounded-xl flex items-end p-3.5 shadow-inner transition-all duration-300"
                style={{ background: editingBoard.background }}
              >
                <span className="text-white font-bold text-sm truncate drop-shadow">
                  {editingBoard.title || 'Board Preview'}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBoard(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editingBoard.title.trim()}
                  className="btn btn-primary flex-1"
                >
                  {updating ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {deletingBoard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setDeletingBoard(null)}
        >
          <div className="glass w-full max-w-sm rounded-2xl p-6 animate-scale-in border border-danger/30 text-center">
            <div className="w-12 h-12 rounded-2xl bg-danger/15 text-danger mx-auto flex items-center justify-center mb-4 ring-1 ring-danger/30">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete this board?</h3>
            <p className="text-surface-300 text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-white">"{deletingBoard.title}"</span>? All columns and tasks inside will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingBoard(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                disabled={deleting}
                className="btn btn-danger flex-1"
              >
                {deleting ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
