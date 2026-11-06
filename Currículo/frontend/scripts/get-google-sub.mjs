import { createRemoteJWKSet } from 'jose/jwks/remote';
import { jwtVerify } from 'jose/jwt/verify';
import { OFFICIAL_ADMIN_EMAIL } from '../src/lib/auth/config.ts';

/**
 * Utilitário Local Seguro para Obtenção do Identificador Imutável Google (`sub`).
 *
 * REGRAS DE SEGURANÇA:
 * 1. Executa exclusivamente na máquina local do proprietário.
 * 2. Nunca exibe nem persiste tokens JWT ou credenciais em logs.
 * 3. Valida a assinatura criptográfica contra o JWKS oficial do Google e exige
 *    que o e-mail seja estritamente `reis.elias.ribeiro@gmail.com` com `email_verified === true`.
 */

const GOOGLE_CERTS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');

async function main() {
  const rawIdToken = process.env.GOOGLE_ID_TOKEN?.trim();

  if (!rawIdToken) {
    console.log('====================================================================');
    console.log(' PROCEDIMENTO SEGURO PARA OBTER SEU GOOGLE_ADMIN_SUB');
    console.log('====================================================================');
    console.log(`\nConta Google Oficial Autorizada: ${OFFICIAL_ADMIN_EMAIL}`);
    console.log('\nOPÇÃO 1 (Mais simples — Direto no Navegador em 30 segundos):');
    console.log('  1. Acesse o Google OAuth Playground oficial:');
    console.log('     https://developers.google.com/oauthplayground/');
    console.log('  2. No "Step 1", digite no campo de escopos: openid email');
    console.log('     e clique em "Authorize APIs".');
    console.log(`  3. Faça login com sua conta: ${OFFICIAL_ADMIN_EMAIL} (com seu 2FA).`);
    console.log('  4. No "Step 2", clique em "Exchange authorization code for tokens".');
    console.log('  5. No "Step 3", no campo Request URI, insira:');
    console.log('     https://openidconnect.googleapis.com/v1/userinfo');
    console.log('     e clique em "Send the request".');
    console.log('  6. Na resposta JSON exibida na tela, copie o valor numérico do campo "sub"');
    console.log('     (exemplo: "109876543210987654321") e configure em GOOGLE_ADMIN_SUB na Vercel.');
    console.log('\nOPÇÃO 2 (Validação Criptográfica Local via Terminal):');
    console.log('  Se você tiver um id_token emitido pelo Google, execute localmente:');
    console.log('  GOOGLE_ID_TOKEN="seu_id_token" npx tsx scripts/get-google-sub.mjs');
    console.log('====================================================================\n');
    return;
  }

  try {
    const jwks = createRemoteJWKSet(GOOGLE_CERTS_URL);
    const { payload } = await jwtVerify(rawIdToken, jwks, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : '';
    const emailVerified = payload.email_verified === true;
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';

    if (!emailVerified) {
      console.error('[ERRO] O e-mail contido no token não está marcado como verificado pelo Google.');
      process.exit(1);
    }

    if (email !== OFFICIAL_ADMIN_EMAIL) {
      console.error(`[ERRO] O token pertence a outra conta. Apenas ${OFFICIAL_ADMIN_EMAIL} é autorizada.`);
      process.exit(1);
    }

    if (!sub) {
      console.error('[ERRO] Identificador sub não encontrado no token.');
      process.exit(1);
    }

    console.log('\n[SUCESSO] Identidade Google validada criptograficamente!');
    console.log(`E-mail Verificado : ${email}`);
    console.log(`GOOGLE_ADMIN_SUB  : ${sub}`);
    console.log('\nCopie o valor acima e adicione na variável GOOGLE_ADMIN_SUB no painel da Vercel.\n');
  } catch {
    console.error('[ERRO] Falha ao validar o ID Token fornecido (token expirado ou assinatura inválida).');
    process.exit(1);
  }
}

main();

