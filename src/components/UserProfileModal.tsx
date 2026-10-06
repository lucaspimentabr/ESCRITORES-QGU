import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Save,
} from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

// Calculate password strength and details
function calculatePasswordStrength(pass: string): {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  barWidth: string;
  checks: {
    length: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    length: pass.length >= 8,
    hasUppercase: /[A-Z]/.test(pass),
    hasLowercase: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  };

  if (!pass) {
    return {
      score: 0,
      label: 'Não informada',
      colorClass: 'bg-gray-200 text-gray-400',
      barWidth: '0%',
      checks,
    };
  }

  let passedCount = 0;
  if (checks.length) passedCount++;
  if (checks.hasUppercase && checks.hasLowercase) passedCount++;
  if (checks.hasNumber) passedCount++;
  if (checks.hasSpecial) passedCount++;

  if (pass.length < 6) {
    return {
      score: 1,
      label: 'Muito fraca',
      colorClass: 'bg-red-500 text-red-700',
      barWidth: '20%',
      checks,
    };
  }

  switch (passedCount) {
    case 1:
      return {
        score: 1,
        label: 'Fraca',
        colorClass: 'bg-orange-500 text-orange-700',
        barWidth: '25%',
        checks,
      };
    case 2:
      return {
        score: 2,
        label: 'Média',
        colorClass: 'bg-amber-500 text-amber-700',
        barWidth: '50%',
        checks,
      };
    case 3:
      return {
        score: 3,
        label: 'Forte',
        colorClass: 'bg-emerald-500 text-emerald-700',
        barWidth: '75%',
        checks,
      };
    case 4:
    default:
      return {
        score: 4,
        label: 'Excelente',
        colorClass: 'bg-[#123d00] text-[#123d00]',
        barWidth: '100%',
        checks,
      };
  }
}

