import { NextRequest, NextResponse } from 'next/server';
import { ContactPayloadSchema } from '@/schemas/content';
import { extractClientIp, hashIpForPrivacy, checkRateLimit } from '@/lib/rateLimit';
import { sendContactEmail } from '@/services/contactService';

export async function POST(req: NextRequest) {
  try {
    // 1. Extração e Anonimização Segura do IP (LGPD por Design)
    const rawIp = extractClientIp(req.headers);
    const hashedIp = hashIpForPrivacy(rawIp);

    // 2. Rate Limiting (Máximo 5 requisições por hora por IP)
    const rateCheck = checkRateLimit(hashedIp, 5, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de mensagens excedido. Por favor, aguarde antes de tentar novamente.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateCheck.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 3. Validação do Corpo da Requisição com Zod
    const body = await req.json();
    const validation = ContactPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_PAYLOAD',
          message: 'Dados do formulário inválidos.',
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message, websiteHoneypot } = validation.data;

    // 4. Honeypot Antispam: se o campo invisível foi preenchido, descarta sem alertar o bot
    if (websiteHoneypot && websiteHoneypot.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Mensagem recebida.',
        },
        { status: 200 }
      );
    }

    // 5. Envio Real via Serviço de Mensageria (sem falso sucesso)
    const sendResult = await sendContactEmail({ name, email, subject, message });

    if (sendResult.notConfigured) {
      return NextResponse.json(
        {
          success: false,
          code: 'SERVICE_NOT_CONFIGURED',
          message:
            'O serviço automatizado de mensagens está aguardando configuração de credenciais no servidor. Utilize o link direto de e-mail abaixo.',
          fallbackEmail: 'elias.re_is@hotmail.com',
        },
        { status: 503 }
      );
    }

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: 'DELIVERY_FAILED',
          message: sendResult.error || 'Não foi possível entregar sua mensagem no momento. Tente novamente mais tarde.',
          fallbackEmail: 'elias.re_is@hotmail.com',
        },
        { status: 502 }
      );
    }

    // 6. Retorno de Sucesso Verdadeiro
    return NextResponse.json(
      {
        success: true,
        message: 'Mensagem enviada com sucesso! Entrarei em contato em breve.',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocorreu um erro interno ao processar sua solicitação. Por favor, utilize o e-mail direto.',
        fallbackEmail: 'elias.re_is@hotmail.com',
      },
      { status: 500 }
    );
  }
}
