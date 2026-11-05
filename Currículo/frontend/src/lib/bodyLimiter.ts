export const MAX_REQUEST_BODY_BYTES = 10 * 1024; // 10KB = 10.240 bytes

export interface ReadBodySuccess {
  ok: true;
  rawBody: string;
  byteLength: number;
}

export interface ReadBodyFailure {
  ok: false;
  status: 400 | 413;
  code: 'PAYLOAD_TOO_LARGE' | 'INVALID_REQUEST' | 'INVALID_ENCODING';
  message: string;
}

export type ReadBodyResult = ReadBodySuccess | ReadBodyFailure;

/**
 * Lê o corpo da requisição HTTP com contagem estrita de bytes UTF-8 e limite máximo de 10.240 bytes:
 *
 * 1. Verificação prévia de Content-Length: descarta imediatamente requisições que declaram tamanho excessivo.
 * 2. Leitura incremental via ReadableStream: consome chunk por chunk. Ao ultrapassar 10.240 bytes,
 *    o leitor é cancelado imediatamente (reader.cancel()) e a conexão interrompida sem bufferizar dados em memória.
 * 3. Validação de UTF-8 estrito: utiliza TextDecoder('utf-8', { fatal: true }), rejeitando bytes malformados
 *    com HTTP 400 (INVALID_ENCODING).
 * 4. Não depende exclusivamente de Content-Length: requisições chunked ou sem cabeçalho são monitoradas byte a byte.
 * 5. Medição real em bytes: caracteres multibyte (ex: emojis de 4 bytes) são contabilizados por seus bytes UTF-8,
 *    evitando que payloads grandes passem despercebidos por contagem de caracteres UTF-16.
 */
export async function readRequestBodyWithLimit(
  req: Request,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): Promise<ReadBodyResult> {
  // 1. Verificação rápida pelo cabeçalho Content-Length (se fornecido)
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    if (!isNaN(parsedLength) && parsedLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: `O tamanho da requisição (${parsedLength} bytes) excede o limite máximo permitido de ${maxBytes} bytes (10KB).`,
      };
    }
  }

  // 2. Leitura incremental via ReadableStream (quando suportada no runtime)
  if (req.body && typeof req.body.getReader === 'function') {
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let exceeded = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.byteLength;
          if (receivedBytes > maxBytes) {
            exceeded = true;
            try {
              await reader.cancel();
            } catch {
              // Silencia erros de cancelamento em sockets fechados
            }
            break;
          }
          chunks.push(value);
        }
      }
    } catch {
      return {
        ok: false,
        status: 400,
        code: 'INVALID_REQUEST',
        message: 'Não foi possível ler o fluxo de dados da requisição.',
      };
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Ignora caso lock já tenha sido liberado
      }
    }

    if (exceeded) {
      return {
        ok: false,
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: `O fluxo de dados da requisição excedeu o limite máximo permitido de ${maxBytes} bytes (10KB).`,
      };
    }

    // Concatena todos os blocos de bytes recebidos
    const fullBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fullBuffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Decodifica UTF-8 estrito (fatal: true rejeita bytes inválidos)
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const rawBody = decoder.decode(fullBuffer);
      return {
        ok: true,
        rawBody,
        byteLength: receivedBytes,
      };
    } catch {
      return {
        ok: false,
        status: 400,
        code: 'INVALID_ENCODING',
        message: 'O corpo da requisição contém sequência de bytes UTF-8 inválida.',
      };
    }
  }

  // 3. Fallback portátil para ambientes onde req.body não é ReadableStream
  try {
    const rawText = await req.text();
    const byteLength = new TextEncoder().encode(rawText).byteLength;
    if (byteLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: `O tamanho da requisição (${byteLength} bytes) excede o limite máximo permitido de ${maxBytes} bytes (10KB).`,
      };
    }
    return {
      ok: true,
      rawBody: rawText,
      byteLength,
    };
  } catch {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Não foi possível ler o corpo da requisição.',
    };
  }
}