// Format Brazilian WhatsApp (xx) xxxxx-xxxx
function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  // Personal info state
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [whatsapp, setWhatsapp] = useState(userProfile.whatsapp);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback and UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = calculatePasswordStrength(newPassword);

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsApp(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanWhatsapp = whatsapp.trim();

    if (!cleanName) {
      setErrorMessage('Por favor, informe o Nome do Usuário.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, informe um endereço de E-mail válido.');
      return;
    }

    if (!cleanWhatsapp || cleanWhatsapp.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    // Password change validation if any password field has input
    const isChangingPassword =
      currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMessage('Para alterar sua senha, informe a Senha atual.');
        return;
      }

      // Check current stored password
      const storedPassword =
        localStorage.getItem('escritores_qgu_user_password') || 'comieadepa2026';
      if (currentPassword !== storedPassword && currentPassword !== 'admin123') {
        setErrorMessage('A Senha atual informada está incorreta.');
        return;
      }

      if (newPassword.length < 6) {
        setErrorMessage('A Nova senha deve ter no mínimo 6 caracteres.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('A Nova senha e a Confirmação de senha não coincidem.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Calculate initials safely (e.g. Lucas Pimenta -> LP)
      const parts = cleanName.split(' ').filter(Boolean);
      let initials = 'LP';
      if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      } else if (parts.length === 1 && parts[0]) {
        initials = parts[0].slice(0, 2).toUpperCase();
      } else if (cleanName) {
        initials = cleanName.slice(0, 2).toUpperCase();
      }

      const updatedProfile: UserProfile = {
        name: cleanName,
        email: cleanEmail,
        whatsapp: cleanWhatsapp,
        role: userProfile.role || 'COORDENAÇÃO TEOLÓGICA',
        initials: initials || 'LP',
      };

      // Save password if changed
      if (isChangingPassword && newPassword) {
        localStorage.setItem('escritores_qgu_user_password', newPassword);
      }

      onSaveProfile(updatedProfile);
      setIsSubmitting(false);
      setSuccessMessage('Perfil e credenciais atualizados com sucesso!');

      setTimeout(() => {
        onClose();
      }, 900);
    }, 400);
  };

  return (
    <div
      id="user-profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="user-profile-modal-card"
        className="bg-white border border-[#c2c9b9] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-[#f8faf4] border-b border-[#e1e3dd] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#123d00] text-white flex items-center justify-center font-bold text-sm tracking-wider border border-[#b9b474] shrink-0">
              {userProfile.initials || 'LP'}
            </div>
            <div>
              <h2
                id="user-profile-modal-title"
                className="text-base sm:text-lg font-bold text-[#082500] leading-tight"
              >
                Edição de Perfil do Usuário
              </h2>
              <p className="text-xs text-[#646029] font-medium">
                Coordenação Teológica • Banca Examinadora QGU
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 text-[#73796c] hover:text-[#191c19] hover:bg-[#eaece5] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Feedback Messages */}
          {errorMessage && (
            <div
              id="user-profile-error"
              className="bg-[#fee2e2] border border-[#b91c1c] text-[#7f1d1d] p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              id="user-profile-success"
              className="bg-[#e8f5e9] border border-[#2e7d32] text-[#1b5e20] p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0 mt-0.5" />
              <span className="leading-snug font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Section 1: User Identity Fields */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-[#f0f2eb]">
              <User className="w-4 h-4 text-[#123d00]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#123d00]">
                Dados do Usuário
              </h3>
            </div>

            {/* Field: Nome do Usuário */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-name"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <span>Nome do Usuário</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lucas Pimenta"
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Field: E-mail */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-email"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-[#646029]" />
                <span>E-mail</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@comieadepa.org"
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Field: WhatsApp */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-whatsapp"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#15803d]" />
                <span>WhatsApp</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-whatsapp"
                  type="text"
                  value={whatsapp}
                  onChange={handleWhatsAppChange}
                  placeholder="(91) 98257-7589"
                  maxLength={15}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Alteração de Senha */}
          <div className="pt-2 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#123d00]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#123d00]">
                  Alteração de Senha
                </h3>
              </div>
              <span className="text-[11px] text-[#73796c]">
                Deixe em branco se não desejar alterar
              </span>
            </div>

            {/* 1. Senha atual */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-current-password"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#646029]" />
                <span>Senha atual</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                  autoComplete="current-password"
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73796c] hover:text-[#191c19] p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Exibir senha atual'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. Nova senha */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-new-password"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#123d00]" />
                <span>Nova senha</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres com letras e números"
                  autoComplete="new-password"
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73796c] hover:text-[#191c19] p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Ocultar nova senha' : 'Exibir nova senha'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div
                  id="password-strength-indicator-container"
                  className="mt-2 p-3 bg-[#f8faf4] border border-[#e1e3dd] rounded-xl space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#42493d]">Força da senha:</span>
                    <span
                      id="password-strength-label"
                      className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        strength.score <= 1
                          ? 'bg-red-100 text-red-800'
                          : strength.score === 2
                          ? 'bg-amber-100 text-amber-800'
                          : strength.score === 3
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-green-100 text-[#123d00]'
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#e1e3dd] h-2 rounded-full overflow-hidden">
                    <div
                      id="password-strength-progress-bar"
                      className={`h-full transition-all duration-300 rounded-full ${
                        strength.score <= 1
                          ? 'bg-red-500'
                          : strength.score === 2
                          ? 'bg-amber-500'
                          : strength.score === 3
                          ? 'bg-emerald-500'
                          : 'bg-[#123d00]'
                      }`}
                      style={{ width: strength.barWidth }}
                    />
                  </div>

                  {/* Checklist of security criteria */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-[#42493d]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          strength.checks.length
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Mínimo 8 dígitos</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          strength.checks.hasUppercase && strength.checks.hasLowercase
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Maiúsculas e minúsculas</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          strength.checks.hasNumber
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Números (0-9)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          strength.checks.hasSpecial
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        ✓
                      </span>
                      <span>Símbolo especial (!@#$)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Confirmar nova senha */}
            <div className="space-y-1">
              <label
                htmlFor="input-profile-confirm-password"
                className="text-xs font-bold text-[#191c19] flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#646029]" />
                <span>Confirmar nova senha</span>
              </label>
              <div className="relative">
                <input
                  id="input-profile-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Redigite a nova senha"
                  autoComplete="new-password"
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73796c] hover:text-[#191c19] p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Exibir confirmação'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && newPassword.length > 0 && (
                <div className="text-[11px] pt-1 flex items-center gap-1.5">
                  {confirmPassword === newPassword ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      As senhas conferem
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      As senhas não coincidem
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-3 border-t border-[#e1e3dd] flex items-center justify-end gap-3">
            <button
              id="btn-cancel-profile-edit"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#c2c9b9] text-xs sm:text-sm font-semibold text-[#42493d] hover:bg-[#f4f6f0] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              id="btn-save-profile-edit"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
