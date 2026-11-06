import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/serverAuth';
import {
  updateSkillAdmin,
  toggleSkillPublishAdmin,
  deleteSkillAdmin,
} from '@/services/cmsDataService';
import { UpdateSkillSchema, TogglePublishSchema } from '@/schemas/cms';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Identificador da habilidade não fornecido.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parseResult = UpdateSkillSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos para atualização da habilidade.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    const updated = await updateSkillAdmin(
      id,
      parseResult.data,
      session.email,
      session.sub,
      clientIpHash
    );

    if (!updated) {
      return NextResponse.json({ error: 'Habilidade não encontrada.' }, { status: 404 });
    }

    // Revalidação sob demanda imediata
    try {
      revalidatePath('/competencias');
      revalidatePath('/curriculo');
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Habilidade atualizada com sucesso!',
      skill: updated,
    });
  } catch (err) {
    console.error('[ADMIN_API] Erro ao atualizar habilidade:', err);
    return NextResponse.json({ error: 'Falha ao atualizar a habilidade.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Identificador da habilidade não fornecido.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parseResult = TogglePublishSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Status de publicação inválido.' },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    await toggleSkillPublishAdmin(
      id,
      parseResult.data.published,
      session.email,
      session.sub,
      clientIpHash
    );

    try {
      revalidatePath('/competencias');
      revalidatePath('/curriculo');
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação:', revalErr);
    }

    return NextResponse.json({
      success: true,
      published: parseResult.data.published,
      message: `Status de publicação alterado para: ${parseResult.data.published ? 'Publicado' : 'Rascunho'}`,
    });
  } catch (err) {
    console.error('[ADMIN_API] Erro ao alternar publicação da habilidade:', err);
    return NextResponse.json({ error: 'Falha ao alternar status da habilidade.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Identificador da habilidade não fornecido.' }, { status: 400 });
  }

  try {
    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    await deleteSkillAdmin(id, session.email, session.sub, clientIpHash);

    try {
      revalidatePath('/competencias');
      revalidatePath('/curriculo');
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Habilidade excluída com sucesso!',
    });
  } catch (err) {
    console.error('[ADMIN_API] Erro ao excluir habilidade:', err);
    return NextResponse.json({ error: 'Falha ao excluir a habilidade.' }, { status: 500 });
  }
}
