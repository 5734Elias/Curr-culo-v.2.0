import { NextRequest, NextResponse } from 'next/server';
import { ContactPayloadSchema } from '@/schemas/content';
import { extractClientIp, hashIpForPrivacy, checkRateLimit } from '@/lib/rateLimit';
import { sendContactEmail } from '@/services/contactService';

export async function POST(req: NextRequest) {
  try {
    // 1. Extração e Anonimização Segura do IP (LGPD por Design)
    const rawIp = extractClientIp(req.headers);
    const hashedIp = hashIpForPrivacy(rawIp);

    // 2. Rate Limiting Serverless (Máximo 5 requisições por hora por IP)
    const rateCheck = await checkRateLimit(hashedIp, 5, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      const isFailClosed = rateCheck.provider === 'fail-closed';
      return NextResponse.json(
        {
          success: false,
          code: isFailClosed ? 'SERVICE_UNAVAILABLE' : 'RATE_LIMIT_EXCEEDED',
          message: isFailClosed
            ? 'Serviço temporariamente indisponível para proteção do sistema. Tente novamente em instantes.'
            : 'Limite de mensagens excedido. Por favor, aguarde antes de tentar novamente.',
        },
        {
          status: isFailClosed ? 503 : 429,
          headers: {
            'Retry-After': Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000)).toString(),
          },
        }
      );
    }

    // 3. Validação de Content-Type e Tamanho Máximo (Prevenção de DoS e Input Injection)
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'O cabeçalho Content-Type deve ser application/json.',
        },
        { status: 415 }
      );
    }

    const MAX_BODY_BYTES = 10 * 1024; // 10KB
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYLOAD_TOO_LARGE',
          message: 'O tamanho da requisição excede o limite máximo permitido de 10KB.',
        },
        { status: 413 }
      );
    }

    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Não foi possível ler o corpo da requisição.',
        },
        { status: 400 }
      );
    }

    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYLOAD_TOO_LARGE',
          message: 'O tamanho da requisição excede o limite máximo permitido de 10KB.',
        },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'MALFORMED_JSON',
          message: 'O corpo da requisição não é um JSON válido.',
        },
        { status: 400 }
      );
    }

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
    if (websiteHoneypot && websiteHoneypot.trim().length > 0) {
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
          message: 'Não foi possível entregar sua mensagem no momento. Por favor, utilize o contato direto.',
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
