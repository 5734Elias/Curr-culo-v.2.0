import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/serverAuth';
import {
  getAllSkillsAdmin,
  createSkillAdmin,
  SkillFilters,
} from '@/services/cmsDataService';
import { CreateSkillSchema } from '@/schemas/cms';
import { extractClientIp, hashIpForPrivacy } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const filters: SkillFilters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    status: (searchParams.get('status') as SkillFilters['status']) || undefined,
  };

  try {
    const result = await getAllSkillsAdmin(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[ADMIN_API] Erro ao listar habilidades:', err);
    return NextResponse.json(
      { error: 'Falha ao processar a consulta de habilidades.' },
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
    const parseResult = CreateSkillSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos para criação da habilidade.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const clientIpHash = hashIpForPrivacy(clientIp || '127.0.0.1');

    const created = await createSkillAdmin(
      parseResult.data,
      session.email,
      session.sub,
      clientIpHash
    );

    // Revalidação sob demanda (ISR) do portfólio público
    try {
      revalidatePath('/competencias');
      revalidatePath('/curriculo');
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('[REVALIDATION] Aviso na revalidação de caminhos públicos:', revalErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Habilidade criada com sucesso!',
        skill: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[ADMIN_API] Erro ao cadastrar habilidade:', err);
    return NextResponse.json(
      { error: 'Falha ao cadastrar a habilidade no sistema.' },
      { status: 500 }
    );
  }
}
