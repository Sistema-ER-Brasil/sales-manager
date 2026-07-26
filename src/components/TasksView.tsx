import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskComment } from '../types';
import { formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';
import { rowToTaskComment, taskCommentToRow } from '../lib/db';
import { ConfirmDialog } from './ConfirmDialog';
import {
  ListChecks,
  Plus,
  X,
  Trash2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Flag,
  LayoutGrid,
  List as ListIcon,
  MessageSquare,
  Send,
  User as UserIcon,
  Inbox,
  Send as SentIcon,
} from 'lucide-react';

const COLUMNS: { status: Task['status']; label: string }[] = [
  { status: 'pending', label: 'Pendente' },
  { status: 'in_progress', label: 'Em Andamento' },
  { status: 'done', label: 'Concluída' },
];

const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  done: 'Concluída',
};

const PRIORITY_STYLE: Record<Task['priority'], string> = {
  low: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300 dark:border-blue-800',
  high: 'bg-blue-900 text-white dark:bg-blue-950 dark:text-white border-blue-950',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

type FilterTab = 'all' | 'assigned_to_me' | 'created_by_me';
type ViewMode = 'kanban' | 'list';

export const TasksView: React.FC = () => {
  const { tasks, users, currentUser, addTask, updateTaskStatus, deleteTask } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterTab, setFilterTab] = useState<FilterTab>(isAdmin ? 'all' : 'assigned_to_me');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(users[0]?.id || '');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const baseTasks = isAdmin ? tasks : tasks.filter((t) => t.assignedTo === currentUser.id || t.createdBy === currentUser.id);
  const visibleTasks = baseTasks.filter((t) => {
    if (filterTab === 'assigned_to_me') return t.assignedTo === currentUser.id;
    if (filterTab === 'created_by_me') return t.createdBy === currentUser.id;
    return true;
  });

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(users[0]?.id || '');
    setPriority('medium');
    setDueDate('');
    setShowCreateModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;
    const assignedUser = users.find((u) => u.id === assignedTo);
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo,
      assignedToName: assignedUser?.name || 'Usuário',
      priority,
      dueDate: dueDate || undefined,
    });
    setShowCreateModal(false);
  };

  const handleDrop = (status: Task['status'], taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    updateTaskStatus(taskId, status);
  };

  const filterTabs: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    ...(isAdmin ? [{ id: 'all' as FilterTab, label: 'Todas', icon: ListChecks }] : []),
    { id: 'assigned_to_me', label: 'Designadas a Mim', icon: Inbox },
    { id: 'created_by_me', label: 'Criadas por Mim', icon: SentIcon },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Gestão de Tarefas ({visibleTasks.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Quadro
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Lista
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={openCreate}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = visibleTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(col.status);
                }}
                onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStatus(null);
                  const taskId = e.dataTransfer.getData('text/plain');
                  handleDrop(col.status, taskId);
                }}
                className={`rounded-2xl border p-3 space-y-3 min-h-[200px] transition-colors ${
                  dragOverStatus === col.status
                    ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-700'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {col.label}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                      onClick={() => setDetailTask(task)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">{task.title}</h4>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(task);
                            }}
                            className="p-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                            title="Excluir Tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${PRIORITY_STYLE[task.priority]}`}>
                          <Flag className="w-2.5 h-2.5" /> {PRIORITY_LABEL[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {formatDateBR(task.dueDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {task.assignedToName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {col.status !== 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex((c) => c.status === col.status) - 1].status);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Mover para trás"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {col.status !== 'done' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex((c) => c.status === col.status) + 1].status);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Avançar"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="text-center py-6 text-[11px] text-slate-400">Nenhuma tarefa aqui.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-3">Título</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma tarefa encontrada.</td>
                  </tr>
                ) : (
                  visibleTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setDetailTask(task)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{task.title}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{task.assignedToName}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLE[task.priority]}`}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{task.dueDate ? formatDateBR(task.dueDate) : '—'}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase">
                          {STATUS_LABEL[task.status]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(task);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600"
                            title="Excluir Tarefa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-600" /> Nova Tarefa
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atualizar estoque do Shopee"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição (Opcional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável *</label>
                  <select
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prazo (Opcional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL (with notes/comments) */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          isAdmin={isAdmin}
          onDelete={() => {
            setDeleteTarget(detailTask);
            setDetailTask(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Excluir Tarefa"
        message={`Tem certeza que deseja excluir a tarefa "${deleteTarget?.title}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTask(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

const TaskDetailModal: React.FC<{
  task: Task;
  onClose: () => void;
  isAdmin: boolean;
  onDelete: () => void;
}> = ({ task, onClose, isAdmin, onDelete }) => {
  const { currentUser, updateTaskStatus } = useApp();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      if (active) {
        if (!error && data) setComments(data.map(rowToTaskComment));
        setLoadingComments(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [task.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    const comment: TaskComment = {
      id: `comment_${Date.now()}`,
      taskId: task.id,
      userId: currentUser.id,
      userName: currentUser.name,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('task_comments').insert(taskCommentToRow(comment));
    setPosting(false);
    if (!error) {
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-800 p-5 shrink-0">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${PRIORITY_STYLE[task.priority]}`}>
                <Flag className="w-2.5 h-2.5" /> {PRIORITY_LABEL[task.priority]}
              </span>
              {task.dueDate && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDateBR(task.dueDate)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0">
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-400 font-bold uppercase text-[9px] flex items-center gap-1"><UserIcon className="w-3 h-3" /> Responsável</span>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{task.assignedToName}</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-400 font-bold uppercase text-[9px] flex items-center gap-1"><SentIcon className="w-3 h-3" /> Criado por</span>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{task.createdByName}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {COLUMNS.map((col) => (
              <button
                key={col.status}
                onClick={() => updateTaskStatus(task.id, col.status)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  task.status === col.status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={onDelete}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir esta tarefa
            </button>
          )}

          {/* Notes / Comments thread */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Anotações ({comments.length})
            </h4>

            {loadingComments ? (
              <p className="text-[11px] text-slate-400">Carregando...</p>
            ) : comments.length === 0 ? (
              <p className="text-[11px] text-slate-400">Nenhuma anotação ainda.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{c.userName}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTimeBR(c.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handlePostComment} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar uma anotação..."
            className="flex-1 p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
