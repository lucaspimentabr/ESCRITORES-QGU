import React from 'react';
import { ActiveTab, UserProfile, SystemUser } from '../types';
import { LogOut, Home, User } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  isAuthenticated: boolean;
  examinerName: string;
  userProfile?: UserProfile;
  currentUser?: SystemUser | null;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isAuthenticated,
  examinerName,
  userProfile,
  currentUser,
  onTabChange,
  onLogout,
  onOpenProfile,
}) => {
  const isFormPage =
    activeTab === 'candidato' || activeTab === 'prova' || activeTab === 'inscricao';

  return (
    <header className="bg-white border-b border-[#e7e9e3] sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onTabChange('vitrine')}
            className="flex items-center group cursor-pointer"
            id="brand-logo-button"
            title="Ir para a Vitrine Institucional"
          >
            {/* Typography */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-2xl font-bold tracking-wider text-[#082500] leading-none">
                  ESCRITORES QGU
                </span>
              </div>
              <span className="text-[9px] sm:text-[11px] font-semibold tracking-widest text-[#646029] uppercase leading-tight hidden xs:inline">
                Você já estudou Teologia. Chegou a hora de escrevê-la.
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Controls (Only when already inside authenticated areas, never on form/model pages or public vitrine) */}
        <div className="flex items-center gap-2">
          {isAuthenticated && !isFormPage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTabChange('vitrine')}
                className="p-2 rounded-xl text-[#42493d] hover:bg-[#f4f6f0] border border-transparent hover:border-[#e1e3dd] transition-all cursor-pointer inline-flex items-center justify-center"
                title="Voltar para a Vitrine Pública"
                aria-label="Voltar para a Vitrine Pública"
              >
                <Home className="w-4 h-4" />
              </button>

              <button
                id="btn-header-user-profile"
                type="button"
                onClick={onOpenProfile}
                title={`Perfil: ${currentUser?.name || userProfile?.name || examinerName || 'Lucas Pimenta'}`}
                aria-label="Editar Perfil do Usuário"
                className="p-2 rounded-xl bg-[#f4f6f0] hover:bg-[#eaece5] border border-[#e1e3dd] hover:border-[#c2c9b9] text-[#123d00] transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center"
              >
                <User className="w-4 h-4" />
              </button>

              <button
                id="btn-commission-logout"
                onClick={onLogout}
                title="Encerrar Sessão"
                aria-label="Encerrar Sessão"
                className="p-2 rounded-xl text-[#b91c1c] hover:bg-[#fee2e2] transition-colors border border-[#fee2e2] cursor-pointer inline-flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
