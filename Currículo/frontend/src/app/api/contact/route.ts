import { NextRequest, NextResponse } from 'next/server';
import { ContactPayloadSchema } from '@/schemas/content';

// Simple in-memory rate-limiter store
const ipStore = new Map<string, { count: number; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // Rate Limiting (Máximo 5 envios por hora por IP)
    const rateData = ipStore.get(ip) || { count: 0, expiresAt: now + 3600000 };
    if (now > rateData.expiresAt) {
      rateData.count = 0;
      rateData.expiresAt = now + 3600000;
    }

    if (rateData.count >= 5) {
      return NextResponse.json(
        { message: 'Limite de envios excedido. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = ContactPayloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Dados de formulário inválidos.', errors: result.error.flatten() },
        { status: 400 }
      );
    }

    // Honeypot check: Se o campo invisível estiver preenchido, descarte silenciosamente
    if (result.data.websiteHoneypot && result.data.websiteHoneypot.length > 0) {
      return NextResponse.json({ success: true, message: 'Mensagem recebida.' });
    }

    // Incrementar contador de requisições
    rateData.count += 1;
    ipStore.set(ip, rateData);

    // Retorno de sucesso (Sem logar dados pessoais sensíveis)
    return NextResponse.json({
      success: true,
      message: 'Mensagem recebida com sucesso! Entrarei em contato em breve.',
    });
  } catch {
    return NextResponse.json(
      { message: 'Erro interno ao processar mensagem.' },
      { status: 500 }
    );
  }
}
