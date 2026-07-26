import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Store, Plus, Trash2, Edit2, X, ShieldAlert, Camera, Loader2 } from 'lucide-react';
import { uploadLogoImage, getLogoUrl } from '../lib/upload';

export const CadastrosView: React.FC = () => {
  const { companies, marketplaces, addCompany, updateCompany, deleteCompany, addMarketplace, updateMarketplace, deleteMarketplace, currentUser, getAccessToken } = useApp();
  const isAdmin = currentUser.role === 'admin';

  // Company Modal State
  const [compModal, setCompModal] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [compLogoBust, setCompLogoBust] = useState(0);
  const [compLogoUploading, setCompLogoUploading] = useState(false);
  const [compLogoError, setCompLogoError] = useState('');

  // Marketplace Modal State
  const [mktModal, setMktModal] = useState(false);
  const [editingMktId, setEditingMktId] = useState<string | null>(null);
  const [mktName, setMktName] = useState('');
  const [mktColor, setMktColor] = useState('#2563eb');
  const [mktLogoBust, setMktLogoBust] = useState(0);
  const [mktLogoUploading, setMktLogoUploading] = useState(false);
  const [mktLogoError, setMktLogoError] = useState('');

  // Track logos that failed to load (no image uploaded yet) so we fall back cleanly
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
  const markBroken = (key: string) =>
    setBrokenLogos((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const unmarkBroken = (key: string) =>
    setBrokenLogos((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const handleCompLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingCompId) return;
    setCompLogoUploading(true);
    setCompLogoError('');
    const result = await uploadLogoImage(file, `companies/${editingCompId}`, getAccessToken);
    setCompLogoUploading(false);
    if (result.error) {
      setCompLogoError(result.error);
      return;
    }
    unmarkBroken(`company:${editingCompId}`);
    setCompLogoBust((v) => v + 1);
  };

  const handleMktLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingMktId) return;
    setMktLogoUploading(true);
    setMktLogoError('');
    const result = await uploadLogoImage(file, `marketplaces/${editingMktId}`, getAccessToken);
    setMktLogoUploading(false);
    if (result.error) {
      setMktLogoError(result.error);
      return;
    }
    unmarkBroken(`marketplace:${editingMktId}`);
    setMktLogoBust((v) => v + 1);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-blue-800 mx-auto" />
        <h2 className="text-lg font-bold">Acesso Restrito</h2>
        <p className="text-xs text-slate-500">Apenas o Administrador pode acessar e alterar o cadastro de CNPJs e Marketplaces.</p>
      </div>
    );
  }

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompId) {
      updateCompany({ id: editingCompId, code, name, cnpj, status: 'active', badgeColor: 'bg-blue-600 text-white' });
    } else {
      addCompany({ code, name, cnpj, status: 'active', badgeColor: 'bg-blue-600 text-white' });
    }
    setCompModal(false);
  };

  const handleSaveMarketplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMktId) {
      updateMarketplace({ id: editingMktId, name: mktName, slug: mktName.toLowerCase().replace(/\s+/g, ''), color: mktColor, iconName: 'ShoppingBag', status: 'active' });
    } else {
      addMarketplace({ name: mktName, slug: mktName.toLowerCase().replace(/\s+/g, ''), color: mktColor, iconName: 'ShoppingBag', status: 'active' });
    }
    setMktModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* SECTION 1: CADASTRO DE CNPJS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Empresas & CNPJs Cadastrados ({companies.length})
            </h2>
          </div>

          <button
            onClick={() => {
              setEditingCompId(null);
              setCode('');
              setName('');
              setCnpj('');
              setCompLogoError('');
              setCompModal(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Adicionar CNPJ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((c) => (
            <div key={c.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                {!brokenLogos.has(`company:${c.id}`) && (
                  <img
                    src={`${getLogoUrl(`companies/${c.id}`)}?v=${compLogoBust}`}
                    alt={c.code}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    onError={() => markBroken(`company:${c.id}`)}
                  />
                )}
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${c.badgeColor}`}>
                    {c.code}
                  </span>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">{c.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{c.cnpj}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingCompId(c.id);
                    setCode(c.code);
                    setName(c.name);
                    setCnpj(c.cnpj);
                    setCompModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCompany(c.id)} className="p-1.5 text-slate-400 hover:text-blue-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CADASTRO DE MARKETPLACES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Marketplaces Integrados ({marketplaces.length})
            </h2>
          </div>

          <button
            onClick={() => {
              setEditingMktId(null);
              setMktName('');
              setMktColor('#10b981');
              setMktLogoError('');
              setMktModal(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Criar Novo Marketplace
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {marketplaces.map((m) => (
            <div key={m.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                {!brokenLogos.has(`marketplace:${m.id}`) ? (
                  <img
                    src={`${getLogoUrl(`marketplaces/${m.id}`)}?v=${mktLogoBust}`}
                    alt={m.name}
                    className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    onError={() => markBroken(`marketplace:${m.id}`)}
                  />
                ) : (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                )}
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{m.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingMktId(m.id);
                    setMktName(m.name);
                    setMktColor(m.color);
                    setMktModal(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-900"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMarketplace(m.id)} className="p-1 text-slate-400 hover:text-blue-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPANY MODAL */}
      {compModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm">{editingCompId ? 'Editar CNPJ' : 'Cadastrar CNPJ'}</h3>
              <button onClick={() => setCompModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              {editingCompId ? (
                <div className="flex items-center gap-3">
                  {!brokenLogos.has(`company:${editingCompId}`) ? (
                    <img
                      src={`${getLogoUrl(`companies/${editingCompId}`)}?v=${compLogoBust}`}
                      alt={code}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      onError={() => markBroken(`company:${editingCompId}`)}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black uppercase ${'bg-blue-600 text-white'}`}>
                      {code || '?'}
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      {compLogoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>{compLogoUploading ? 'Enviando...' : 'Trocar Logotipo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCompLogoUpload} disabled={compLogoUploading} />
                    </label>
                    {compLogoError && <p className="text-blue-600 text-[11px] font-semibold mt-1">{compLogoError}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Salve o CNPJ primeiro para poder adicionar um logotipo.</p>
              )}

              <div>
                <label className="block font-bold mb-1">Código Identificador (Ex: ER2, MD)</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-bold mb-1">Razão Social / Nome Fantasia</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-bold mb-1">CNPJ Formatado</label>
                <input type="text" required value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="w-full p-2 border rounded-lg font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setCompModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Salvar CNPJ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARKETPLACE MODAL */}
      {mktModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm">{editingMktId ? 'Editar Marketplace' : 'Novo Marketplace'}</h3>
              <button onClick={() => setMktModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveMarketplace} className="space-y-3 text-xs">
              {editingMktId ? (
                <div className="flex items-center gap-3">
                  {!brokenLogos.has(`marketplace:${editingMktId}`) ? (
                    <img
                      src={`${getLogoUrl(`marketplaces/${editingMktId}`)}?v=${mktLogoBust}`}
                      alt={mktName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      onError={() => markBroken(`marketplace:${editingMktId}`)}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: mktColor }}>
                      <Store className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      {mktLogoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      <span>{mktLogoUploading ? 'Enviando...' : 'Trocar Logotipo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleMktLogoUpload} disabled={mktLogoUploading} />
                    </label>
                    {mktLogoError && <p className="text-blue-600 text-[11px] font-semibold mt-1">{mktLogoError}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Salve o marketplace primeiro para poder adicionar um logotipo.</p>
              )}

              <div>
                <label className="block font-bold mb-1">Nome da Plataforma</label>
                <input type="text" required value={mktName} onChange={(e) => setMktName(e.target.value)} placeholder="Ex: TikTok Shop" className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block font-bold mb-1">Cor do Badge</label>
                <input type="color" value={mktColor} onChange={(e) => setMktColor(e.target.value)} className="w-full h-10 p-1 border rounded-lg cursor-pointer" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setMktModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Salvar Marketplace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
