export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  notConfigured?: boolean;
  error?: string;
}

/**
 * Serviço de envio de mensagens de contato.
 * Abstrai o provedor de e-mail (Resend / SMTP / Webhook)
 * e impede falsos sucessos quando o serviço não estiver configurado.
 */
export async function sendContactEmail(payload: ContactMessage): Promise<SendMessageResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'elias.re_is@hotmail.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'portfolio@resend.dev';
  const isProduction = process.env.NODE_ENV === 'production';

  // Modo de Teste ou Mock explícito EXCLUSIVO para ambientes de desenvolvimento / CI.
  // Em produção, é expressamente proibido simular sucesso via mock.
  if (!isProduction && (process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL_SERVICE === 'true')) {
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }

  // Se a chave da API não estiver definida no ambiente
  if (!apiKey) {
    return {
      success: false,
      notConfigured: true,
      error: 'Serviço de envio automático temporariamente indisponível. Por favor, utilize o link de e-mail direto.',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [destinationEmail],
        reply_to: payload.email,
        subject: `[Portfólio Contato] ${payload.subject} - De: ${payload.name}`,
        text: `Nome: ${payload.name}\nE-mail: ${payload.email}\nAssunto: ${payload.subject}\n\nMensagem:\n${payload.message}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Falha ao processar envio com o provedor de e-mail.',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro inesperado na comunicação com o servidor de e-mail.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

