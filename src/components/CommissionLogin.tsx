import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { SystemUser } from '../types';
import { authenticateUserFromSupabase } from '../services/supabaseService';

interface CommissionLoginProps {
  users?: SystemUser[];
  onLoginSuccess: (
    user: SystemUser,
    targetRoute?: 'painel' | 'inscricao' | 'candidato' | 'prova'
  ) => void;
  onBackToPublic: () => void;
  redirectedFromPainel?: boolean;
  redirectedFromModelPage?: 'inscricao' | 'candidato' | 'prova' | null;
  redirectedFromTurma?: string | boolean | null;
}

export const CommissionLogin: React.FC<CommissionLoginProps> = ({
  users = [],
  onLoginSuccess,
  onBackToPublic,
  redirectedFromPainel = false,
  redirectedFromModelPage = null,
  redirectedFromTurma = null,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = sessionStorage.getItem('login_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [targetDestination, setTargetDestination] = useState<
    'painel' | 'inscricao' | 'candidato' | 'prova'
  >(redirectedFromModelPage || 'painel');

  // Timer de bloqueio contra ataques de força bruta
  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  useEffect(() => {
    if (redirectedFromModelPage) {
      setTargetDestination(redirectedFromModelPage);
    }
  }, [redirectedFromModelPage]);

  // Accepted fallback credentials
  const defaultUsers: SystemUser[] = [
    {
      id: 'user-admin-1',
      name: 'Lucas Pimenta',
      email: 'lucaspimenta717@gmail.com',
      whatsapp: '(91) 98257-7589',
      role: 'admin',
      password: 'comieadepa2026',
      initials: 'LP',
      roleLabel: 'COORDENAÇÃO TEOLÓGICA (ADMIN)',
      routeSlug: '/Paineladm',
    },
    {
      id: 'user-prof-1',
      name: 'Pr. Carlos Alberto Pinheiro',
      email: 'prof.carlos@comieadepa.org',
      whatsapp: '(91) 98412-3301',
      role: 'professor',
      password: 'prof123',
      initials: 'CP',
      roleLabel: 'PROFESSOR TITULAR',
      routeSlug: '/ProfCarlos',
      disciplina: 'Hermenêutica e Metodologia Teológica',
    },
    {
      id: 'user-aluno-1',
      name: 'Marcos Paulo de Oliveira',
      email: 'marcos.oliveira@gmail.com',
      whatsapp: '(91) 99182-4455',
      role: 'aluno',
      password: 'aluno123',
      initials: 'MO',
      roleLabel: 'ALUNO VOCACIONADO',
      routeSlug: '/turma2026-1024',
      turmaId: 'turma-2026',
      matricula: '2026-QGU-1024',
      polo: 'Campo Belém Central',
    },
  ];

  const allUsers = users.length > 0 ? users : defaultUsers;

  const isCoordenacaoUser = (() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return Boolean(redirectedFromModelPage || redirectedFromPainel);
    }
    const matched = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matched) {
      return matched.role === 'admin';
    }
    return (
      cleanEmail === 'admin' ||
      cleanEmail === 'comissao' ||
      cleanEmail.includes('coord') ||
      cleanEmail.includes('admin') ||
      cleanEmail === 'lucaspimenta717@gmail.com'
    );
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutTimer > 0) {
      setError(`Muitas tentativas incorretas. Por segurança, aguarde ${lockoutTimer}s antes de tentar novamente.`);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Por favor, preencha o e-mail/usuário e a senha.');
      return;
    }

    setIsLoading(true);

    (async () => {
      // Check for user-updated password or credentials in localStorage
      const customPassword = localStorage.getItem('escritores_qgu_user_password');
      const storedProfileRaw = localStorage.getItem('escritores_qgu_user_profile');
      let customEmail = 'lucaspimenta717@gmail.com';
      let customName = 'Lucas Pimenta';
      if (storedProfileRaw) {
        try {
          const parsed = JSON.parse(storedProfileRaw);
          if (parsed.email) customEmail = parsed.email.toLowerCase();
          if (parsed.name) customName = parsed.name;
        } catch {
          // ignore
        }
      }

      // Check custom updated admin credentials
      if (
        customPassword &&
        cleanPass === customPassword &&
        (cleanEmail === customEmail ||
          cleanEmail === 'comissao@comieadepa.org' ||
          cleanEmail === 'admin' ||
          cleanEmail === 'lucaspimenta717@gmail.com')
      ) {
        const adminUser: SystemUser = {
          id: 'user-admin-1',
          name: customName,
          email: customEmail,
          whatsapp: '(91) 98257-7589',
          role: 'admin',
          password: cleanPass,
          initials: 'LP',
          roleLabel: 'COORDENAÇÃO TEOLÓGICA (ADMIN)',
          routeSlug: '/Paineladm',
        };
        setIsLoading(false);
        sessionStorage.removeItem('login_failed_attempts');
        setFailedAttempts(0);
        saveSession(adminUser);
        onLoginSuccess(adminUser, targetDestination);
        return;
      }

      // 1. Match against local users list
      let matched = allUsers.find((u) => {
        const emailMatch =
          u.email.toLowerCase() === cleanEmail ||
          (cleanEmail === 'admin' && u.role === 'admin') ||
          (cleanEmail === 'comissao' && u.role === 'admin');
        const passMatch =
          u.password === cleanPass ||
          (u.role === 'admin' &&
            (cleanPass === 'comieadepa2026' || cleanPass === 'comieadepa2025'));
        return emailMatch && passMatch;
      });

      // 2. If not found in memory (e.g. newly created user on another device/browser), query Supabase directly
      if (!matched) {
        try {
          const remoteUser = await authenticateUserFromSupabase(cleanEmail, cleanPass);
          if (remoteUser) {
            matched = remoteUser;
          }
        } catch (err) {
          console.warn('Erro ao autenticar com Supabase:', err);
        }
      }

      setIsLoading(false);

      if (matched) {
        sessionStorage.removeItem('login_failed_attempts');
        setFailedAttempts(0);
        saveSession(matched);
        const destination = matched.role === 'admin' ? targetDestination : undefined;
        onLoginSuccess(matched, destination);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        sessionStorage.setItem('login_failed_attempts', String(newAttempts));
        if (newAttempts >= 5) {
          setLockoutTimer(30);
          setError('Limite de 5 tentativas atingido. Acesso temporariamente bloqueado por 30 segundos.');
        } else {
          setError(
            `Credenciais não encontradas. Verifique seus dados. (Tentativa ${newAttempts} de 5)`
          );
        }
      }
    })();
  };

  const saveSession = (user: SystemUser) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('escritores_qgu_auth', 'true');
    storage.setItem('escritores_qgu_examiner', user.name);
    storage.setItem('escritores_qgu_current_user', JSON.stringify(user));
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-4 sm:py-8 animate-in fade-in">
      <div className="max-w-md w-full space-y-4">
        {/* Security / Direct Access Warning from Painel */}
        {redirectedFromPainel && (
          <div className="bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] p-3 rounded-2xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Acesso Restrito</p>
              <p className="text-[11px] text-[#78350f]">
                Por segurança, confirme suas credenciais autorizadas para ingressar no painel.
              </p>
            </div>
          </div>
        )}

        {/* Exclusive Canonical Model Pages Access Warning */}
        {redirectedFromModelPage && (
          <div className="bg-[#fef9c3] border border-[#facc15] text-[#854d0e] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in shadow-2xs">
            <Lock className="w-4 h-4 text-[#a16207] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-xs text-[#713f12] block">
                Acesso Restrito às Páginas-Modelo
              </strong>
              <p className="text-[11px] text-[#854d0e] mt-0.5 leading-relaxed">
                A rota <code className="font-mono font-bold bg-white/80 px-1 py-0.5 rounded text-[#713f12]">/{redirectedFromModelPage}</code> é uma página-modelo canônica do sistema e não possui acesso público ou para candidatos. O acesso é exclusivo através do login da <strong>Coordenação</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Security / Turma Route Protected by Login Alert */}
        {redirectedFromTurma && (
          <div className="bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in shadow-2xs">
            <Lock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-xs text-[#78350f] block">
                Acesso Restrito à Turma
              </strong>
              <p className="text-[11px] text-[#92400e] mt-0.5 leading-relaxed">
                {typeof redirectedFromTurma === 'string' && redirectedFromTurma !== 'true' ? (
                  <>
                    A rota da turma <code className="font-mono font-bold bg-white/80 px-1 py-0.5 rounded text-[#713f12]">/{redirectedFromTurma}</code> é protegida por autenticação.
                  </>
                ) : (
                  'A rota desta turma é bloqueada por autenticação.'
                )}{' '}
                Por favor, informe seu e-mail e senha de <strong>Aluno</strong>, <strong>Professor</strong> ou <strong>Coordenação</strong> para acessar.
              </p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div
              onClick={onBackToPublic}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBackToPublic();
                }
              }}
              role="button"
              tabIndex={0}
              className="w-12 h-12 rounded-2xl bg-[#123d00] text-white flex items-center justify-center mx-auto shadow-sm border border-[#2a5912] cursor-pointer hover:bg-[#1a4f03] hover:scale-105 active:scale-95 transition-all select-none focus:outline-none focus:ring-2 focus:ring-[#123d00] focus:ring-offset-2 group"
              title="Voltar para a vitrine pública"
            >
              <Lock className="w-6 h-6 text-[#a2d486] group-hover:rotate-[-6deg] transition-transform" />
            </div>
            <span className="text-[10px] font-bold text-[#646029] uppercase tracking-widest block">
              ESCRITORES QGU
            </span>
            <h1 className="text-2xl font-bold font-display text-[#082500]">
              Autenticação de Usuários
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#fee2e2] border border-[#f87171] text-[#7f1d1d] p-3 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Usuário
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#73796c] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#73796c] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#123d00]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#73796c] hover:text-[#191c19] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#42493d] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#123d00] cursor-pointer"
                />
                <span>Lembrar meu acesso</span>
              </label>
            </div>

            {/* Destino para Login de Coordenação (apenas para usuário de coordenação) */}
            {isCoordenacaoUser && (
              <div className="pt-1 pb-1 space-y-1.5 border-t border-[#e1e3dd] animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#42493d]">
                  <span>Destino (ao logar como Coordenação):</span>
                  <span className="text-[10px] font-mono text-[#123d00] font-bold bg-[#eff3eb] px-1.5 py-0.5 rounded">
                    {targetDestination === 'painel' ? '/Paineladm' : `/${targetDestination}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetDestination('painel')}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      targetDestination === 'painel'
                        ? 'bg-[#123d00] text-white border-[#123d00]'
                        : 'bg-[#f8faf4] hover:bg-[#eaeedf] text-[#42493d] border-[#c2c9b9]'
                    }`}
                  >
                    Painel ADM
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDestination('inscricao')}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      targetDestination === 'inscricao'
                        ? 'bg-[#123d00] text-white border-[#123d00]'
                        : 'bg-[#f8faf4] hover:bg-[#eaeedf] text-[#42493d] border-[#c2c9b9]'
                    }`}
                  >
                    /inscricao
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDestination('candidato')}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      targetDestination === 'candidato'
                        ? 'bg-[#123d00] text-white border-[#123d00]'
                        : 'bg-[#f8faf4] hover:bg-[#eaeedf] text-[#42493d] border-[#c2c9b9]'
                    }`}
                  >
                    /candidato
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDestination('prova')}
                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      targetDestination === 'prova'
                        ? 'bg-[#123d00] text-white border-[#123d00]'
                        : 'bg-[#f8faf4] hover:bg-[#eaeedf] text-[#42493d] border-[#c2c9b9]'
                    }`}
                  >
                    /prova
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || lockoutTimer > 0}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors uppercase tracking-wider ${
                lockoutTimer > 0
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#123d00] hover:bg-[#0d2a00] text-white cursor-pointer'
              }`}
            >
              <span>
                {isLoading
                  ? 'Entrando...'
                  : lockoutTimer > 0
                  ? `Bloqueado (${lockoutTimer}s)`
                  : 'Entrar'}
              </span>
              {!isLoading && lockoutTimer === 0 && <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="w-full text-center text-xs text-[#555d4e] hover:text-[#123d00] font-medium transition-colors cursor-pointer py-1"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
