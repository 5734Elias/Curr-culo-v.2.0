import { Experience, ExperienceSchema } from '@/schemas/content';
import { formatExperiencePeriod } from '@/lib/dateUtils';

interface RawExperienceInput extends Omit<Experience, 'period'> {
  period?: string;
}

const rawExperiencesData: RawExperienceInput[] = [
  {
    id: 'fapunifesp-analista-sistemas',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Analista de Sistemas',
    startDate: '2023-06',
    isCurrent: true,
    location: 'São Paulo, SP - Brasil',
    responsibilities: [
      'Desenvolvimento e sustentação de APIs RESTful em Java com Spring Boot, aplicando autenticação JWT, validação de payload com Bean Validation e arquitetura em camadas.',
      'Integração de sistemas legados com bases de dados relacionais (SQL Server e MySQL), assegurando integridade referencial e disponibilidade de dados institucionais.',
      'Desenvolvimento de rotinas de automação e tratamento de dados com Python, reduzindo processos manuais recorrentes.',
      'Construção de interfaces web responsivas e acessíveis com React, TypeScript e Tailwind CSS, priorizando usabilidade e aderência a padrões web modernos.',
      'Containerização com Docker, controle de versão via Git e documentação padronizada de endpoints com Swagger/OpenAPI.',
      'Apoio à transformação digital interna através da proposição de melhorias de processos e modernização de ferramentas técnicas.',
    ],
    technologies: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'JPA / Hibernate',
      'APIs REST',
      'JWT',
      'Python',
      'SQL Server',
      'MySQL',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Docker',
      'Git',
      'Linux',
    ],
    outcomes: [
      {
        label: 'Arquitetura de APIs',
        value: 'Padronização corporativa com documentação OpenAPI/Swagger e segurança via JWT',
        verified: false,
      },
      {
        label: 'Automação Operacional',
        value: 'Scripts em Python para processamento de dados e eliminação de tarefas manuais repetitivas',
        verified: false,
      },
      {
        label: 'Integração de Sistemas',
        value: 'Comunicação estruturada e persistência íntegra entre SQL Server e MySQL',
        verified: false,
      },
    ],
  },
  {
    id: 'fapunifesp-comprador-junior',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Comprador Júnior',
    startDate: '2021-04',
    endDate: '2023-06',
    location: 'São Paulo, SP - Brasil',
    responsibilities: [
      'Gestão de aquisições institucionais, cotações, negociação técnica com fornecedores e conferência de conformidade contratual.',
      'Estruturação de relatórios e planilhas analíticas para otimização do fluxo de compras e prestação de contas aos projetos de pesquisa.',
    ],
    technologies: ['Análise de Dados', 'Gestão de Compras', 'Processos Administrativos', 'Excel Avançado'],
    outcomes: [
      {
        label: 'Gestão de Processos',
        value: 'Padronização do fluxo de cotações e organização de documentação para auditoria',
        verified: false,
      },
    ],
  },
  {
    id: 'fapunifesp-motorista-facilite',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Motorista Facilite',
    startDate: '2019-04',
    endDate: '2021-04',
    location: 'São Paulo, SP - Brasil',
    overlapNote: 'Atuação concomitante com atividade editorial prévia em escalas e horários compatíveis.',
    responsibilities: [
      'Atuação inicial na instituição fornecendo suporte logístico operacional e transporte institucional com segurança e pontualidade.',
      'Início do direcionamento acadêmico e profissional em tecnologia e desenvolvimento de sistemas.',
    ],
    technologies: ['Logística Institucional', 'Operações', 'Planejamento de Rotas'],
    outcomes: [
      {
        label: 'Trajetória Institucional',
        value: 'Evolução contínua por mérito até a área de Tecnologia da Informação',
        verified: false,
      },
    ],
  },
  {
    id: 'universidade-brasil-lider',
    company: 'Universidade Brasil',
    role: 'Líder de Portaria',
    startDate: '2016-03',
    endDate: '2022-01',
    location: 'Itaquera, São Paulo - SP',
    overlapNote: 'Atuação em escala de turnos alternados compatível com atividade de transporte logístico.',
    responsibilities: [
      'Liderança de equipe operacional de controle de acesso, fiscalização de normas de segurança patrimonial e atendimento ao público acadêmico.',
      'Coordenação de escalas, disciplina de equipe e registro de ocorrências operacionais.',
    ],
    technologies: ['Liderança de Equipes', 'Gestão de Processos', 'Controle de Acesso'],
    outcomes: [
      {
        label: 'Gestão Operacional',
        value: 'Supervisão de equipe de portaria e aplicação de diretrizes de controle patrimonial',
        verified: false,
      },
    ],
  },
  {
    id: 'e-realizacoes-motorista',
    company: 'É Realizações Editora, Livraria e Espaço Cultural',
    role: 'Motorista',
    startDate: '2013-03',
    endDate: '2022-01',
    location: 'Vila Mariana, São Paulo - SP',
    overlapNote: 'Atuação contínua em transporte e suporte logístico editorial em escala definida.',
    responsibilities: [
      'Transporte logístico de acervos, livros e materiais institucionais para eventos culturais e feiras literárias.',
      'Planejamento de rotas, conservação veicular e pontualidade na entrega de materiais.',
    ],
    technologies: ['Logística', 'Suporte Operacional', 'Atendimento'],
    outcomes: [
      {
        label: 'Consistência e Confiabilidade',
        value: 'Relação de confiança e dedicação operacional sustentada por quase uma década',
        verified: false,
      },
    ],
  },
  {
    id: 'atento-lider',
    company: 'Atento',
    role: 'Líder de Portaria e Segurança',
    startDate: '2012-07',
    endDate: '2013-03',
    location: 'Belenzinho, São Paulo - SP',
    responsibilities: [
      'Coordenação operacional de portaria e segurança física preventiva das instalações corporativas.',
      'Aplicação de protocolos de identificação de colaboradores e visitantes em ambiente de alta circulação.',
    ],
    technologies: ['Liderança Operacional', 'Segurança Patrimonial'],
    outcomes: [
      {
        label: 'Controle de Acesso',
        value: 'Execução disciplinada dos procedimentos de segurança corporativa',
        verified: false,
      },
    ],
  },
  {
    id: 'dimep-lider',
    company: 'DIMEP',
    role: 'Líder de Portaria',
    startDate: '2010-08',
    endDate: '2012-07',
    location: 'Imperatriz Leopoldina, São Paulo - SP',
    responsibilities: [
      'Supervisão da portaria principal da sede fabril, controle de fluxo de funcionários, prestadores e veículos de carga.',
    ],
    technologies: ['Controle de Portaria', 'Ronda Patrimonial', 'Atendimento'],
    outcomes: [
      {
        label: 'Organização Patrimonial',
        value: 'Supervisão contínua do fluxo de entradas e saídas fabris',
        verified: false,
      },
    ],
  },
];

/**
 * Retorna a lista de experiências profissionais com durações calculadas dinamicamente
 * com base na data corrente (ou data de referência customizada), respeitando o ciclo de vida do Next.js.
 */
export function getExperiences(referenceDate?: string): Experience[] {
  return rawExperiencesData.map((exp) => {
    const period = formatExperiencePeriod(exp.startDate, exp.endDate, exp.isCurrent, referenceDate);
    return ExperienceSchema.parse({
      ...exp,
      period,
    });
  });
}

// Exportação estática compatível com componentes existentes
export const EXPERIENCES: Experience[] = getExperiences();
