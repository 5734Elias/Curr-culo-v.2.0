'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PROFILE } from '@/data/profile';
import { ContactPayloadSchema, ContactPayload } from '@/schemas/content';
import { Send, CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

export default function ContatoPage() {
  const [formData, setFormData] = useState<Partial<ContactPayload>>({
    name: '',
    email: '',
    subject: '',
    message: '',
    websiteHoneypot: '',
    consent: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Limpar erro específico
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validação Client-Side com Zod
    const validation = ContactPayloadSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Falha ao enviar mensagem.');
      }

      setSuccessMessage(data.message || 'Mensagem enviada com sucesso!');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        websiteHoneypot: '',
        consent: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro ao enviar. Utilize o e-mail ou LinkedIn como alternativa.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <SectionHeader
          badge="Contato Profissional"
          title="Fale Comigo & Propostas de Trabalho"
          description="Entre em contato para oportunidades profissionais, projetos de software, consultoria em IA ou cibersegurança. Formulário protegido com validação e rate limit."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Formulário Seguro */}
          <div className="lg:col-span-7">
            <Card hoverEffect={false} className="bg-[#192122]/90 border border-[#3a494b]">
              <CardHeader>
                <CardTitle className="text-lg text-[#dce4e4]">Enviar Mensagem Direta</CardTitle>
              </CardHeader>
              <CardContent>
                {successMessage ? (
                  <div className="p-6 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle className="w-5 h-5" />
                      <span>{successMessage}</span>
                    </div>
                    <p className="text-xs text-[#b9cacb]">
                      Obrigado pelo contato! Responderei no e-mail informado o mais rápido possível.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSuccessMessage(null)}
                      className="mt-2"
                    >
                      Enviar Nova Mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {errorMessage && (
                      <div className="p-4 rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                        <div>
                          <a
                            href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(
                              formData.subject || 'Contato via Portfólio'
                            )}&body=${encodeURIComponent(
                              `Olá Elias,\n\nMeu nome: ${formData.name || ''}\nMeu e-mail: ${
                                formData.email || ''
                              }\n\nMensagem:\n${formData.message || ''}`
                            )}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.25rem] bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 border border-[#00f2ff]/40 text-[#00f2ff] font-medium transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Enviar diretamente pelo seu e-mail</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Honeypot Invisível para Bots */}
                    <div className="hidden" aria-hidden="true">
                      <input
                        type="text"
                        name="websiteHoneypot"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.websiteHoneypot || ''}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Nome */}
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-xs font-mono text-[#b9cacb] block">
                        Seu Nome *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] text-xs text-[#dce4e4] focus:outline-none focus:border-[#00f2ff]"
                        placeholder="Ex: Maria Silva"
                      />
                      {errors.name && <span className="text-[11px] text-[#ffb4ab] block">{errors.name}</span>}
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-xs font-mono text-[#b9cacb] block">
                        Seu E-mail *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] text-xs text-[#dce4e4] focus:outline-none focus:border-[#00f2ff]"
                        placeholder="Ex: maria@empresa.com"
                      />
                      {errors.email && <span className="text-[11px] text-[#ffb4ab] block">{errors.email}</span>}
                    </div>

                    {/* Assunto */}
                    <div className="space-y-1">
                      <label htmlFor="subject" className="text-xs font-mono text-[#b9cacb] block">
                        Assunto *
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] text-xs text-[#dce4e4] focus:outline-none focus:border-[#00f2ff]"
                        placeholder="Ex: Oportunidade de Projeto / Vaga Desenvolvedor"
                      />
                      {errors.subject && <span className="text-[11px] text-[#ffb4ab] block">{errors.subject}</span>}
                    </div>

                    {/* Mensagem */}
                    <div className="space-y-1">
                      <label htmlFor="message" className="text-xs font-mono text-[#b9cacb] block">
                        Sua Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={formData.message || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] text-xs text-[#dce4e4] focus:outline-none focus:border-[#00f2ff] resize-y"
                        placeholder="Escreva os detalhes da proposta ou mensagem..."
                      />
                      {errors.message && <span className="text-[11px] text-[#ffb4ab] block">{errors.message}</span>}
                    </div>

                    {/* Consentimento LGPD */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="consent"
                        name="consent"
                        type="checkbox"
                        checked={formData.consent || false}
                        onChange={handleChange}
                        className="mt-0.5 accent-[#00f2ff]"
                      />
                      <label htmlFor="consent" className="text-[11px] text-[#b9cacb]">
                        Concordo em fornecer meu e-mail e nome para comunicação direta referente a este contato.
                      </label>
                    </div>
                    {errors.consent && <span className="text-[11px] text-[#ffb4ab] block">{errors.consent}</span>}

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isLoading}
                      className="w-full"
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Enviar Mensagem
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contingência & Canais Diretos */}
          <div className="lg:col-span-5 space-y-6">
            <Card hoverEffect={false} className="bg-[#192122] border border-[#3a494b]">
              <CardHeader>
                <CardTitle className="text-base text-[#00f2ff]">Canais Alternativos Diretos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#b9cacb] leading-relaxed">
                  Se preferir ou caso haja qualquer instabilidade no formulário, entre em contato diretamente pelos canais abaixo:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className="flex items-center gap-3 p-3 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] hover:border-[#00f2ff] text-[#dce4e4] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-[#00f2ff]" />
                    <div>
                      <span className="text-[10px] text-[#849495] block">E-MAIL PROFISSIONAL:</span>
                      <span className="font-semibold">{PROFILE.email}</span>
                    </div>
                  </a>

                  <a
                    href={PROFILE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] hover:border-[#00f2ff] text-[#dce4e4] transition-colors"
                  >
                    <LinkedinIcon className="w-5 h-5 text-[#00f2ff]" />
                    <div>
                      <span className="text-[10px] text-[#849495] block">LINKEDIN:</span>
                      <span className="font-semibold">elias-ribeiro-dos-reis-b7791b291</span>
                    </div>
                  </a>

                  <a
                    href={PROFILE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] hover:border-[#00f2ff] text-[#dce4e4] transition-colors"
                  >
                    <GithubIcon className="w-5 h-5 text-[#00f2ff]" />
                    <div>
                      <span className="text-[10px] text-[#849495] block">GITHUB:</span>
                      <span className="font-semibold">5734Elias</span>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-2 text-xs text-[#b9cacb]">
              <div className="flex items-center gap-2 text-[#00f2ff] font-mono text-xs uppercase font-bold">
                <Lock className="w-4 h-4" />
                <span>Privacidade Garantida</span>
              </div>
              <p className="text-[11px]">
                Nenhum dado informado no formulário será compartilhado ou utilizado para fins de marketing não autorizado.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
