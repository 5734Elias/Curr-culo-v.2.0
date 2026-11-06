'use client';

import React, { useState, useMemo } from 'react';
import { AdminCertificateRecord } from '@/services/cmsDataService';
import {
  Award,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

interface Props {
  initialCertificates: AdminCertificateRecord[];
  databaseConnected: boolean;
}

const CATEGORIES = [
  { value: 'todos', label: 'Todas as Categorias' },
  { value: 'desenvolvimento', label: 'Desenvolvimento' },
  { value: 'dados', label: 'Dados' },
  { value: 'ia', label: 'Inteligência Artificial' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'outros', label: 'Outros' },
];

const GROUPS = [
  { value: 'todos', label: 'Todas as Instituições' },
  { value: 'senai', label: 'SENAI' },
  { value: 'ka-solution', label: 'Ka Solution' },
  { value: 'fundacao-bradesco', label: 'Fundação Bradesco' },
  { value: 'outras', label: 'Outras Instituições' },
];

export function CertificatesClientManager({ initialCertificates, databaseConnected }: Props) {
  const [certificates, setCertificates] = useState<AdminCertificateRecord[]>(initialCertificates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<AdminCertificateRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    institutionGroup: 'outras',
    category: 'desenvolvimento',
    workloadHours: '',
    technologyProvider: '',
    issuerPriority: 'standard',
    credentialType: 'curso',
    skills: '',
    credentialCode: '',
    verificationUrl: '',
    credentialAssetUrl: '',
    published: true,
  });
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Filtragem Dinâmica
  const filteredList = useMemo(() => {
    return certificates.filter((cert) => {
      if (selectedGroup !== 'todos' && cert.institutionGroup !== selectedGroup) return false;
      if (selectedCategory !== 'todos' && cert.category !== selectedCategory) return false;
      if (selectedStatus === 'published' && !cert.published) return false;
      if (selectedStatus === 'draft' && cert.published) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = cert.title.toLowerCase().includes(q);
        const matchesInst = cert.institution.toLowerCase().includes(q);
        const matchesTech = cert.technologyProvider?.toLowerCase().includes(q) ?? false;
        const matchesSkills = cert.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesInst && !matchesTech && !matchesSkills) return false;
      }

      return true;
    });
  }, [certificates, searchQuery, selectedGroup, selectedCategory, selectedStatus]);

  // Estatísticas Rápidas
  const totalHours = useMemo(() => {
    return certificates.reduce((acc, c) => acc + (c.workloadHours ?? 0), 0);
  }, [certificates]);

  const publishedCount = useMemo(() => {
    return certificates.filter((c) => c.published).length;
  }, [certificates]);

  const draftCount = certificates.length - publishedCount;

  // Abertura do Modal de Criação / Edição
  const handleOpenCreateModal = () => {
    setEditingCert(null);
    setFormData({
      title: '',
      institution: '',
      institutionGroup: 'outras',
      category: 'desenvolvimento',
      workloadHours: '',
      technologyProvider: '',
      issuerPriority: 'standard',
      credentialType: 'curso',
      skills: '',
      credentialCode: '',
      verificationUrl: '',
      credentialAssetUrl: '',
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cert: AdminCertificateRecord) => {
    setEditingCert(cert);
    setFormData({
      title: cert.title,
      institution: cert.institution,
      institutionGroup: cert.institutionGroup,
      category: cert.category,
      workloadHours: cert.workloadHours ? String(cert.workloadHours) : '',
      technologyProvider: cert.technologyProvider || '',
      issuerPriority: cert.issuerPriority,
      credentialType: cert.credentialType,
      skills: cert.skills.join(', '),
      credentialCode: cert.credentialCode || '',
      verificationUrl: cert.verificationUrl || '',
      credentialAssetUrl: cert.credentialAssetUrl || '',
      published: cert.published,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setFeedbackMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('isPublic', String(formData.published));

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data?.asset?.url) {
        throw new Error(data.error || 'Falha ao enviar arquivo.');
      }

      setFormData((prev) => ({
        ...prev,
        credentialAssetUrl: data.asset.url,
      }));
      setFeedbackMessage({
        type: 'success',
        text: `Comprovante "${data.asset.fileName}" gravado e verificado com sucesso!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar comprovante.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Alternar Publicado / Rascunho
  const handleTogglePublish = async (cert: AdminCertificateRecord) => {
    const newStatus = !cert.published;
    try {
      const res = await fetch(`/api/admin/certificates/${cert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status.');

      setCertificates((prev) =>
        prev.map((c) => (c.id === cert.id ? { ...c, published: newStatus } : c))
      );
      setFeedbackMessage({
        type: 'success',
        text: `Certificado "${cert.title}" alterado para ${newStatus ? 'Publicado' : 'Rascunho'}.`,
      });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Não foi possível alterar o status de publicação.' });
    }
  };

  // Excluir Certificado
  const handleDelete = async (cert: AdminCertificateRecord) => {
    if (!window.confirm(`Tem certeza que deseja excluir o curso "${cert.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/certificates/${cert.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao excluir certificado.');

      setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
      setFeedbackMessage({ type: 'success', text: `Certificado "${cert.title}" excluído com sucesso.` });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Falha ao excluir o certificado.' });
    }
  };

  // Salvar Formulário (Criar ou Atualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      institution: formData.institution.trim(),
      institutionGroup: formData.institutionGroup,
      category: formData.category,
      workloadHours: formData.workloadHours ? Number(formData.workloadHours) : undefined,
      technologyProvider: formData.technologyProvider.trim() || undefined,
      issuerPriority: formData.issuerPriority,
      credentialType: formData.credentialType,
      skills: skillsArray,
      credentialCode: formData.credentialCode.trim() || undefined,
      verificationUrl: formData.verificationUrl.trim() || undefined,
      credentialAssetUrl: formData.credentialAssetUrl.trim() || undefined,
      published: formData.published,
    };

    try {
      if (editingCert) {
        // Atualização via PUT
        const res = await fetch(`/api/admin/certificates/${editingCert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar.');

        setCertificates((prev) =>
          prev.map((c) => (c.id === editingCert.id ? data.certificate : c))
        );
        setFeedbackMessage({ type: 'success', text: 'Certificado atualizado com sucesso!' });
      } else {
        // Criação via POST
        const res = await fetch('/api/admin/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar.');

        setCertificates((prev) => [data.certificate, ...prev]);
        setFeedbackMessage({ type: 'success', text: 'Novo certificado cadastrado com sucesso!' });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar formulário.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Feedback */}
      {feedbackMessage && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
              : 'border-red-500/30 bg-red-950/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>PAINEL ADMINISTRATIVO</span>
            <span>{'//'}</span>
            <span>GESTÃO DE CERTIFICADOS</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">
            Certificados & Cursos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie o acervo de cursos profissionais, carga horária e publicação imediata no portfólio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs">
            <span className={`inline-block h-2 w-2 rounded-full ${databaseConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="font-mono text-zinc-400">
              {databaseConnected ? 'PostgreSQL Conectado' : 'Modo Resiliente'}
            </span>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-950/50 transition-all hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Certificado</span>
          </button>
        </div>
      </div>

      {/* Cartões de Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-[11px] font-medium uppercase text-zinc-400">Total</span>
          <p className="mt-1 text-2xl font-bold text-white">{certificates.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-[11px] font-medium uppercase text-cyan-400">Carga Horária</span>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{totalHours.toLocaleString('pt-BR')}h</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-[11px] font-medium uppercase text-emerald-400">Publicados</span>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-[11px] font-medium uppercase text-amber-400">Rascunhos</span>
          <p className="mt-1 text-2xl font-bold text-amber-300">{draftCount}</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por curso, instituição ou habilidade..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Filtro por Instituição */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
        >
          {GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>

        {/* Filtro por Categoria */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Filtro por Status de Publicação */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">Todos os Status</option>
          <option value="published">Apenas Publicados</option>
          <option value="draft">Apenas Rascunhos</option>
        </select>
      </div>

      {/* Listagem / Tabela de Certificados */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Curso / Certificado</th>
                <th className="px-4 py-3 font-medium">Instituição</th>
                <th className="px-4 py-3 font-medium">Carga</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Nenhum certificado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((cert) => (
                  <tr key={cert.id} className="transition-colors hover:bg-zinc-900/60">
                    {/* Título e Habilidades */}
                    <td className="px-4 py-3.5 max-w-xs md:max-w-sm">
                      <div className="font-semibold text-white">{cert.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {cert.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
                          >
                            {skill}
                          </span>
                        ))}
                        {cert.skills.length > 3 && (
                          <span className="text-[10px] text-zinc-500">
                            +{cert.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Instituição */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-300">
                      <div>{cert.institution}</div>
                      {cert.technologyProvider && (
                        <span className="font-mono text-[10px] text-cyan-400">
                          {cert.technologyProvider}
                        </span>
                      )}
                    </td>

                    {/* Carga Horária */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-zinc-200">
                      {cert.workloadHours ? `${cert.workloadHours}h` : '—'}
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[11px] capitalize text-zinc-300">
                        {cert.category}
                      </span>
                    </td>

                    {/* Status de Publicação */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(cert)}
                        title="Clique para alternar status de publicação"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                          cert.published
                            ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                            : 'border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {cert.published ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Publicado</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Rascunho</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(cert)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400"
                          title="Editar Certificado"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-950/50 hover:text-red-400"
                          title="Excluir Certificado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/50 text-cyan-400">
                  <Award className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingCert ? 'Editar Certificado' : 'Cadastrar Novo Certificado'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Título do Curso */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Título do Curso / Certificado *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Formação Especializada em Cibersegurança e Redes"
                  className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Grid: Instituição e Grupo */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Instituição Emissora *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="Ex: SENAI, Ka Solution, Fundação Bradesco"
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Grupo Institucional
                  </label>
                  <select
                    value={formData.institutionGroup}
                    onChange={(e) => setFormData({ ...formData, institutionGroup: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="senai">SENAI</option>
                    <option value="ka-solution">Ka Solution</option>
                    <option value="fundacao-bradesco">Fundação Bradesco</option>
                    <option value="outras">Outras Instituições</option>
                  </select>
                </div>
              </div>

              {/* Grid: Categoria e Carga Horária */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="desenvolvimento">Desenvolvimento</option>
                    <option value="dados">Dados</option>
                    <option value="ia">Inteligência Artificial</option>
                    <option value="cloud">Cloud</option>
                    <option value="seguranca">Segurança</option>
                    <option value="infraestrutura">Infraestrutura</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Carga Horária (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formData.workloadHours}
                    onChange={(e) => setFormData({ ...formData, workloadHours: e.target.value })}
                    placeholder="Ex: 40 ou 120"
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Habilidades Associadas */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Habilidades & Tecnologias (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Ex: React, TypeScript, Cibersegurança, PostgreSQL"
                  className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Grid: Código de Verificação e URL */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Código da Credencial (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.credentialCode}
                    onChange={(e) => setFormData({ ...formData, credentialCode: e.target.value })}
                    placeholder="Ex: CERT-2026-98741"
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    URL de Verificação Externa (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.verificationUrl}
                    onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                    placeholder="https://..."
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload de Comprovante PDF / Imagem */}
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Comprovante do Certificado (PDF, PNG, JPEG ou WebP — máx. 5 MB)
                </label>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-950 file:px-3 file:py-1 file:text-xs file:font-medium file:text-cyan-300 hover:file:bg-cyan-900"
                  />
                  {formData.credentialAssetUrl && (
                    <span className="truncate font-mono text-[11px] text-emerald-400">
                      Gravado: {formData.credentialAssetUrl}
                    </span>
                  )}
                </div>
              </div>

              {/* Publicar Imediatamente */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedCheck"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="publishedCheck" className="text-sm font-medium text-zinc-300">
                  Publicar imediatamente no portfólio público
                </label>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingCert ? 'Salvar Alterações' : 'Cadastrar Certificado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
