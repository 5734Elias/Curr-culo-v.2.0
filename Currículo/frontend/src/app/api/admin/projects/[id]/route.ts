import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/serverAuth';
import {
  updateProjectAdmin,
  toggleProjectPublishAdmin,
  deleteProjectAdmin,
} from '@/services/cmsDataService';
import { UpdateProjectSchema, TogglePublishSchema } from '@/schemas/cms';
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
    return NextResponse.json({ error: 'Identificador do projeto não fornecido.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parseResult = UpdateProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos para atualização do projeto.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    const updated = await updateProjectAdmin(
      id,
      parseResult.data,
      session.email,
      session.sub,
      clientIpHash
    );

    if (!updated) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    // Revalidação sob demanda imediata
    try {
      revalidatePath('/projetos');
      revalidatePath(`/projetos/${updated.slug}`);
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
      project: updated,
    });
  } catch (err) {
    console.error('[ADMIN_API] Erro ao atualizar projeto:', err);
    return NextResponse.json({ error: 'Falha ao atualizar o projeto.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Identificador do projeto não fornecido.' }, { status: 400 });
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

    await toggleProjectPublishAdmin(
      id,
      parseResult.data.published,
      session.email,
      session.sub,
      clientIpHash
    );

    try {
      revalidatePath('/projetos');
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
    console.error('[ADMIN_API] Erro ao alternar publicação do projeto:', err);
    return NextResponse.json({ error: 'Falha ao alternar status do projeto.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Identificador do projeto não fornecido.' }, { status: 400 });
  }

  try {
    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    await deleteProjectAdmin(id, session.email, session.sub, clientIpHash);

    try {
      revalidatePath('/projetos');
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Projeto excluído com sucesso!',
    });
  } catch (err) {
    console.error('[ADMIN_API] Erro ao excluir projeto:', err);
    return NextResponse.json({ error: 'Falha ao excluir o projeto.' }, { status: 500 });
  }
}
