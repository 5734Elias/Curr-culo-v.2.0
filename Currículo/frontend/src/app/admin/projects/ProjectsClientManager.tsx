'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AdminProjectRecord } from '@/services/cmsDataService';
import {
  FolderGit2,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Upload,
} from 'lucide-react';

interface Props {
  initialProjects: AdminProjectRecord[];
  databaseConnected: boolean;
}

export function ProjectsClientManager({ initialProjects, databaseConnected }: Props) {
  const [projects, setProjects] = useState<AdminProjectRecord[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProjectRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessUrl, setUploadSuccessUrl] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    summary: '',
    context: '',
    problem: '',
    solution: '',
    architecture: '',
    technologies: '',
    securityControls: '',
    testing: '',
    outcomes: '',
    links: '',
    displayOrder: 0,
    published: true,
  });

  // Filtragem Dinâmica
  const filteredList = useMemo(() => {
    return projects.filter((proj) => {
      if (selectedStatus === 'published' && !proj.published) return false;
      if (selectedStatus === 'draft' && proj.published) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = proj.title.toLowerCase().includes(q);
        const matchesSummary = proj.summary.toLowerCase().includes(q);
        const matchesSlug = proj.slug.toLowerCase().includes(q);
        const matchesTech = proj.technologies.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesSlug && !matchesTech) return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedStatus]);

  // Estatísticas
  const publishedCount = useMemo(() => {
    return projects.filter((p) => p.published).length;
  }, [projects]);

  const draftCount = projects.length - publishedCount;

  const totalSecurityControls = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.securityControls?.length || 0), 0);
  }, [projects]);

  // Abertura do Modal de Criação
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setUploadSuccessUrl(null);
    setFormData({
      slug: '',
      title: '',
      summary: '',
      context: '',
      problem: '',
      solution: '',
      architecture: '',
      technologies: '',
      securityControls: '',
      testing: '',
      outcomes: '',
      links: 'Repositório GitHub|https://github.com/5734Elias',
      displayOrder: projects.length,
      published: true,
    });
    setIsModalOpen(true);
  };

  // Abertura do Modal de Edição
  const handleOpenEditModal = (proj: AdminProjectRecord) => {
    setEditingProject(proj);
    setUploadSuccessUrl(null);
    setFormData({
      slug: proj.slug,
      title: proj.title,
      summary: proj.summary,
      context: proj.context,
      problem: proj.problem,
      solution: proj.solution,
      architecture: (proj.architecture || []).join('\n'),
      technologies: (proj.technologies || []).join(', '),
      securityControls: (proj.securityControls || []).join('\n'),
      testing: (proj.testing || []).join('\n'),
      outcomes: (proj.outcomes || [])
        .map((o) => `${o.label}|${o.value}${o.verified ? '|verified' : ''}`)
        .join('\n'),
      links: (proj.links || []).map((l) => `${l.label}|${l.url}`).join('\n'),
      displayOrder: proj.displayOrder,
      published: proj.published,
    });
    setIsModalOpen(true);
  };

  // Alternar Publicado / Rascunho
  const handleTogglePublish = async (proj: AdminProjectRecord) => {
    const newStatus = !proj.published;
    try {
      const res = await fetch(`/api/admin/projects/${proj.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao alternar status do projeto.');

      setProjects((prev) =>
        prev.map((p) => (p.id === proj.id ? { ...p, published: newStatus } : p))
      );
      setFeedbackMessage({
        type: 'success',
        text: `Projeto "${proj.title}" alterado para ${newStatus ? 'Publicado' : 'Rascunho'}.`,
      });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Não foi possível alterar o status de publicação.' });
    }
  };

  // Excluir Projeto
  const handleDelete = async (proj: AdminProjectRecord) => {
    if (!window.confirm(`Tem certeza que deseja excluir o estudo de caso "${proj.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/projects/${proj.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao excluir o projeto.');

      setProjects((prev) => prev.filter((p) => p.id !== proj.id));
      setFeedbackMessage({ type: 'success', text: `Projeto "${proj.title}" excluído com sucesso.` });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Falha ao excluir o projeto.' });
    }
  };

  // Upload de Mídia / Ativo Seguro
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessUrl(null);

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha no envio do arquivo.');

      setUploadSuccessUrl(json.asset.url);
      setFeedbackMessage({
        type: 'success',
        text: `Arquivo "${file.name}" validado e enviado com sucesso! URL: ${json.asset.url}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar arquivo.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
    }
  };

  // Salvar Formulário (Criar ou Atualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const techArray = formData.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const archArray = formData.architecture
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const secArray = formData.securityControls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const testArray = formData.testing
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const outcomesArray = formData.outcomes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|');
        return {
          label: parts[0]?.trim() || 'Resultado',
          value: parts[1]?.trim() || line,
          verified: parts[2]?.trim() === 'verified',
        };
      });

    const linksArray = formData.links
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|');
        return {
          label: parts[0]?.trim() || 'Link',
          url: parts[1]?.trim() || parts[0]?.trim() || 'https://github.com/5734Elias',
        };
      });

    const payload = {
      slug: formData.slug.trim().toLowerCase(),
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      context: formData.context.trim(),
      problem: formData.problem.trim(),
      solution: formData.solution.trim(),
      architecture: archArray,
      technologies: techArray,
      securityControls: secArray,
      testing: testArray,
      outcomes: outcomesArray,
      links: linksArray,
      displayOrder: Number(formData.displayOrder) || 0,
      published: formData.published,
    };

    try {
      if (editingProject) {
        // Atualização via PUT
        const res = await fetch(`/api/admin/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar projeto.');

        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? data.project : p))
        );
        setFeedbackMessage({ type: 'success', text: 'Projeto atualizado com sucesso!' });
      } else {
        // Criação via POST
        const res = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar projeto.');

        setProjects((prev) => [data.project, ...prev]);
        setFeedbackMessage({ type: 'success', text: 'Novo projeto cadastrado com sucesso!' });
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
      {/* Alerta de Modo Resiliente */}
      {!databaseConnected && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold">Modo de Visualização Resiliente:</span> O banco de dados PostgreSQL
            está desconectado no ambiente local. Os 4 estudos de caso exibidos refletem os projetos homologados com
            arquitetura, tecnologias e controles de segurança íntegros.
          </div>
        </div>
      )}

      {/* Banner de Feedback (Sucesso / Erro) */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-lg border p-4 text-sm transition-all ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
              : 'border-red-500/30 bg-red-950/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-400 hover:text-zinc-200"
            aria-label="Fechar mensagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cabeçalho da Página e Botão de Ação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Gestão de Projetos e Estudos de Caso
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Gerenciamento das soluções arquiteturais, salvaguardas de segurança, métricas e links públicos.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Estudos de Caso</span>
            <FolderGit2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100">{projects.length}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Projetos estruturados</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Publicados</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{publishedCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">No portfólio público</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rascunhos</span>
            <EyeOff className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{draftCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Ocultos de visitantes</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Salvaguardas</span>
            <Shield className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400">{totalSecurityControls}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Controles de segurança</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por título, resumo, tecnologia ou slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Apenas Publicados</option>
            <option value="draft">Apenas Rascunhos</option>
          </select>
        </div>
      </div>

      {/* Lista de Projetos (Cards Ricos e Detalhados) */}
      <div className="grid grid-cols-1 gap-4">
        {filteredList.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-zinc-500">
            <FolderGit2 className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            Nenhum projeto encontrado para o filtro selecionado.
          </div>
        ) : (
          filteredList.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/60"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      /{project.slug}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        project.published
                          ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                          : 'border border-amber-500/30 bg-amber-950/40 text-amber-300'
                      }`}
                    >
                      {project.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{project.published ? 'Publicado' : 'Rascunho'}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-100">{project.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{project.summary}</p>

                  {/* Tecnologias */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.technologies.slice(0, 7).map((tech) => (
                      <span
                        key={tech}
                        className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 7 && (
                      <span className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-500">
                        +{project.technologies.length - 7}
                      </span>
                    )}
                  </div>

                  {/* Metadados Técnicos */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-zinc-400" />
                      {project.architecture?.length || 0} camadas de arquitetura
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-cyan-400" />
                      {project.securityControls?.length || 0} salvaguardas de segurança
                    </span>
                    <span>Ordem: {project.displayOrder}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <Link
                    href={`/projetos/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                    title="Ver página pública do projeto"
                  >
                    <span>Ver Estudo</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    onClick={() => handleTogglePublish(project)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      project.published
                        ? 'text-emerald-400 hover:bg-zinc-800'
                        : 'text-amber-400 hover:bg-zinc-800'
                    }`}
                    title={project.published ? 'Ocultar do público' : 'Publicar no site'}
                  >
                    {project.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(project)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400"
                    title="Editar estudo de caso"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(project)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    title="Excluir estudo de caso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação / Edição de Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  {editingProject ? 'Editar Estudo de Caso' : 'Cadastrar Novo Projeto'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Slug da URL * (letras, números, hífens)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: meu-projeto-ia"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Título do Projeto / Solução *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sistema Agente de IA com Microsoft AI Foundry e Google Antigravity"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Resumo Executivo * (máx. 400 caracteres)
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={400}
                  placeholder="Breve descrição dos objetivos e resultados de negócio alcançados."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Contexto *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Cenário e motivação..."
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Problema *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Gargalos e desafios enfrentados..."
                    value={formData.problem}
                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Solução Desenvolvida *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Abordagem técnica adotada..."
                    value={formData.solution}
                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Tecnologias Utilizadas * (separadas por vírgula)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Python, TypeScript, Next.js, Docker, Fortinet, AWS"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Arquitetura e Componentes (1 item por linha)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Frontend: Next.js App Router&#10;Backend: Microsserviço Python&#10;Banco: PostgreSQL"
                    value={formData.architecture}
                    onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Salvaguardas e Controles de Segurança (1 item por linha)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Autenticação Zero Trust via Google OIDC&#10;Sanitização contra XSS e Prompt Injection&#10;Fail-closed no Rate Limiter"
                    value={formData.securityControls}
                    onChange={(e) => setFormData({ ...formData, securityControls: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-cyan-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Resultados e Métricas (Formato: Rótulo|Valor|verified)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Latência|Redução de 45% com caching|verified&#10;Fidelidade|Zero alucinações em produção"
                    value={formData.outcomes}
                    onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Links Relacionados (Formato: Rótulo|URL)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Repositório GitHub|https://github.com/5734Elias&#10;Artigo Técnico|https://linkedin.com"
                    value={formData.links}
                    onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Seção de Upload Seguro de Mídia */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Upload Seguro de Imagens / Documentos (Máx 5MB: PDF, PNG, JPG, WebP)
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-zinc-200 hover:file:bg-zinc-700"
                  />
                  {isUploading && <span className="text-xs text-cyan-400 animate-pulse">Validando Magic Bytes e enviando...</span>}
                  {uploadSuccessUrl && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {uploadSuccessUrl}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="project-published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="project-published" className="text-sm text-zinc-200">
                  Publicar imediatamente no portfólio público (/projetos e /projetos/{formData.slug || '[slug]'})
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting && <Upload className="h-4 w-4 animate-spin" />}
                  <span>{editingProject ? 'Salvar Alterações' : 'Criar Estudo de Caso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
