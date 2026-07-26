import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { Users, Plus, Edit2, Trash2, ShieldAlert, Check, X, Store, Building2, KeyRound, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { uploadLogoImage } from '../lib/upload';

export const UsersView: React.FC = () => {
  const { users, marketplaces, companies, addUser, updateUser, deleteUser, currentUser, getAccessToken } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [assignedMarketplaces, setAssignedMarketplaces] = useState<string[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Password modal for specific user
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-blue-800 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Restrito</h2>
        <p className="text-xs text-slate-500">Apenas o Administrador pode gerenciar usuários e definir permissões de marketplaces.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setAssignedMarketplaces(['shopee']);
    setAssignedCompanies([]);
    setAvatarUrl('');
    setAvatarError('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setAssignedMarketplaces(u.assignedMarketplaces || []);
    setAssignedCompanies(u.assignedCompanies || []);
    setAvatarUrl(u.avatar || '');
    setAvatarError('');
    setFormError('');
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingUser) return;
    setAvatarUploading(true);
    setAvatarError('');
    const result = await uploadLogoImage(file, `avatars/${editingUser.id}`, getAccessToken);
    setAvatarUploading(false);
    if (result.error) {
      setAvatarError(result.error);
      return;
    }
    setAvatarUrl(result.url || '');
  };

  const openChangePasswordForUser = (u: User) => {
    setPasswordTargetUser(u);
    setChangePasswordModalOpen(true);
  };

  const toggleMarketplaceSelection = (mktId: string) => {
    setAssignedMarketplaces((prev) =>
      prev.includes(mktId) ? prev.filter((id) => id !== mktId) : [...prev, mktId]
    );
  };

  const toggleCompanySelection = (companyCode: string) => {
    setAssignedCompanies((prev) =>
      prev.includes(companyCode) ? prev.filter((code) => code !== companyCode) : [...prev, companyCode]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    const result = editingUser
      ? await updateUser({
          ...editingUser,
          name,
          email,
          role,
          assignedMarketplaces,
          assignedCompanies,
          avatar: avatarUrl || undefined,
          ...(password ? { password } : {}),
        })
      : await addUser({
          name,
          email,
          role,
          assignedMarketplaces,
          assignedCompanies,
          status: 'active',
          password,
        });

    setIsSaving(false);

    if (!result.success) {
      setFormError(result.message || 'Erro ao salvar usuário.');
      return;
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;
    setDeletingId(id);
    const result = await deleteUser(id);
    setDeletingId(null);
    if (!result.success) {
      alert(result.message || 'Erro ao excluir usuário.');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Gestão de Usuários e Senhas ({users.length})
          </h2>
        </div>

        <button
          onClick={openCreate}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                  u.role === 'admin'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {u.role.toUpperCase()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openChangePasswordForUser(u)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Trocar Senha Deste Usuário"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(u)}
                  className="p-1 text-slate-400 hover:text-blue-900"
                  title="Editar Dados do Usuário"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-50"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.name}</h3>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Store className="w-3 h-3 text-blue-500" /> Marketplaces Liberados:
              </span>

              <div className="flex flex-wrap gap-1">
                {u.role === 'admin' ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Todos os Canais (Acesso Total)</span>
                ) : (
                  u.assignedMarketplaces.map((mId) => {
                    const mObj = marketplaces.find((item) => item.id === mId || item.slug === mId);
                    return (
                      <span key={mId} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        {mObj ? mObj.name : mId}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" /> CNPJs Sob Responsabilidade:
              </span>

              <div className="flex flex-wrap gap-1">
                {u.role === 'admin' ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Todos os CNPJs (Acesso Total)</span>
                ) : (u.assignedCompanies || []).length === 0 ? (
                  <span className="text-xs text-slate-400 font-medium">Nenhum CNPJ atribuído</span>
                ) : (
                  (u.assignedCompanies || []).map((cId) => {
                    const cObj = companies.find((item) => item.id === cId || item.code === cId);
                    return (
                      <span key={cId} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        {cObj ? cObj.code : cId}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* USER CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 sticky -top-6 -mt-6 pt-6 -mx-6 px-6 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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

              {editingUser ? (
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>{avatarUploading ? 'Enviando...' : 'Trocar Foto'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                    </label>
                    {avatarError && <p className="text-blue-600 text-[11px] font-semibold mt-1">{avatarError}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Salve o usuário primeiro para poder adicionar uma foto.</p>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Senha de Acesso {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nível de Acesso (Função) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="user">Usuário Operacional (Acesso Limitado)</option>
                  <option value="admin">Administrador (Acesso Total)</option>
                </select>
              </div>

              {role === 'user' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Selecione os Marketplaces Autorizados:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    {marketplaces.map((m) => {
                      const isSel = assignedMarketplaces.includes(m.id) || assignedMarketplaces.includes(m.slug);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMarketplaceSelection(m.id)}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                            isSel
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {role === 'user' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Selecione os CNPJs Sob Responsabilidade:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    {companies.map((c) => {
                      const isSel = assignedCompanies.includes(c.id) || assignedCompanies.includes(c.code);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCompanySelection(c.code)}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                            isSel
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-bold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{c.code} - {c.name}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 sticky -bottom-6 -mb-6 pb-6 -mx-6 px-6 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        targetUser={passwordTargetUser}
      />
    </div>
  );
};

