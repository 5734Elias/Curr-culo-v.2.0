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

function redactSensitiveData(input: string): string {
  return input.replace(/re_[a-zA-Z0-9_-]+/g, 're_***');
}

/**
 * Serviço de envio de mensagens de contato.
 * Abstrai o provedor de e-mail (Resend / SMTP / Webhook)
 * e impede falsos sucessos quando o serviço não estiver configurado.
 */
export async function sendContactEmail(payload: ContactMessage): Promise<SendMessageResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const destinationEmail = process.env.CONTACT_DESTINATION_EMAIL || 'elias.re_is@hotmail.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const isProduction = process.env.NODE_ENV === 'production';

  // Modo de Teste ou Mock explícito EXCLUSIVO para ambientes de desenvolvimento / CI.
  // Em produção, é expressamente proibido simular sucesso via mock.
  if (!isProduction && (process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL_SERVICE === 'true')) {
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }

  // Se a chave da API ou o remetente verificado não estiverem definidos no ambiente
  // (Não utiliza remetentes não verificados @resend.dev em produção)
  if (!apiKey || !fromEmail || (isProduction && fromEmail.toLowerCase().endsWith('@resend.dev'))) {
    return {
      success: false,
      notConfigured: true,
      error: 'Serviço de envio automático temporariamente indisponível. Por favor, utilize o link de e-mail direto.',
    };
  }

  // Prevenção contra Email Header / CRLF Injection: sanitizar quebras de linha em campos de cabeçalho
  const safeName = payload.name.replace(/[\r\n]+/g, ' ').trim();
  const safeSubject = payload.subject.replace(/[\r\n]+/g, ' ').trim();

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
        subject: `[Portfólio Contato] ${safeSubject} - De: ${safeName}`,
        text: `Nome: ${safeName}\nE-mail: ${payload.email}\nAssunto: ${safeSubject}\n\nMensagem:\n${payload.message}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (isProduction) {
        console.error('[SECURITY][CONTACT_SERVICE] Resend rejection:', redactSensitiveData(data?.message || 'Unknown error'));
      }
      return {
        success: false,
        error: 'Falha ao processar envio com o provedor de e-mail.',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : 'Erro inesperado na comunicação com o servidor de e-mail.';
    if (isProduction) {
      console.error('[SECURITY][CONTACT_SERVICE] Network error:', redactSensitiveData(rawError));
    }
    return {
      success: false,
      error: 'Não foi possível estabelecer comunicação com o provedor de mensagens.',
    };
  }
}

