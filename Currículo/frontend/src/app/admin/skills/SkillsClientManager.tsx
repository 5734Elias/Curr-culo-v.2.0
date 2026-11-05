'use client';

import React, { useState, useMemo } from 'react';
import { AdminSkillRecord } from '@/services/cmsDataService';
import {
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Layers,
  Award,
} from 'lucide-react';

interface Props {
  initialSkills: AdminSkillRecord[];
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

const PROFICIENCY_LEVELS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'especialista', label: 'Especialista' },
];

export function SkillsClientManager({ initialSkills, databaseConnected }: Props) {
  const [skills, setSkills] = useState<AdminSkillRecord[]>(initialSkills);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AdminSkillRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'desenvolvimento',
    proficiencyLevel: 'avancado',
    description: '',
    iconName: '',
    displayOrder: 0,
    published: true,
  });

  // Filtragem Dinâmica
  const filteredList = useMemo(() => {
    return skills.filter((skill) => {
      if (selectedCategory !== 'todos' && skill.category !== selectedCategory) return false;
      if (selectedStatus === 'published' && !skill.published) return false;
      if (selectedStatus === 'draft' && skill.published) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = skill.name.toLowerCase().includes(q);
        const matchesDesc = skill.description?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [skills, searchQuery, selectedCategory, selectedStatus]);

  // Estatísticas Rápidas
  const publishedCount = useMemo(() => {
    return skills.filter((s) => s.published).length;
  }, [skills]);

  const draftCount = skills.length - publishedCount;

  const totalCategories = useMemo(() => {
    return new Set(skills.map((s) => s.category)).size;
  }, [skills]);

  // Abertura do Modal de Criação / Edição
  const handleOpenCreateModal = () => {
    setEditingSkill(null);
    setFormData({
      name: '',
      category: 'desenvolvimento',
      proficiencyLevel: 'avancado',
      description: '',
      iconName: '',
      displayOrder: 0,
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (skill: AdminSkillRecord) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiencyLevel: skill.proficiencyLevel || 'avancado',
      description: skill.description || '',
      iconName: skill.iconName || '',
      displayOrder: skill.displayOrder,
      published: skill.published,
    });
    setIsModalOpen(true);
  };

  // Alternar Publicado / Rascunho
  const handleTogglePublish = async (skill: AdminSkillRecord) => {
    const newStatus = !skill.published;
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status.');

      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, published: newStatus } : s))
      );
      setFeedbackMessage({
        type: 'success',
        text: `Habilidade "${skill.name}" alterada para ${newStatus ? 'Publicada' : 'Rascunho'}.`,
      });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Não foi possível alterar o status de publicação.' });
    }
  };

  // Excluir Habilidade
  const handleDelete = async (skill: AdminSkillRecord) => {
    if (!window.confirm(`Tem certeza que deseja excluir a habilidade "${skill.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao excluir habilidade.');

      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      setFeedbackMessage({ type: 'success', text: `Habilidade "${skill.name}" excluída com sucesso.` });
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Falha ao excluir a habilidade.' });
    }
  };

  // Salvar Formulário (Criar ou Atualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      proficiencyLevel: formData.proficiencyLevel,
      description: formData.description.trim() || undefined,
      iconName: formData.iconName.trim() || undefined,
      displayOrder: Number(formData.displayOrder) || 0,
      published: formData.published,
    };

    try {
      if (editingSkill) {
        // Atualização via PUT
        const res = await fetch(`/api/admin/skills/${editingSkill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar.');

        setSkills((prev) =>
          prev.map((s) => (s.id === editingSkill.id ? data.skill : s))
        );
        setFeedbackMessage({ type: 'success', text: 'Habilidade atualizada com sucesso!' });
      } else {
        // Criação via POST
        const res = await fetch('/api/admin/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar.');

        setSkills((prev) => [data.skill, ...prev]);
        setFeedbackMessage({ type: 'success', text: 'Nova habilidade cadastrada com sucesso!' });
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
      {/* Alerta de Modo de Persistência */}
      {!databaseConnected && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold">Modo de Visualização Resiliente:</span> O banco de dados PostgreSQL
            está desconectado no ambiente local. Os dados exibidos refletem as competências estáticas extraídas dos
            certificados existentes com total fidelidade.
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
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Gestão de Habilidades e Competências
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Gerenciamento das tecnologias, níveis de proficiência e ligação direta com certificações.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all hover:bg-cyan-500 hover:shadow-cyan-900/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Habilidade</span>
        </button>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Habilidades</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100">{skills.length}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Mapeadas no acervo técnico</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Publicadas</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{publishedCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Visíveis publicamente</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rascunhos</span>
            <EyeOff className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{draftCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Ocultas do portfólio</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Categorias</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400">{totalCategories}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Áreas de especialidade</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome da habilidade ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950/80 py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Apenas Publicados</option>
            <option value="draft">Apenas Rascunhos</option>
          </select>
        </div>
      </div>

      {/* Listagem de Habilidades (Tabela Moderna Responsiva) */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 font-mono text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3.5">Habilidade / Tecnologia</th>
                <th className="px-4 py-3.5">Categoria</th>
                <th className="px-4 py-3.5">Nível</th>
                <th className="px-4 py-3.5 text-center">Cursos Vinculados</th>
                <th className="px-4 py-3.5 text-center">Ordem</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <Sparkles className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    Nenhuma habilidade encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((skill) => (
                  <tr key={skill.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-zinc-100">{skill.name}</div>
                      {skill.description && (
                        <div className="line-clamp-1 text-xs text-zinc-400 max-w-xs">
                          {skill.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-cyan-500/20 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-medium text-cyan-300 capitalize">
                        {skill.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-300 capitalize">
                        {skill.proficiencyLevel || 'avancado'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-300">
                        <Award className="h-3 w-3 text-cyan-400" />
                        {skill.certificatesCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-zinc-400">
                      {skill.displayOrder}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePublish(skill)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          skill.published
                            ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                            : 'border border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40'
                        }`}
                        title="Clique para alternar o status de publicação"
                      >
                        {skill.published ? (
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
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(skill)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400"
                          title="Editar habilidade"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
                          title="Excluir habilidade"
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

      {/* Modal de Criação / Edição de Habilidade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-zinc-100">
                  {editingSkill ? 'Editar Habilidade Técnica' : 'Cadastrar Nova Habilidade'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Nome da Habilidade / Tecnologia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Next.js, TypeScript, Docker..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'todos').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Nível de Proficiência *
                  </label>
                  <select
                    value={formData.proficiencyLevel}
                    onChange={(e) => setFormData({ ...formData, proficiencyLevel: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  >
                    {PROFICIENCY_LEVELS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                  Descrição / Escopo de Aplicação (Opcional)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Ex: Desenvolvimento full stack de arquiteturas resilientes e componentes performáticos."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
                    Ícone Lucide (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: code, terminal, cpu, shield"
                    value={formData.iconName}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="published" className="text-sm text-zinc-200">
                  Publicar imediatamente no portfólio público (/competencias e /curriculo)
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
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSubmitting && <Sparkles className="h-4 w-4 animate-spin" />}
                  <span>{editingSkill ? 'Salvar Alterações' : 'Criar Habilidade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
