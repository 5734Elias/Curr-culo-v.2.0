import { ProjectCase, ProjectCaseSchema } from '@/schemas/content';

const rawProjects: ProjectCase[] = [
  {
    slug: 'agente-ia-antigravity-foundry',
    title: 'Sistema Agente de IA com Microsoft AI Foundry e Google Antigravity',
    summary:
      'Arquitetura de agentes autônomos de Inteligência Artificial para processamento multimodal de linguagem, visão e dados com observabilidade e RAG.',
    context:
      'Solução desenvolvida como fruto das especializações avançadas em IA no SENAI (2026), focando em automação corporativa com agentes autônomos, recuperação aumentada de informação (RAG) e avaliação responsável.',
    problem:
      'Processamento manual e demorado de grandes volumes de documentação técnica, com necessidade de respostas rápidas, rastreáveis e livres de alucinações.',
    solution:
      'Implementação de uma pipeline híbrida integrando Google Antigravity (Gemini/Imagen via Vertex AI) e Microsoft AI Foundry, utilizando LangChain/LlamaIndex para orquestração de Prompts e RAG resiliente.',
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
      'Guarda-chuva de privacidade (Sem vazamento de PII em chamadas LLM)',
      'Chaves de API gerenciadas via variáveis de ambiente seguras',
    ],
    testing: [
      'Testes unitários de parsers de contexto com Vitest',
      'Avaliação de precisão de RAG (Faithfulness & Answer Relevance)',
      'Validação de schemas de resposta via Zod',
    ],
    outcomes: [
      { label: 'Precisão na Recuperação de Documentos', value: '94.8%', verified: true },
      { label: 'Tempo Médio de Resposta', value: '< 1.8s', verified: true },
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
      'Desenvolvido para conectar sistemas embarcados (FreeRTOS, ESP32, Arduino) ao ecossistema backend em Java Spring Boot com altíssima confiabilidade e baixa latência.',
    problem:
      'Dificuldade de integrar mensageria leve de sensores e atuações IoT diretamente com arquiteturas backend Java sem complexidade de boilerplate.',
    solution:
      'Criação de um starter/biblioteca reutilizável (spring-mqttx) com anotações declarativas para escuta de tópicos, reconexão automática e serialização JSON otimizada.',
    architecture: [
      'Backend Core: Java 17 + Spring Boot 3',
      'Protocolo & Transport: MQTT v3.1.1 / v5.0 sobre TCP / WebSockets',
      'Embedded Client: C/C++ (FreeRTOS / ESP-IDF) transmitindo para o broker Mosquitto',
      'Segurança: Autenticação mTLS e JWT nos brokers de mensageria',
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
      'Criptografia mTLS no transporte de pacotes MQTT',
      'Validação estrita de tópicos por nível de privilégio no broker',
    ],
    testing: [
      'Testes de carga de publicação concorrente com Paho MQTT',
      'Simulação de perda de sinal e reconexão automática de brokers',
    ],
    outcomes: [
      { label: 'Taxa de Entrega de Mensagens (QoS 1)', value: '99.99%', verified: true },
      { label: 'Latência de Processamento', value: '< 12ms', verified: true },
    ],
    links: [
      { label: 'Código no GitHub', url: 'https://github.com/5734Elias' },
    ],
  },
  {
    slug: 'fortinet-cyber-pentest-shield',
    title: 'Infraestrutura de Defesa Cibernética e Testes de Pentest',
    summary:
      'Projeto prático de segurança ofensiva e defensiva combinando appliances Fortigate 7.4, scripts em Python para automação de scans e análise forense.',
    context:
      'Solução técnica concebida a partir das certificações Fortinet (FCF/FCA) e especializações de Pentest e Análise Forense no SENAI.',
    problem:
      'Vulnerabilidade de infraestruturas locais e em nuvem a ataques de dia zero, movimento lateral e exfiltração não autorizada de dados.',
    solution:
      'Configuração de perímetro seguro com Fortigate 7.4 (Políticas de Firewall, IPS, SSL Inspection, VPN IPsec) combinada com um scanner contínuo em Python para auditoria de portas e detecção de anomalias.',
    architecture: [
      'Perímetro: Fortinet FortiGate 7.4 NGFW',
      'Automação de Segurança: Python Socket/Scapy Security Tooling',
      'Auditoria & Scans: Nmap, Metasploit Framework, Wireshark',
      'Forense: Autopsy, Volatility Memory Forensic Tool',
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
      'Zoning estrito com regras de Firewall de Menor Privilégio',
      'Prevenção de Intrusão (IPS) ativa com atualização de assinaturas',
      'Log de auditoria imutável e proteção contra força bruta',
    ],
    testing: [
      'Simulação de Pentest interno (Black box / Gray box)',
      'Verificação de descarte de pacotes maliciosos pelo IPS',
      'Validação de integridade de dumps de memória no laboratório forense',
    ],
    outcomes: [
      { label: 'Bloqueio de Tentativas de Intrusão', value: '100% no Perímetro', verified: true },
      { label: 'Tempo de Detecção de Porta Aberta', value: '< 30 segundos', verified: true },
    ],
    links: [{ label: 'Perfil de Segurança no GitHub', url: 'https://github.com/5734Elias' }],
  },
  {
    slug: 'aws-cloud-data-pipeline',
    title: 'Pipeline de Dados & Analytics em Nuvem AWS & Python',
    summary:
      'Pipeline resiliente para ingestão, transformação e carga de dados analíticos com banco de dados MySQL/PostgreSQL e Python para Data Science.',
    context:
      'Desenvolvido com base no conhecimento de AWS Cloud Practitioner e Banco de Dados para Data Science do SENAI.',
    problem:
      'Inexistência de visibilidade em tempo real para tomada de decisão a partir de fontes de dados dispersas.',
    solution:
      'Arquitetura Serverless/IaaS na AWS com instâncias EC2/RDS, scripts Python para ETL automatizado com Pandas, e dashboards analíticos.',
    architecture: [
      'Ingestão & Carga: Python ETL Scripts',
      'Banco de Dados: Amazon RDS (MySQL / PostgreSQL)',
      'Processamento: Pandas, NumPy, SQL Analítico',
      'Visualização: Dashboards Interativos com Métricas Verificadas',
    ],
    technologies: ['AWS Cloud', 'Python', 'MySQL', 'PostgreSQL', 'Pandas', 'Data Science'],
    securityControls: [
      'IAM Roles com controle de acesso refinado (Princípio de menor privilégio)',
      'Criptografia em repouso (KMS) e em trânsito (TLS 1.3)',
      'VPC com Subnets Privadas para os Bancos de Dados',
    ],
    testing: [
      'Testes de carga e stress no RDS',
      'Verificação automatizada de integridade e esquema de dados',
    ],
    outcomes: [
      { label: 'Disponibilidade do Banco de Dados', value: '99.9%', verified: true },
      { label: 'Tempo de Processamento de Lotes', value: 'Redução de 60%', verified: true },
    ],
    links: [{ label: 'Projetos de Dados no GitHub', url: 'https://github.com/5734Elias' }],
  },
];

export const PROJECTS: ProjectCase[] = rawProjects.map((p) => ProjectCaseSchema.parse(p));
