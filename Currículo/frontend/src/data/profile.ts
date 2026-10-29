import { ProfileData } from '@/types';

export const PROFILE: ProfileData = {
  name: 'Elias Ribeiro Dos Reis',
  role: 'Analista de Sistemas | Full Stack Developer | Java • Spring Boot • React',
  headline: 'Analista de Sistemas | Full Stack Developer | Java • Spring Boot • React | APIs REST • SQL • Docker | Segurança & Cloud',
  summary:
    'Analista de Sistemas e Desenvolvedor Full Stack na FapUnifesp, com trajetória de crescimento dentro da instituição até a área de Tecnologia da Informação. Atuo de ponta a ponta no desenvolvimento, integração e automação de sistemas internos. No backend, trabalho com Java e Spring Boot (Spring Data JPA, Spring Security), construindo APIs REST com autenticação JWT, validação, tratamento global de erros e arquitetura em camadas, com documentação Swagger e containerização Docker. No frontend, desenvolvo interfaces responsivas com React, TypeScript, Tailwind CSS e Sass. Automatizo rotinas e trato dados com Python, e integro bancos de dados relacionais (SQL Server, MySQL). Tenho ainda experiência prática com IoT e sistemas embarcados (C/C++, FreeRTOS, MQTT) — incluindo a criação da biblioteca spring-mqttx, que integra MQTT ao Spring Boot. Estou aprofundando Cloud (AWS/Azure), segurança aplicada ao desenvolvimento e IA aplicada (atualmente estudando agentes de IA na Microsoft AI Foundry). Meu objetivo é consolidar um perfil técnico que une desenvolvimento, dados e segurança em soluções robustas.',
  location: 'São Paulo, SP - Brasil',
  phone: '+55 (11) 98605-0195',
  email: 'elias.re_is@hotmail.com',
  github: 'https://github.com/5734Elias',
  linkedin: 'https://www.linkedin.com/in/elias-ribeiro-dos-reis-3b289a43',
  availability: 'Disponível para novas oportunidades e projetos de engenharia de software',
};

/** Número normalizado para links internacionais (somente dígitos: 5511986050195). */
export const PHONE_INTERNATIONAL = PROFILE.phone.replace(/\D/g, '');

/** Mensagem inicial sugerida para abertura de conversa no WhatsApp. */
export const WHATSAPP_INITIAL_MESSAGE =
  'Olá, Elias! Vi seu portfólio profissional e gostaria de conversar sobre uma oportunidade ou projeto.';

/** Canais de mensagens profissionais (número em formato internacional). */
export const WHATSAPP_CONTACT_URL = `https://wa.me/${PHONE_INTERNATIONAL}?text=${encodeURIComponent(
  WHATSAPP_INITIAL_MESSAGE
)}`;
export const TELEGRAM_CONTACT_URL = `https://t.me/+${PHONE_INTERNATIONAL}`;
