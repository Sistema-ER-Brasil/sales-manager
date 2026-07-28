import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskComment, User } from '../types';
import { formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { supabase } from '../lib/supabaseClient';
import { rowToTaskComment, taskCommentToRow } from '../lib/db';
import { getPermissions } from '../lib/permissions';
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
  Eye,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
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

type FilterTab = 'all' | 'assigned_to_me' | 'created_by_me' | 'watching';
type ViewMode = 'kanban' | 'list';

interface Watcher {
  userId: string;
  userName: string;
}

export const TasksView: React.FC = () => {
  const { tasks, users, currentUser, addTask, updateTaskStatus, deleteTask } = useApp();
  const perms = getPermissions(currentUser.role);
  const canSeeAll = perms.viewTeamStatus;
  const canDeleteAnyTask = currentUser.role === 'admin' || currentUser.role === 'diretor';

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filterTab, setFilterTab] = useState<FilterTab>(canSeeAll ? 'all' : 'assigned_to_me');
  const [watchedTaskIds, setWatchedTaskIds] = useState<Set<string>>(new Set());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(users[0]?.id || '');
  const [watcherIds, setWatcherIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('task_watchers').select('task_id').eq('user_id', currentUser.id);
      if (data) setWatchedTaskIds(new Set(data.map((r: any) => r.task_id)));
    })();
  }, [currentUser.id]);

  const baseTasks = canSeeAll
    ? tasks
    : tasks.filter((t) => t.assignedTo === currentUser.id || t.createdBy === currentUser.id || watchedTaskIds.has(t.id));
  const visibleTasks = baseTasks.filter((t) => {
    if (filterTab === 'assigned_to_me') return t.assignedTo === currentUser.id;
    if (filterTab === 'created_by_me') return t.createdBy === currentUser.id;
    if (filterTab === 'watching') return watchedTaskIds.has(t.id);
    return true;
  });

  // Performance stats — computed over ALL tasks in the system, visible to every user regardless of role.
  const totalTasks = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCount = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length;
  const priorityCounts = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  interface AssigneeStat {
    userId: string;
    userName: string;
    total: number;
    done: number;
    overdue: number;
  }

  const assigneeStatsByUser: Record<string, AssigneeStat> = {};
  tasks.forEach((t) => {
    if (!assigneeStatsByUser[t.assignedTo]) {
      assigneeStatsByUser[t.assignedTo] = { userId: t.assignedTo, userName: t.assignedToName, total: 0, done: 0, overdue: 0 };
    }
    const stat = assigneeStatsByUser[t.assignedTo];
    stat.total += 1;
    if (t.status === 'done') stat.done += 1;
    if (t.status !== 'done' && t.dueDate && t.dueDate < todayStr) stat.overdue += 1;
  });

  const assigneeStats = Object.values(assigneeStatsByUser)
    .map((a) => ({ ...a, completionRate: a.total > 0 ? (a.done / a.total) * 100 : 0 }))
    .sort((a, b) => b.completionRate - a.completionRate || b.total - a.total);

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(users[0]?.id || '');
    setWatcherIds([]);
    setPriority('medium');
    setDueDate('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;
    const assignedUser = users.find((u) => u.id === assignedTo);
    const newTask = await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      assignedTo,
      assignedToName: assignedUser?.name || 'Usuário',
      priority,
      dueDate: dueDate || undefined,
    });

    if (watcherIds.length > 0) {
      const rows = watcherIds
        .filter((id) => id !== assignedTo)
        .map((id) => ({
          task_id: newTask.id,
          user_id: id,
          user_name: users.find((u) => u.id === id)?.name || 'Usuário',
        }));
      if (rows.length > 0) await supabase.from('task_watchers').insert(rows);
    }

    setShowCreateModal(false);
  };

  const handleDrop = (status: Task['status'], taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    updateTaskStatus(taskId, status);
  };

  const canDeleteTask = (task: Task) => canDeleteAnyTask || task.createdBy === currentUser.id;

  const filterTabs: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    ...(canSeeAll ? [{ id: 'all' as FilterTab, label: 'Todas', icon: ListChecks }] : []),
    { id: 'assigned_to_me', label: 'Designadas a Mim', icon: Inbox },
    { id: 'created_by_me', label: 'Criadas por Mim', icon: SentIcon },
    { id: 'watching', label: 'Acompanhando', icon: Eye },
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

          <button
            onClick={openCreate}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* TASK PERFORMANCE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Tarefas
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ListChecks className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {totalTasks}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''} · {inProgressCount} em andamento · {doneCount} concluída{doneCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taxa de Conclusão
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {completionRate.toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{doneCount} de {totalTasks} concluídas</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Em Atraso
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                overdueCount > 0
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-base sm:text-lg font-bold tracking-tight ${
              overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {overdueCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Prazo vencido e ainda não concluída</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Por Prioridade
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Flag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5 mt-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Alta</span>
              <span className="font-bold text-slate-900 dark:text-white">{priorityCounts.high}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Média</span>
              <span className="font-bold text-slate-900 dark:text-white">{priorityCounts.medium}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Baixa</span>
              <span className="font-bold text-slate-900 dark:text-white">{priorityCounts.low}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE BY ASSIGNEE — visible to every user, including their own performance */}
      {assigneeStats.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Desempenho por Responsável
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {assigneeStats.map((a) => (
              <div
                key={a.userId}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all ${
                  a.userId === currentUser.id
                    ? 'border-blue-500 ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {a.userName}
                    {a.userId === currentUser.id && <span className="text-blue-600 dark:text-blue-400"> (você)</span>}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                    {a.total} tarefa{a.total !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                  {a.completionRate.toFixed(0)}%
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>
                    Concluídas: <strong className="text-slate-800 dark:text-slate-200">{a.done}</strong>
                  </span>
                  <span className={a.overdue > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                    Atrasadas: <strong>{a.overdue}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        {canDeleteTask(task) && (
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
                        {canDeleteTask(task) && (
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl my-8">
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

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Acompanhantes (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  {users.filter((u) => u.id !== assignedTo).map((u) => {
                    const isSel = watcherIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          setWatcherIds((prev) => (isSel ? prev.filter((id) => id !== u.id) : [...prev, u.id]))
                        }
                        className={`px-2 py-1 rounded-lg border text-left truncate transition-colors ${
                          isSel
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.name}
                      </button>
                    );
                  })}
                </div>
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

      {/* TASK DETAIL MODAL (with watchers + notes/comments) */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          onClose={() => setDetailTask(null)}
          canDelete={canDeleteTask(detailTask)}
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
  users: User[];
  onClose: () => void;
  canDelete: boolean;
  onDelete: () => void;
}> = ({ task, users, onClose, canDelete, onDelete }) => {
  const { currentUser, updateTaskStatus } = useApp();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [showAddWatcher, setShowAddWatcher] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<{ active: boolean; term: string; start: number }>({
    active: false,
    term: '',
    start: 0,
  });

  const loadWatchers = async () => {
    const { data } = await supabase.from('task_watchers').select('user_id, user_name').eq('task_id', task.id);
    if (data) setWatchers(data.map((r: any) => ({ userId: r.user_id, userName: r.user_name })));
  };

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
    loadWatchers();
    return () => {
      active = false;
    };
  }, [task.id]);

  const addWatcher = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    await supabase.from('task_watchers').insert({ task_id: task.id, user_id: userId, user_name: user.name });
    await loadWatchers();
    setShowAddWatcher(false);
  };

  const removeWatcher = async (userId: string) => {
    await supabase.from('task_watchers').delete().eq('task_id', task.id).eq('user_id', userId);
    setWatchers((prev) => prev.filter((w) => w.userId !== userId));
  };

  // Detect "@Name" mentions in the comment text and notify each mentioned user.
  const notifyMentions = async (commentText: string) => {
    const mentioned = users.filter((u) => u.id !== currentUser.id && commentText.includes(`@${u.name}`));
    if (mentioned.length === 0) return;
    const rows = mentioned.map((u) => ({
      id: `notif_${Date.now()}_${u.id}`,
      type: 'system',
      title: 'Você foi mencionado em uma tarefa',
      message: `${currentUser.name} mencionou você na tarefa "${task.title}".`,
      read: false,
      created_at: new Date().toISOString(),
      target_user_id: u.id,
    }));
    await supabase.from('notifications').insert(rows);
  };

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
    if (!error) {
      setComments((prev) => [...prev, comment]);
      await notifyMentions(comment.comment);
      setNewComment('');
    }
    setPosting(false);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);
    const cursor = e.target.selectionStart || value.length;
    const uptoCursor = value.slice(0, cursor);
    // Names in this app can contain spaces (e.g. "Teste Gerente"), so allow
    // spaces within the mention query — just cap its length.
    const match = uptoCursor.match(/@([^@]{0,30})$/);
    if (match) {
      setMentionQuery({ active: true, term: match[1].toLowerCase(), start: cursor - match[0].length });
    } else {
      setMentionQuery({ active: false, term: '', start: 0 });
    }
  };

  const applyMention = (userName: string) => {
    const before = newComment.slice(0, mentionQuery.start);
    const after = newComment.slice(mentionQuery.start + mentionQuery.term.length + 1);
    setNewComment(`${before}@${userName} ${after}`);
    setMentionQuery({ active: false, term: '', start: 0 });
  };

  const mentionCandidates = mentionQuery.active
    ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery.term)).slice(0, 5)
    : [];

  const nonWatcherUsers = users.filter(
    (u) => u.id !== task.assignedTo && !watchers.some((w) => w.userId === u.id)
  );

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

          {/* Watchers section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Acompanhando ({watchers.length})
              </h4>
              <button
                onClick={() => setShowAddWatcher((v) => !v)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {showAddWatcher && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                {nonWatcherUsers.length === 0 ? (
                  <span className="text-[11px] text-slate-400">Todos já estão acompanhando.</span>
                ) : (
                  nonWatcherUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addWatcher(u.id)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    >
                      + {u.name}
                    </button>
                  ))
                )}
              </div>
            )}

            {watchers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {watchers.map((w) => (
                  <span
                    key={w.userId}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 flex items-center gap-1"
                  >
                    {w.userName}
                    <button onClick={() => removeWatcher(w.userId)} className="hover:text-blue-950 dark:hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {canDelete && (
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

        <form onSubmit={handlePostComment} className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 relative">
          {mentionQuery.active && mentionCandidates.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {mentionCandidates.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => applyMention(u.name)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200"
                >
                  @{u.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Adicionar uma anotação... use @ para mencionar"
              className="flex-1 p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
