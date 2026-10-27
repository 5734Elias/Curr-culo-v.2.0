import { ProjectCase, ProjectCaseSchema } from '@/schemas/content';

const rawProjects: ProjectCase[] = [
  {
    slug: 'agente-ia-antigravity-foundry',
    title: 'Sistema Agente de IA com Microsoft AI Foundry e Google Antigravity',
    summary:
      'Arquitetura de agentes autônomos de Inteligência Artificial para processamento multimodal de linguagem, visão e dados com observabilidade e RAG.',
    context:
      'Solução desenvolvida a partir das formações em IA Generativa no SENAI, focando em automação corporativa com agentes autônomos, recuperação aumentada de informação (RAG) e avaliação responsável.',
    problem:
      'Processamento manual e demorado de documentação técnica extensa, com necessidade de respostas rastreáveis, contextualizadas e sem alucinações.',
    solution:
      'Implementação de uma pipeline híbrida integrando Google Antigravity (Gemini via Vertex AI) e Microsoft AI Foundry, com orquestração de prompts, recuperação contextual e guardrails de segurança.',
    architecture: [
      'Frontend / BFF: Next.js 16 App Router + Server Actions',
      'Orquestração de IA: Microsoft AI Foundry Agent SDK + Google Antigravity Hub',
      'Vetorização & RAG: Embeddings Multimodais + Vector Store Index',
      'Observabilidade: Telemetria de Prompts, Avaliação de Relevância e Guardrails de Segurança',
    ],
    technologies: [
      'Python',
      'TypeScript',
      'Microsoft AI Foundry',
      'Google Antigravity',
      'Gemini API',
      'Vertex AI',
      'RAG',
      'Zod',
    ],
    securityControls: [
      'Sanitização de Prompts contra Prompt Injection',
      'Salvaguarda de privacidade (Bloqueio de exposição de dados PII em chamadas LLM)',
      'Credenciais gerenciadas exclusivamente via variáveis de ambiente seguras',
    ],
    testing: [
      'Testes unitários de parsers e extração de contexto',
      'Avaliação qualitativa de fidelidade e relevância das respostas geradas',
      'Validação de tipagem e esquema de retorno via Zod',
    ],
    outcomes: [
      {
        label: 'Recuperação Semântica (RAG)',
        value: 'Arquitetura com chunking adaptativo, guardrails e respostas estritamente ancoradas na base documental',
        verified: false,
      },
      {
        label: 'Processamento e Latência',
        value: 'Pipeline assíncrono com streaming de dados para melhoria perceptível na experiência de uso',
        verified: false,
      },
    ],
    links: [
      { label: 'Repositório GitHub', url: 'https://github.com/5734Elias' },
      { label: 'Perfil LinkedIn', url: 'https://www.linkedin.com/in/elias-ribeiro-dos-reis-3b289a43' },
    ],
  },
  {
    slug: 'spring-mqttx-iot-library',
    title: 'Spring MQTTX — Integração IoT & Mensageria para Spring Boot',
    summary:
      'Biblioteca customizada em Java/Spring Boot para integração nativa com protocolo MQTT e dispositivos IoT embarcados em tempo real.',
    context:
      'Desenvolvido para conectar sistemas embarcados (FreeRTOS, ESP32, Arduino) ao ecossistema backend corporativo em Java Spring Boot com resiliência.',
    problem:
      'Dificuldade de integrar mensageria leve de sensores e atuadores IoT diretamente com arquiteturas backend Java sem excesso de código boilerplate.',
    solution:
      'Criação de um starter/biblioteca reutilizável (spring-mqttx) com anotações declarativas para subscrição de tópicos, reconexão automática e serialização JSON otimizada.',
    architecture: [
      'Backend Core: Java 17 + Spring Boot 3',
      'Protocolo & Transporte: MQTT v3.1.1 / v5.0 sobre TCP / WebSockets',
      'Cliente Embarcado: C/C++ (FreeRTOS / ESP-IDF) transmitindo para o broker Mosquitto',
      'Segurança: Suporte a autenticação mTLS e credenciais seguras nos brokers',
    ],
    technologies: [
      'Java',
      'Spring Boot',
      'MQTT',
      'C/C++',
      'FreeRTOS',
      'IoT',
      'Docker',
      'JSON',
    ],
    securityControls: [
      'Suporte a criptografia mTLS no transporte de pacotes MQTT',
      'Validação estrita de tópicos e permissões de publicação/assinatura no broker',
    ],
    testing: [
      'Testes de carga com simulação de publicação concorrente',
      'Validação de reconexão automática com buffer em memória diante de instabilidade de rede',
    ],
    outcomes: [
      {
        label: 'Garantia de Entrega (QoS 1)',
        value: 'Buffer local e reconexão automática para proteção contra perdas transitórias de pacotes',
        verified: false,
      },
      {
        label: 'Desempenho de Serialização',
        value: 'Desserialização JSON de baixa sobrecarga computacional adequada a fluxos contínuos de telemetria',
        verified: false,
      },
    ],
    links: [
      { label: 'Código no GitHub', url: 'https://github.com/5734Elias' },
    ],
  },
  {
    slug: 'fortinet-cyber-pentest-shield',
    title: 'Infraestrutura de Defesa Cibernética e Laboratório de Pentest',
    summary:
      'Projeto prático de segurança ofensiva e defensiva combinando appliances Fortigate 7.4, scripts em Python para automação de scans e análise forense.',
    context:
      'Solução técnica concebida a partir das certificações Fortinet (FCF/FCA) e formações de Pentest e Análise Forense no SENAI.',
    problem:
      'Necessidade de proteger ambientes de rede contra acessos não autorizados, tráfego anômalo e vulnerabilidades em serviços expostos.',
    solution:
      'Configuração de perímetro seguro com FortiGate 7.4 (políticas de Firewall, IPS, SSL Inspection, VPN IPsec) integrada a ferramentas de varredura contínua e análise forense.',
    architecture: [
      'Perímetro de Rede: Fortinet FortiGate 7.4 NGFW',
      'Automação de Segurança: Scripts em Python para auditoria de portas e testes de socket',
      'Auditoria & Scans: Nmap, Wireshark e utilitários de pentest em ambiente controlado',
      'Forense Computacional: Análise estruturada de artefatos e integridade de arquivos',
    ],
    technologies: [
      'Fortinet FortiGate 7.4',
      'Python',
      'Linux / Bash',
      'Pentest Tools',
      'Wireshark',
      'Análise Forense',
    ],
    securityControls: [
      'Zoning estrito com regras de Firewall baseadas no princípio do menor privilégio',
      'Mecanismos de Prevenção de Intrusão (IPS) ativos com assinaturas atualizadas',
      'Trilhas de auditoria protegidas contra modificações e bloqueio de tentativas de força bruta',
    ],
    testing: [
      'Simulação de varreduras em ambiente laboratorial de testes',
      'Verificação prática de regras de descarte e filtragem de pacotes pelo firewall',
      'Validação de integridade de logs e evidências durante exercícios práticos',
    ],
    outcomes: [
      {
        label: 'Controle de Perímetro',
        value: 'Filtragem rigorosa de acessos externos e isolamento efetivo entre zonas de rede',
        verified: false,
      },
      {
        label: 'Visibilidade Operacional',
        value: 'Detecção rápida de portas desnecessárias e tráfego divergente do padrão de homologação',
        verified: false,
      },
    ],
    links: [{ label: 'Perfil de Segurança no GitHub', url: 'https://github.com/5734Elias' }],
  },
  {
    slug: 'aws-cloud-data-pipeline',
    title: 'Pipeline de Dados & Analytics em Nuvem AWS & Python',
    summary:
      'Pipeline resiliente para ingestão, transformação e carga de dados analíticos com banco de dados relacional e Python para Data Science.',
    context:
      'Desenvolvido com base no aprendizado de computação em nuvem AWS e banco de dados para Data Science no SENAI.',
    problem:
      'Dispersão de bases operacionais dificultando a consolidação de relatórios e tomada de decisões estratégicas.',
    solution:
      'Arquitetura em nuvem utilizando instâncias de banco de dados na AWS, scripts em Python com Pandas para extração e higienização, e rotinas estruturadas de consolidação.',
    architecture: [
      'Ingestão & Extração: Scripts de automação em Python',
      'Armazenamento Relacional: AWS RDS / Instâncias MySQL e PostgreSQL',
      'Transformação: Pandas, NumPy e consultas analíticas otimizadas em SQL',
      'Consolidação: Estruturas agregadas preparadas para relatórios e análises gerenciais',
    ],
    technologies: ['AWS Cloud', 'Python', 'MySQL', 'PostgreSQL', 'Pandas', 'Data Science'],
    securityControls: [
      'Políticas de IAM refinadas com concessão estrita de menor privilégio',
      'Criptografia de dados em repouso e trânsito protegido com TLS',
      'Bancos de dados alocados em sub-redes privadas sem exposição pública direta',
    ],
    testing: [
      'Testes de integridade de esquema e consistência relacional pós-carga',
      'Validação de idempotência nos scripts de transformação para evitar duplicidades',
    ],
    outcomes: [
      {
        label: 'Resiliência e Continuidade',
        value: 'Rotinas automatizadas de backup e isolamento em ambiente de nuvem seguro',
        verified: false,
      },
      {
        label: 'Eficiência de Processamento',
        value: 'Pipelines automatizados que substituem tarefas manuais repetitivas de extração',
        verified: false,
      },
    ],
    links: [{ label: 'Projetos de Dados no GitHub', url: 'https://github.com/5734Elias' }],
  },
];

export const PROJECTS: ProjectCase[] = rawProjects.map((p) => ProjectCaseSchema.parse(p));
