import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Permissions, getPermissions } from '../lib/permissions';
import { ShieldAlert, ShieldCheck, Plus, Edit2, Trash2, X, Check, Lock, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const PERMISSION_FIELDS: { key: keyof Permissions; label: string }[] = [
  { key: 'registerSales', label: 'Registrar Vendas' },
  { key: 'registerSalesUnrestricted', label: 'Ver Todos os Canais/CNPJs (sem restrição)' },
  { key: 'approveSales', label: 'Aprovar Vendas' },
  { key: 'manageGoals', label: 'Gerenciar Metas' },
  { key: 'viewTeamStatus', label: 'Ver Status Lançamento da Equipe' },
  { key: 'viewAudit', label: 'Ver Auditoria & Logs' },
  { key: 'manageUsers', label: 'Gerenciar Usuários' },
  { key: 'manageCadastros', label: 'Gerenciar Cadastros (CNPJs & Marketplaces)' },
  { key: 'technicalSettings', label: 'Configurações Técnicas' },
];

const EMPTY_PERMISSIONS: Permissions = {
  registerSales: false,
  registerSalesUnrestricted: false,
  approveSales: false,
  manageGoals: false,
  viewTeamStatus: false,
  viewAudit: false,
  manageUsers: false,
  manageCadastros: false,
  technicalSettings: false,
  manageProfiles: false,
};

export const ProfilesView: React.FC = () => {
  const { roles, currentUser, addRole, updateRole, deleteRole } = useApp();
  const isAdmin = getPermissions(currentUser.role).manageProfiles;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [label, setLabel] = useState('');
  const [perms, setPerms] = useState<Permissions>(EMPTY_PERMISSIONS);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-blue-800 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Restrito</h2>
        <p className="text-xs text-slate-500">Apenas o Administrador pode gerenciar perfis de acesso.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingRole(null);
    setLabel('');
    setPerms(EMPTY_PERMISSIONS);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditingRole(r);
    setLabel(r.label);
    setPerms(r.permissions);
    setFormError('');
    setModalOpen(true);
  };

  const togglePerm = (key: keyof Permissions) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setFormError('Informe um nome para o perfil.');
      return;
    }
    if (editingRole) {
      updateRole({ ...editingRole, label: label.trim(), permissions: { ...perms, manageProfiles: editingRole.permissions.manageProfiles } });
    } else {
      addRole({ label: label.trim(), permissions: { ...perms, manageProfiles: false } });
    }
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setDeletingId(id);
    const result = await deleteRole(id);
    setDeletingId(null);
    if (!result.success) {
      setDeleteError(result.message || 'Erro ao excluir perfil.');
      setTimeout(() => setDeleteError(''), 5000);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Perfis de Acesso ({roles.length})
          </h2>
        </div>

        <button
          onClick={openCreate}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Perfil
        </button>
      </div>

      {deleteError && (
        <div className="p-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                {r.isProtected && <Lock className="w-3 h-3" />}
                {r.label}
              </span>

              {!r.isProtected && (
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-blue-900">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    disabled={deletingId === r.id}
                    className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {PERMISSION_FIELDS.filter((f) => r.permissions[f.key]).map((f) => (
                <span key={f.key} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-blue-600" /> {f.label}
                </span>
              ))}
              {PERMISSION_FIELDS.every((f) => !r.permissions[f.key]) && (
                <span className="text-[11px] text-slate-400 italic">Nenhuma permissão concedida</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ROLE CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 sticky -top-6 -mt-6 pt-6 -mx-6 px-6 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingRole ? 'Editar Perfil' : 'Novo Perfil'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Perfil *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Supervisor"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">O que este perfil pode fazer:</label>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  {PERMISSION_FIELDS.map((f) => {
                    const isSel = perms[f.key];
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => togglePerm(f.key)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isSel
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{f.label}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors">
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Excluir Perfil"
        message={`Tem certeza que deseja excluir o perfil "${deleteTarget?.label}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
