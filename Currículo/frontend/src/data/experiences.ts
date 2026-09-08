import { Experience, ExperienceSchema } from '@/schemas/content';

const rawExperiences: Experience[] = [
  {
    id: 'fapunifesp-analista-sistemas',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Analista de Sistemas',
    period: 'Junho/2023 – Presente (3 anos 3 meses)',
    startDate: '2023-06',
    isCurrent: true,
    location: 'São Paulo, SP - Brasil',
    responsibilities: [
      'Desenvolvimento e manutenção de APIs REST robustas em Java / Spring Boot, com autenticação JWT, validação de dados, tratamento global de erros e arquitetura limpa em camadas.',
      'Integração entre sistemas legados e bancos de dados relacionais (SQL Server e MySQL), assegurando alta disponibilidade e integridade das informações institucionais.',
      'Automação de rotinas e tratamento avançado de dados com Python, reduzindo significativamente tarefas manuais.',
      'Desenvolvimento de aplicações web responsivas com React, TypeScript, Tailwind CSS e Sass, priorizando excelente usabilidade e integração frontend-backend.',
      'Containerização de aplicações com Docker, versionamento com Git, documentação interativa de APIs via Swagger e aplicação contínua de boas práticas de segurança cibernética.',
      'Apoio direto à transformação digital interna, propondo otimizações operacionais e modernização de processos baseados em tecnologia.',
    ],
    technologies: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'JPA',
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
      { label: 'Arquitetura de APIs REST', value: '100% Padronizadas (Swagger/JWT)', verified: true },
      { label: 'Automação de Processos', value: 'Redução expressiva em rotinas manuais', verified: true },
      { label: 'Disponibilidade de Banco de Dados', value: 'SQL Server & MySQL Integrados', verified: true },
    ],
  },
  {
    id: 'fapunifesp-comprador-junior',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Comprador Júnior',
    period: 'Abril/2021 – Junho/2023 (2 anos 3 meses)',
    startDate: '2021-04',
    endDate: '2023-06',
    location: 'São Paulo, SP - Brasil',
    responsibilities: [
      'Atuação no setor de compras institucionais, com análise criteriosa de demandas administrativas, negociação com fornecedores e organização de dados contratuais.',
      'Desenvolvimento de relatórios e planilhas estruturadas para otimização de fluxo de compras e prestação de contas.',
    ],
    technologies: ['Análise de Dados', 'Gestão de Compras', 'Processos Administrativos', 'Excel Avançado'],
    outcomes: [
      { label: 'Eficiência Operacional', value: 'Fluxo de aquisições otimizado', verified: true },
    ],
  },
  {
    id: 'fapunifesp-motorista-facilite',
    company: 'Fundação de Apoio à Universidade Federal de São Paulo - FapUnifesp',
    role: 'Motorista Facilite',
    period: 'Abril/2019 – Abril/2021 (2 anos 1 mês)',
    startDate: '2019-04',
    endDate: '2021-04',
    location: 'São Paulo, SP - Brasil',
    responsibilities: [
      'Atuação inicial na instituição, fornecendo suporte operacional e transporte de logística institucional com pontualidade e segurança.',
    ],
    technologies: ['Logística Institucional', 'Suporte Operacional'],
    outcomes: [
      { label: 'Trajetória Institucional', value: 'Crescimento contínuo até TI', verified: true },
    ],
  },
  {
    id: 'universidade-brasil-lider',
    company: 'Universidade Brasil',
    role: 'Líder de Portaria',
    period: 'Março/2016 – Janeiro/2022 (5 anos 11 meses)',
    startDate: '2016-03',
    endDate: '2022-01',
    location: 'Itaquera, São Paulo - SP',
    responsibilities: [
      'Atuação em funções operacionais e de liderança de equipe, com foco na disciplina profissional, controle de acesso e organização de processos patrimoniais.',
    ],
    technologies: ['Liderança de Equipes', 'Gestão de Processos', 'Controle de Acesso'],
    outcomes: [
      { label: 'Gestão de Equipe', value: 'Supervisão direta e processos alinhados', verified: true },
    ],
  },
  {
    id: 'e-realizacoes-motorista',
    company: 'É Realizações Editora, Livraria e Espaço Cultural',
    role: 'Motorista',
    period: 'Março/2013 – Janeiro/2022 (8 anos 11 meses)',
    startDate: '2013-03',
    endDate: '2022-01',
    location: 'Vila Mariana, São Paulo - SP',
    responsibilities: [
      'Atuação logística e suporte operacional no transporte de materiais editoriais e apoio a eventos culturais.',
    ],
    technologies: ['Logística', 'Suporte Operacional'],
    outcomes: [
      { label: 'Pontualidade Operacional', value: 'Suporte contínuo por 8+ anos', verified: true },
    ],
  },
  {
    id: 'atento-lider',
    company: 'Atento',
    role: 'Líder de Portaria e Segurança',
    period: 'Julho/2012 – Março/2013 (9 meses)',
    startDate: '2012-07',
    endDate: '2013-03',
    location: 'Belenzinho, São Paulo - SP',
    responsibilities: [
      'Atuação em funções operacionais e de liderança, priorizando responsabilidade, rigor de processos e disciplina operacional.',
    ],
    technologies: ['Liderança', 'Segurança Operacional'],
    outcomes: [
      { label: 'Controle Operacional', value: 'Execução de procedimentos de segurança', verified: true },
    ],
  },
  {
    id: 'dimep-lider',
    company: 'DIMEP',
    role: 'Líder de Portaria',
    period: 'Agosto/2010 – Julho/2012 (2 anos)',
    startDate: '2010-08',
    endDate: '2012-07',
    location: 'Imperatriz Leopoldina, São Paulo - SP',
    responsibilities: [
      'Atuação em funções operacionais e de liderança de portaria, assegurando disciplina e integridade de acesso.',
    ],
    technologies: ['Liderança de Operações', 'Controle de Acesso'],
    outcomes: [
      { label: 'Gestão Patrimonial', value: 'Controle de fluxo de acesso seguro', verified: true },
    ],
  },
];

export const EXPERIENCES: Experience[] = rawExperiences.map((e) => ExperienceSchema.parse(e));
