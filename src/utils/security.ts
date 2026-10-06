/**
 * Utilitários de Segurança e Sanitização — Escritores QGU / COMIEADEPA
 */

/**
 * Valida se uma URL externa é segura para navegação/abertura em nova aba.
 * Bloqueia esquemas perigosos como javascript:, vbscript:, data:, file:, etc.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();

  // Permite apenas protocolos http e https
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return false;
  }

  // Bloqueia tentativas de injeção ou caracteres nulos
  if (trimmed.includes('javascript:') || trimmed.includes('\0') || trimmed.includes('data:')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitiza strings para exibição segura, removendo tags de script e caracteres perigosos.
 */
export function sanitizeInput(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

/**
 * Validador de força de senha para novos usuários do sistema.
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
  }
  return { isValid: true, message: 'Senha válida.' };
}
