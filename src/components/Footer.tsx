import React from 'react';
import { LogoQGU } from './LogoQGU';

interface FooterProps {
  onGoToLogin?: () => void;
  compact?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ onGoToLogin, compact = false, className = '' }) => {
  if (compact) {
    return (
      <footer className={`bg-[#edefe9] border-t border-[#c2c9b9]/60 py-2 sm:py-2.5 text-[11px] text-[#73796c] shrink-0 ${className}`}>
        <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 ESCRITORES QGU • COMIEADEPA</span>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/5591982577589"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#191c19] hover:text-[#123d00] font-mono font-semibold transition-colors"
              title="Falar no WhatsApp"
            >
              Contato: (91) 98257-7589
            </a>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className={`bg-[#edefe9] border-t border-[#c2c9b9]/60 mt-16 py-10 text-xs text-[#42493d] ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#c2c9b9]/40">
          {/* Logo Brand in Footer */}
          <div className="flex items-center gap-3">
            <LogoQGU className="w-10 h-10 rounded-xl shadow-xs" />
            <div>
              <p className="font-display font-semibold text-sm tracking-wider text-[#082500]">
                ESCRITORES QGU
              </p>
              <p className="text-[11px] text-[#42493d]">
                Coordenação Teológica Quartel General Umadespa
              </p>
            </div>
          </div>

          {/* Canonical Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <a
              href="https://wa.me/5591982577589"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#191c19] hover:text-[#123d00] font-medium transition-colors cursor-pointer group"
              title="Falar no WhatsApp"
            >
              <span>Contato:</span>
              <span className="font-mono text-[#123d00] font-semibold group-hover:underline">
                (91) 98257-7589
              </span>
            </a>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center text-center text-[11px] text-[#73796c] tracking-wider uppercase gap-2">
          <span>
            © 2026 QUARTEL GENERAL UMADESPA. UM EXÉRCITO QUE NÃO SE DOBRA
          </span>
        </div>
      </div>
    </footer>
  );
};
