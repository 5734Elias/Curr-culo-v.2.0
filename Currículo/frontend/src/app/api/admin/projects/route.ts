import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/serverAuth';
import {
  getAllProjectsAdmin,
  createProjectAdmin,
  ProjectFilters,
} from '@/services/cmsDataService';
import { CreateProjectSchema } from '@/schemas/cms';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const filters: ProjectFilters = {
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as ProjectFilters['status']) || undefined,
  };

  try {
    const result = await getAllProjectsAdmin(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[ADMIN_API] Erro ao listar projetos:', err);
    return NextResponse.json(
      { error: 'Falha ao processar a consulta de projetos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = CreateProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos para criação do projeto.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    const created = await createProjectAdmin(
      parseResult.data,
      session.email,
      session.sub,
      clientIpHash
    );

    // Revalidação sob demanda (ISR) do portfólio público
    try {
      revalidatePath('/projetos');
      revalidatePath(`/projetos/${created.slug}`);
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação de caminhos públicos:', revalErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Projeto cadastrado com sucesso!',
        project: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[ADMIN_API] Erro ao cadastrar projeto:', err);
    return NextResponse.json(
      { error: 'Falha ao cadastrar o projeto no sistema.' },
      { status: 500 }
    );
  }
}
