import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Filter,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Calendar,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SystemUser, UserRole, Turma } from '../types';
import { INITIAL_ACADEMIC_MODULES } from '../data/mockAcademicData';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Disciplinas cadastradas no curso e na banca examinadora
const REGISTERED_DISCIPLINES: string[] = [
  'Hermenêutica e Metodologia Teológica',
  'Produção Literária e Redação Editorial',
  'Módulo 1: Leitura Analítica e Crítica Teológica',
  'Módulo 2: Abrangência e Ortodoxia Doutrinária',
  'Módulo 3: Método de Pesquisa e Rigor Acadêmico',
  'Módulo 4: Processo de Escrita e Produção Editorial',
  'Teologia Sistemática e Doutrinas Teológicas',
  'Exegese Bíblica e Hermenêutica',
  'Banca Examinadora de Artigos e Obras',
];

interface UserManagementViewProps {
  users: SystemUser[];
  turmas: Turma[];
  onUpdateUsers: (users: SystemUser[]) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  turmas,
  onUpdateUsers,
}) => {
  // Filters
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [turmaFilter, setTurmaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEmittedAt, setReportEmittedAt] = useState<{ date: string; time: string } | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleOpenReport = () => {
    const now = new Date();
    setReportEmittedAt({
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    setShowReportModal(true);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const emissionDate = reportEmittedAt?.date || new Date().toLocaleDateString('pt-BR');
        const emissionTime = reportEmittedAt?.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Cabeçalho institucional (Timbre)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 96, 41); // #646029
        doc.text('QUARTEL GENERAL UMADESPA', 105, 14, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(8, 37, 0); // #082500
        doc.text('ESCRITORES QGU', 105, 21, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(82, 89, 77); // #52594d
        doc.text('Relatório de Usuários Cadastrados no Sistema', 105, 27, { align: 'center' });

        // Linha divisória verde COMIEADEPA/QGU
        doc.setDrawColor(18, 61, 0); // #123d00
        doc.setLineWidth(0.8);
        doc.line(14, 30, 196, 30);

        // Bloco de Metadados e Filtros
        doc.setFillColor(248, 250, 244); // #f8faf4
        doc.setDrawColor(194, 201, 185); // #c2c9b9
        doc.roundedRect(14, 33, 182, 19, 2, 2, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 37, 0);
        doc.text('Data de Emissão:', 18, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(`${emissionDate} às ${emissionTime}`, 45, 39);

        doc.setFont('helvetica', 'bold');
        doc.text('Filtro Perfil:', 18, 44);
        doc.setFont('helvetica', 'normal');
        const roleLabelText =
          roleFilter === 'ALL'
            ? 'Todos os Usuários'
            : roleFilter === 'admin'
            ? 'Coordenadores (Admin)'
            : roleFilter === 'professor'
            ? 'Professores Avaliadores'
            : 'Alunos Vocacionados';
        doc.text(roleLabelText, 45, 44);

        doc.setFont('helvetica', 'bold');
        doc.text('Turma:', 18, 49);
        doc.setFont('helvetica', 'normal');
        const turmaLabelText =
          turmaFilter === 'ALL'
            ? 'Todas as Turmas'
            : turmas.find((t) => t.id === turmaFilter)?.name || turmaFilter;
        doc.text(turmaLabelText, 45, 49);

        doc.setFont('helvetica', 'bold');
        doc.text('Registros Listados:', 118, 39);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(18, 61, 0);
        doc.text(`${filteredUsers.length} usuários`, 146, 39);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 37, 0);
        doc.text('Coordenação:', 118, 44);
        doc.setFont('helvetica', 'normal');
        doc.text('Lucas Pimenta', 146, 44);

        // Tabela formatada
        const tableRows = filteredUsers.map((u, index) => {
          const turmaObj = turmas.find((t) => t.id === u.turmaId);
          return [
            String(index + 1),
            u.name,
            u.roleLabel,
            turmaObj?.name || 'Geral',
            u.campoSupervisao || u.polo || '-',
            u.whatsapp || '-',
            u.status || 'Ativo',
          ];
        });

        autoTable(doc, {
          startY: 56,
          head: [['#', 'Nome Completo', 'Perfil / Função', 'Turma', 'Campo / Supervisão', 'WhatsApp', 'Status']],
          body: tableRows,
          headStyles: {
            fillColor: [18, 61, 0],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [25, 28, 25],
          },
          alternateRowStyles: {
            fillColor: [248, 250, 244],
          },
          styles: {
            cellPadding: 2,
            overflow: 'linebreak',
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 40, fontStyle: 'bold' },
            2: { cellWidth: 32 },
            3: { cellWidth: 26 },
            4: { cellWidth: 38 },
            5: { cellWidth: 24 },
            6: { cellWidth: 14, halign: 'center' },
          },
          didDrawPage: (data) => {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(115, 121, 108);
            doc.text(
              `Quartel General UMADESPA • Escritores QGU — Página ${data.pageNumber}`,
              14,
              pageHeight - 8
            );
          },
        });

        // Bloco de Assinaturas
        const finalY = (doc as any).lastAutoTable?.finalY || 160;
        const pageHeight = doc.internal.pageSize.getHeight();
        let signatureY = finalY + 22;

        if (signatureY + 24 > pageHeight - 15) {
          doc.addPage();
          signatureY = 35;
        }

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(30, signatureY, 85, signatureY);
        doc.line(125, signatureY, 180, signatureY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 37, 0);
        doc.text('Coordenação Teológica', 57.5, signatureY + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text('LUCAS PIMENTA', 57.5, signatureY + 8, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 37, 0);
        doc.text('Diretor QGU', 152.5, signatureY + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Pr. Jesiel Calderaro', 152.5, signatureY + 8, { align: 'center' });

        // Gera e dispara download direto no navegador
        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `relatorio_usuarios_escritores_qgu_${dateStr}.pdf`;
        doc.save(fileName);

        notify('PDF gerado e baixado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        notify('Erro ao gerar PDF diretamente. Abrindo visualização para impressão...', 'danger');
        window.print();
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    campoSupervisao: '',
    role: 'aluno' as UserRole,
    password: 'comieadepa2026',
    turmaId: 'turma-2026',
    disciplina: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  // Notification Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const notify = (text: string, type: 'success' | 'danger' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Turma filter
      if (turmaFilter !== 'ALL') {
        // If turmaId matches or fallback for legacy
        if (u.turmaId !== turmaFilter && !(turmaFilter === 'turma-2026' && !u.turmaId)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesWhatsapp = u.whatsapp.toLowerCase().includes(query);
        const matchesCampo = (u.campoSupervisao || u.polo || '').toLowerCase().includes(query);
        const matchesDisciplina = u.disciplina?.toLowerCase().includes(query) || false;
        const matchesRole = u.roleLabel.toLowerCase().includes(query);
        const matchesStatus = (u.status || 'Ativo').toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesWhatsapp && !matchesCampo && !matchesDisciplina && !matchesRole && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, turmaFilter, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (user: SystemUser) => {
    setUserToEdit(user);
    setFormData({
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      campoSupervisao: user.campoSupervisao || user.polo || '',
      role: user.role,
      password: user.password,
      turmaId: user.turmaId || 'turma-2026',
      disciplina: user.disciplina || '',
      status: user.status || 'Ativo',
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      whatsapp: '',
      campoSupervisao: '',
      role: 'aluno',
      password: 'comieadepa2026',
      turmaId: turmas[0]?.id || 'turma-2026',
      disciplina: '',
      status: 'Ativo',
    });
    setShowCreateModal(true);
  };

  // Save (Create or Edit)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      notify('Preencha o nome e e-mail do usuário.', 'danger');
      return;
    }

    const parts = formData.name.trim().split(' ').filter(Boolean);
    let initials = 'US';
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts[0]) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }

    const firstWord = parts[0] || 'User';
    const routeSlug =
      formData.role === 'admin'
        ? '/Paineladm'
        : formData.role === 'professor'
        ? `/Prof${firstWord}`
        : `/turma2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const roleLabel =
      formData.role === 'admin'
        ? 'COORDENADOR / ADMIN'
        : formData.role === 'professor'
        ? 'PROFESSOR TITULAR'
        : 'ALUNO VOCACIONADO';

    if (userToEdit) {
      // Update existing
      const updatedList = users.map((u) => {
        if (u.id === userToEdit.id) {
          return {
            ...u,
            name: formData.name.trim(),
            email: formData.email.trim(),
            whatsapp: formData.whatsapp.trim() || u.whatsapp,
            campoSupervisao: formData.campoSupervisao.trim() || 'Geral',
            polo: formData.campoSupervisao.trim() || u.polo,
            role: formData.role,
            roleLabel,
            password: formData.password.trim() || u.password,
            turmaId: formData.turmaId,
            disciplina: formData.role === 'professor' ? formData.disciplina.trim() || 'Teologia Bíblica' : undefined,
            status: formData.status,
            initials,
          };
        }
        return u;
      });
      onUpdateUsers(updatedList);
      setUserToEdit(null);
      notify(`Usuário ${formData.name} atualizado com sucesso!`);
    } else {
      // Create new
      const newUser: SystemUser = {
        id: `user-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        campoSupervisao: formData.campoSupervisao.trim() || 'Geral',
        polo: formData.campoSupervisao.trim() || 'Geral',
        role: formData.role,
        roleLabel,
        password: formData.password.trim() || 'comieadepa2026',
        initials,
        routeSlug,
        turmaId: formData.turmaId,
        disciplina: formData.role === 'professor' ? formData.disciplina.trim() || 'Teologia Bíblica' : undefined,
        matricula: formData.role === 'aluno' ? routeSlug.replace('/', '') : undefined,
        status: formData.status,
      };
      onUpdateUsers([newUser, ...users]);
      setShowCreateModal(false);
      notify(`Usuário ${newUser.name} cadastrado com sucesso!`);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === 'user-admin-1') {
      notify('O administrador principal do sistema não pode ser excluído.', 'danger');
      setUserToDelete(null);
      return;
    }
    const updated = users.filter((u) => u.id !== userToDelete.id);
    onUpdateUsers(updated);
    notify(`Usuário "${userToDelete.name}" excluído.`);
    setUserToDelete(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nome Completo', 'E-mail', 'WhatsApp', 'Campo / Supervisão', 'Perfil', 'Turma', 'Disciplina', 'Status'];
    const rows = filteredUsers.map((u) => {
      const turma = turmas.find((t) => t.id === u.turmaId);
      const turmaNome = turma ? turma.name : 'Geral';
      return [
        `"${u.id}"`,
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.whatsapp}"`,
        `"${u.campoSupervisao || u.polo || '-'}"`,
        `"${u.roleLabel}"`,
        `"${turmaNome}"`,
        `"${u.disciplina || '-'}"`,
        `"${u.status || 'Ativo'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_usuarios_escritores_qgu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Relatório CSV de usuários exportado!');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white text-xs font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-[#123d00]' : 'bg-[#b91c1c]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Gestão de Usuários */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#123d00] text-white">
            <Users className="w-5 h-5 text-[#a2d486]" />
          </span>
          <h2 className="font-display text-2xl font-bold text-[#082500]">
            Gestão de Usuários
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenReport}
            className="px-4 py-2.5 rounded-xl bg-[#646029] hover:bg-[#4d4a1f] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Visualizar e gerar relatório de usuários de acordo com os filtros aplicados"
          >
            <Printer className="w-4 h-4 text-[#e7e393]" />
            <span>Gerar Relatório</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#a2d486]" />
            <span>Cadastrar Usuário</span>
          </button>
        </div>
      </div>

      {/* FILTROS OBRIGATÓRIOS: Coordenador, Professor, Aluno, Turma + Busca */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#646029] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros da Tabela de Usuários</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtro por Perfil / Papel */}
          <div>
            <label className="text-[11px] font-bold text-[#42493d] block mb-1">
              Perfil / Papel:
            </label>
            <div className="flex rounded-xl bg-[#f4f6f0] p-1 border border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-[#123d00] text-white shadow-2xs'
                    : 'text-[#42493d] hover:text-[#123d00]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-[#123d00] text-white shadow-2xs'
                    : 'text-[#42493d] hover:text-[#123d00]'
                }`}
              >
                Coord.
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('professor')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  roleFilter === 'professor'
                    ? 'bg-[#123d00] text-white shadow-2xs'
                    : 'text-[#42493d] hover:text-[#123d00]'
                }`}
              >
                Prof. Titular
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('aluno')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  roleFilter === 'aluno'
                    ? 'bg-[#123d00] text-white shadow-2xs'
                    : 'text-[#42493d] hover:text-[#123d00]'
                }`}
              >
                Aluno
              </button>
            </div>
          </div>

          {/* Filtro por Turma */}
          <div>
            <label className="text-[11px] font-bold text-[#42493d] block mb-1">
              Filtrar por Turma:
            </label>
            <select
              value={turmaFilter}
              onChange={(e) => setTurmaFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
            >
              <option value="ALL">Todas as Turmas Cadastradas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Busca por Texto */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-[#42493d] block mb-1">
              Buscar Usuário:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#73796c] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por nome, e-mail, WhatsApp, campo/supervisão ou turma..."
                className="w-full pl-9 pr-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#646029] pt-2 border-t border-[#f0f2eb]">
          <span>
            Exibindo <strong>{filteredUsers.length}</strong> de {users.length} usuários cadastrados
          </span>
          {(roleFilter !== 'ALL' || turmaFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('ALL');
                setTurmaFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-[#b91c1c] hover:underline font-bold cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* TABELA DE USUÁRIOS */}
      <div className="bg-white border border-[#c2c9b9]/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="w-full max-w-full overflow-hidden">
          <table className="w-full text-left text-xs border-collapse table-fixed sm:table-auto">
            <thead>
              <tr className="border-b border-[#e1e3dd] bg-[#f8faf4] text-[#646029] uppercase tracking-wider font-bold text-[10px] sm:text-xs">
                <th className="py-2.5 px-2 sm:p-3.5 text-left w-[42%] sm:w-auto">Usuário</th>
                <th className="py-2.5 px-1 sm:p-3.5 text-center sm:text-left w-[26%] sm:w-auto">Perfil</th>
                <th className="hidden md:table-cell p-3.5">Turma</th>
                <th className="py-2.5 px-1 sm:p-3.5 text-center w-[14%] sm:w-auto">WhatsApp</th>
                <th className="hidden lg:table-cell p-3.5">Status</th>
                <th className="py-2.5 px-1 sm:p-3.5 text-right sm:text-center w-[18%] sm:w-auto">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e3dd]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#73796c]">
                    Nenhum usuário localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const turmaObj = turmas.find((t) => t.id === u.turmaId);
                  const turmaName = turmaObj?.name || 'Turma Geral';
                  const cleanPhone = (u.whatsapp || '').replace(/\D/g, '');
                  const waMessage = encodeURIComponent(
                    `Olá ${u.name}, a Paz do Senhor! Entramos em contato através da coordenação do Treinamento Escritores QGU.`
                  );
                  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${waMessage}` : null;

                  return (
                    <tr key={u.id} className="hover:bg-[#fafbf8] transition-colors">
                      {/* Usuário: Nome com indicador de status e turma no mobile */}
                      <td className="py-2 px-2 sm:p-3.5 align-middle">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 sm:hidden ${
                                (u.status || 'Ativo') === 'Ativo' ? 'bg-[#15803d]' : 'bg-[#b91c1c]'
                              }`}
                              title={`Status: ${u.status || 'Ativo'}`}
                            />
                            <span className="font-bold text-[#082500] text-xs truncate block" title={u.name}>
                              {u.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#73796c] block sm:hidden truncate mt-0.5" title={turmaName}>
                            {turmaName}
                          </span>
                        </div>
                      </td>

                      {/* Perfil de acesso */}
                      <td className="py-2 px-1 sm:p-3.5 text-center sm:text-left align-middle">
                        <span
                          className={`text-[9.5px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full inline-block truncate max-w-full ${
                            u.role === 'admin'
                              ? 'bg-[#123d00]/10 text-[#123d00] border border-[#123d00]/20'
                              : u.role === 'professor'
                              ? 'bg-[#646029]/15 text-[#646029] border border-[#646029]/20'
                              : 'bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/20'
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {u.role === 'admin'
                              ? 'Coordenador / Admin'
                              : u.role === 'professor'
                              ? 'Professor Titular'
                              : 'Aluno Vocacionado'}
                          </span>
                          <span className="sm:hidden">
                            {u.role === 'admin' ? 'Admin' : u.role === 'professor' ? 'Professor' : 'Aluno'}
                          </span>
                        </span>
                      </td>

                      {/* Turma (Desktop) */}
                      <td className="hidden md:table-cell p-3.5 align-middle">
                        <span className="text-xs font-semibold text-[#191c19] bg-[#f4f6f0] px-2.5 py-1 rounded-lg border border-[#e1e3dd]">
                          {turmaName}
                        </span>
                      </td>

                      {/* WhatsApp: Botão de Whatsapp apenas o ícone */}
                      <td className="py-2 px-1 sm:p-3.5 text-center align-middle">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] hover:text-[#075E54] border border-[#25D366]/30 transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs group shrink-0"
                            title={`Enviar mensagem no WhatsApp para ${u.name} (${u.whatsapp})`}
                            aria-label={`WhatsApp ${u.name}`}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current group-hover:scale-110 transition-transform shrink-0" />
                          </a>
                        ) : (
                          <span
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f4f6f0] text-[#73796c] border border-[#e1e3dd] inline-flex items-center justify-center opacity-40 cursor-not-allowed shrink-0"
                            title="WhatsApp não cadastrado"
                            aria-label="WhatsApp não cadastrado"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                          </span>
                        )}
                      </td>

                      {/* Status (Desktop) */}
                      <td className="hidden lg:table-cell p-3.5 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (u.status || 'Ativo') === 'Ativo'
                              ? 'bg-[#15803d]/15 text-[#15803d] border border-[#15803d]/30'
                              : 'bg-[#52594d]/15 text-[#52594d] border border-[#52594d]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (u.status || 'Ativo') === 'Ativo' ? 'bg-[#15803d]' : 'bg-[#73796c]'
                            }`}
                          />
                          {u.status || 'Ativo'}
                        </span>
                      </td>

                      {/* Ações: Botões para editar e excluir apenas o ícone */}
                      <td className="py-2 px-1 sm:p-3.5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                            title={`Editar dados de ${u.name}`}
                            aria-label="Editar usuário"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          </button>

                          {u.id !== 'user-admin-1' && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-[#fca5a5] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                              title={`Excluir usuário ${u.name}`}
                              aria-label="Excluir usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CADASTRAR OU EDITAR USUÁRIO */}
      {(showCreateModal || userToEdit) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  {userToEdit ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setUserToEdit(null);
                }}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Nome Completo */}
            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Nome Completo <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pr. Daniel Miranda"
                className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            {/* 2 e 3. E-mail e WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  E-mail <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@comieadepa.org"
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(91) 98000-0000"
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            {/* 4. Campo / Vínculo (apenas para alunos e coordenação) */}
            {formData.role !== 'professor' ? (
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Campo Eclesiástico
                </label>
                <input
                  type="text"
                  value={formData.campoSupervisao}
                  onChange={(e) => setFormData({ ...formData, campoSupervisao: e.target.value })}
                  placeholder="Ex: Campo Belém Central"
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-medium text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                />
                <p className="text-[11px] text-[#73796c] mt-1">
                  Campo eclesiástico correspondente à igreja/supervisão regional.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#f4f6f0] border border-[#c2c9b9] rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#082500] block">Vínculo Docente:</span>
                <p className="text-[#52594d]">
                  O Professor Titular terá vínculo exclusivamente com as turmas selecionadas abaixo, sem vínculo direto com Campos ou outras estruturas administrativas.
                </p>
              </div>
            )}

            {/* 5. Perfil de Acesso */}
            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Perfil de Acesso
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setFormData({
                    ...formData,
                    role: newRole,
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
              >
                <option value="admin">Coordenador / Admin</option>
                <option value="professor">Professor Titular</option>
                <option value="aluno">Aluno Vocacionado</option>
              </select>
            </div>

            {/* 6. Turma de Vinculação */}
            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Turma de Vinculação
              </label>
              <select
                value={formData.turmaId}
                onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Status Inicial (Ativo ou Inativo) */}
            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1.5">
                Status Inicial
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Ativo' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    formData.status === 'Ativo'
                      ? 'bg-[#123d00] text-white border-[#123d00] shadow-2xs'
                      : 'bg-[#f8faf4] text-[#52594d] border-[#c2c9b9] hover:bg-[#f0f2eb]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.status === 'Ativo' ? 'bg-[#a2d486]' : 'bg-[#52594d]'}`}></span>
                  <span>Ativo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'Inativo' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    formData.status === 'Inativo'
                      ? 'bg-[#52594d] text-white border-[#52594d] shadow-2xs'
                      : 'bg-[#f8faf4] text-[#52594d] border-[#c2c9b9] hover:bg-[#f0f2eb]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.status === 'Inativo' ? 'bg-amber-300' : 'bg-[#73796c]'}`}></span>
                  <span>Inativo</span>
                </button>
              </div>
            </div>

            {/* Senha de Acesso */}
            <div>
              <label className="text-xs font-bold text-[#191c19] block mb-1">
                Senha de Acesso ao Sistema
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha de acesso"
                className="w-full px-3.5 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#123d00]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setUserToEdit(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {userToEdit ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIRMAR DELEÇÃO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-display font-bold text-lg text-[#082500]">
              Confirmar Exclusão de Usuário
            </h3>
            <p className="text-xs text-[#52594d] leading-relaxed">
              Tem certeza que deseja remover o usuário <strong>{userToDelete.name}</strong> ({userToDelete.roleLabel})? Esta ação revogará imediatamente o acesso ao sistema.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RELATÓRIO TIMBRADO DE USUÁRIOS */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          {/* Estilo para garantir download/impressão limpa em PDF */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-user-report, #printable-user-report * {
                  visibility: visible !important;
                }
                #printable-user-report {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 12mm 15mm !important;
                  background: white !important;
                  color: black !important;
                  border: none !important;
                  box-shadow: none !important;
                  z-index: 9999999 !important;
                }
                .print-hide {
                  display: none !important;
                }
              }
            `,
            }}
          />

          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 sm:p-8 max-w-4xl w-full space-y-6 shadow-2xl my-8">
            {/* Cabeçalho do modal com os 3 botões solicitados */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd] print-hide">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#123d00]" />
                <div>
                  <h3 className="font-display font-bold text-lg text-[#082500]">
                    Relatório de Usuários
                  </h3>
                  <p className="text-[11px] text-[#52594d]">
                    Gerado com base nos filtros atualmente selecionados
                  </p>
                </div>
              </div>

              {/* Os 3 Botões Obrigatórios: "Exportar em CSV", "Baixar" (PDF) e "Fechar" */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Exportar em CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f6f0] hover:bg-[#eaece5] border border-[#c2c9b9] text-[#191c19] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  title="Exporta uma tabela que pode ser usada no Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#15803d]" />
                  <span>Exportar em CSV</span>
                </button>

                {/* 2. Baixar (Gera documento em PDF) */}
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] disabled:bg-[#52594d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Gera e baixa o documento em PDF do relatório"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#a2d486] animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#a2d486]" />
                      <span>Baixar</span>
                    </>
                  )}
                </button>

                {/* 3. Fechar */}
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-[#52594d] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Fechar relatório"
                >
                  <X className="w-4 h-4 text-[#73796c]" />
                  <span>Fechar</span>
                </button>
              </div>
            </div>

            {/* Documento do Relatório Timbrado */}
            <div id="printable-user-report" className="border border-[#c2c9b9] rounded-2xl p-6 sm:p-8 space-y-6 bg-white text-[#191c19]">
              {/* Timbre Oficial */}
              <div className="text-center pb-4 border-b-2 border-[#123d00] space-y-1">
                <span className="text-[10px] font-extrabold text-[#646029] tracking-widest uppercase block">
                  Quartel General UMADESPA
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-black text-[#082500]">
                  ESCRITORES QGU
                </h1>
                <p className="text-xs text-[#52594d] font-medium">
                  Relatório de Usuários Cadastrados no Sistema
                </p>
              </div>

              {/* Data e Hora de Emissão com Destaque */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-[#f8faf4] border border-[#c2c9b9]/70 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-[#082500]">
                  <Calendar className="w-4 h-4 text-[#123d00]" />
                  <span>
                    <strong>Data de Emissão:</strong> {reportEmittedAt?.date || new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#082500]">
                  <Clock className="w-4 h-4 text-[#123d00]" />
                  <span>
                    <strong>Hora de Emissão:</strong> {reportEmittedAt?.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Detalhamento dos Filtros Utilizados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#f8faf4] p-3.5 rounded-xl border border-[#e1e3dd]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#73796c] block">Filtro Perfil:</span>
                  <strong className="text-[#082500]">
                    {roleFilter === 'ALL'
                      ? 'Todos os Usuários'
                      : roleFilter === 'admin'
                      ? 'Coordenadores (Admin)'
                      : roleFilter === 'professor'
                      ? 'Professores / Docentes'
                      : 'Alunos Vocacionados'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#73796c] block">Filtro Turma:</span>
                  <strong className="text-[#082500]">
                    {turmaFilter === 'ALL'
                      ? 'Todas as Turmas'
                      : turmas.find((t) => t.id === turmaFilter)?.name || turmaFilter}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#73796c] block">Usuários no Relatório:</span>
                  <strong className="text-[#123d00]">{filteredUsers.length} registros</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#73796c] block">Coordenação Responsável:</span>
                  <strong className="text-[#082500]">Lucas Pimenta</strong>
                </div>
              </div>

              {/* Tabela de Usuários Filtrados */}
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center bg-[#f8faf4] rounded-2xl border border-dashed border-[#c2c9b9] text-xs text-[#73796c]">
                  Nenhum usuário localizado para os filtros selecionados (Perfil: {roleFilter}, Turma: {turmaFilter}).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#123d00] text-[#082500] uppercase tracking-wider font-bold">
                        <th className="py-2 px-1">#</th>
                        <th className="py-2 px-1">Nome Completo</th>
                        <th className="py-2 px-1">Perfil / Função</th>
                        <th className="py-2 px-1">Turma Vinculada</th>
                        <th className="py-2 px-1">WhatsApp</th>
                        <th className="py-2 px-1">Campo / Supervisão</th>
                        <th className="py-2 px-1 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3dd]">
                      {filteredUsers.map((u, i) => {
                        const turmaObj = turmas.find((t) => t.id === u.turmaId);
                        return (
                          <tr key={u.id} className="text-[11px] hover:bg-[#f8faf4]">
                            <td className="py-2 px-1 text-[#73796c] font-mono">{i + 1}</td>
                            <td className="py-2 px-1 font-bold text-[#082500]">{u.name}</td>
                            <td className="py-2 px-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-[#123d00]/10 text-[#123d00]'
                                    : u.role === 'professor'
                                    ? 'bg-[#646029]/15 text-[#4d4a1f]'
                                    : 'bg-[#15803d]/15 text-[#15803d]'
                                }`}
                              >
                                {u.roleLabel}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-[#52594d]">{turmaObj?.name || 'Geral'}</td>
                            <td className="py-2 px-1 text-[#52594d]">{u.whatsapp}</td>
                            <td className="py-2 px-1 text-[#52594d]">
                              <span>{u.campoSupervisao || u.polo || '-'}</span>
                              {u.disciplina && (
                                <span className="block text-[10px] text-[#123d00]">({u.disciplina})</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  (u.status || 'Ativo') === 'Ativo'
                                    ? 'bg-[#15803d]/15 text-[#15803d]'
                                    : 'bg-[#52594d]/15 text-[#52594d]'
                                }`}
                              >
                                {u.status || 'Ativo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Assinatura Oficial */}
              <div className="pt-8 border-t border-[#e1e3dd] grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-black w-48 mx-auto"></div>
                  <span className="font-bold text-[#082500] block">Coordenação Teológica</span>
                  <span className="text-[10px] text-[#73796c]">LUCAS PIMENTA</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-black w-48 mx-auto"></div>
                  <span className="font-bold text-[#082500] block">Diretor QGU</span>
                  <span className="text-[10px] text-[#73796c]">Pr. Jesiel Calderaro</span>
                </div>
              </div>
            </div>

            {/* Rodapé do modal com os 3 botões também acessíveis ao final da página */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#e1e3dd] print-hide">
              <span className="text-xs text-[#52594d]">
                Total de registros: <strong>{filteredUsers.length}</strong> usuários listados
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f6f0] hover:bg-[#eaece5] border border-[#c2c9b9] text-[#191c19] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#15803d]" />
                  <span>Exportar em CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] disabled:bg-[#52594d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#a2d486] animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#a2d486]" />
                      <span>Baixar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-[#52594d] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#73796c]" />
                  <span>Fechar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
