import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { formatDateBR } from '../utils/formatters';
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
} from 'lucide-react';

const COLUMNS: { status: Task['status']; label: string }[] = [
  { status: 'pending', label: 'Pendente' },
  { status: 'in_progress', label: 'Em Andamento' },
  { status: 'done', label: 'Concluída' },
];

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

export const TasksView: React.FC = () => {
  const { tasks, users, currentUser, addTask, updateTaskStatus, deleteTask } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(users[0]?.id || '');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);

  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.assignedTo === currentUser.id);

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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Gestão de Tarefas ({visibleTasks.length})
          </h2>
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
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">{task.title}</h4>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(task)}
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
                            onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex((c) => c.status === col.status) - 1].status)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Mover para trás"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {col.status !== 'done' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex((c) => c.status === col.status) + 1].status)}
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
