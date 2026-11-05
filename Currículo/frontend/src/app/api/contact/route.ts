import { NextRequest, NextResponse } from 'next/server';
import { ContactPayloadSchema } from '@/schemas/content';
import { extractClientIp, hashIpForPrivacy, checkRateLimit } from '@/lib/rateLimit';
import { readRequestBodyWithLimit } from '@/lib/bodyLimiter';
import { sendContactEmail } from '@/services/contactService';

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de Content-Type (Rejeita tipos não suportados com HTTP 415)
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

    // 2. Extração e Validação de Procedência do Endereço IP
    // Em produção na Vercel, apenas cabeçalhos assinados pela borda são confiáveis (x-vercel-forwarded-for / x-real-ip).
    // Se a procedência não puder ser atestada com segurança, a requisição é rejeitada para evitar colisões no rate limit.
    const rawIp = extractClientIp(req.headers);
    if (!rawIp) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNIDENTIFIED_CLIENT',
          message: 'Não foi possível verificar a procedência da requisição com a infraestrutura de borda.',
        },
        { status: 400 }
      );
    }

    // 3. Anonimização e Rate Limiting Distribuído (Máximo 5 requisições por hora por IP)
    const hashedIp = hashIpForPrivacy(rawIp);
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

    // 4. Leitura Incremental do Corpo HTTP com Limite Estrito de 10.240 Bytes (Prevenção de DoS e OOM)
    // Monitora os bytes reais UTF-8 consumidos, cancelando o leitor de stream ao exceder a cota
    // e rejeitando caracteres inválidos de encoding sem carregar corpos gigantes em memória.
    const bodyResult = await readRequestBodyWithLimit(req);
    if (!bodyResult.ok) {
      return NextResponse.json(
        {
          success: false,
          code: bodyResult.code,
          message: bodyResult.message,
        },
        { status: bodyResult.status }
      );
    }

    // 5. Parsing Seguro de JSON
    let body: unknown;
    try {
      body = JSON.parse(bodyResult.rawBody);
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

    // 6. Validação Estrutural e Semântica Rigorosa com Zod
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

    // 7. Honeypot Antispam: descarta silenciosamente robôs que preenchem campos ocultos
    if (websiteHoneypot && websiteHoneypot.trim().length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Mensagem recebida.',
        },
        { status: 200 }
      );
    }

    // 8. Envio Real via Serviço de Mensageria (sem falso sucesso)
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

    // 9. Retorno de Sucesso Verdadeiro
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
