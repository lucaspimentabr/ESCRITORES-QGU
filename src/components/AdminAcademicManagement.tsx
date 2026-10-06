import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Search,
  Key,
  Building,
  ShieldCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  Turma,
  SystemUser,
  AcademicModule,
  StudentAcademicRecord,
  MuralAviso,
  UserRole,
} from '../types';

interface AdminAcademicManagementProps {
  turmas: Turma[];
  users: SystemUser[];
  modules: AcademicModule[];
  students: StudentAcademicRecord[];
  avisos: MuralAviso[];
  onUpdateTurmas: (turmas: Turma[]) => void;
  onUpdateUsers: (users: SystemUser[]) => void;
  onUpdateAvisos: (avisos: MuralAviso[]) => void;
  onOpenReportModal: () => void;
}

export const AdminAcademicManagement: React.FC<AdminAcademicManagementProps> = ({
  turmas,
  users,
  modules,
  students,
  avisos,
  onUpdateTurmas,
  onUpdateUsers,
  onUpdateAvisos,
  onOpenReportModal,
}) => {
  const [subTab, setSubTab] = useState<
    'turmas' | 'alunos' | 'usuarios' | 'material' | 'mural' | 'relatorios'
  >('turmas');

  // Turma form state
  const [showTurmaModal, setShowTurmaModal] = useState(false);
  const [turmaNome, setTurmaNome] = useState('');
  const [turmaSlug, setTurmaSlug] = useState('');
  const [turmaVagas, setTurmaVagas] = useState(40);
  const [turmaStatus, setTurmaStatus] = useState<'Aberto' | 'Em Andamento' | 'Concluído'>('Aberto');
  const [turmaEdital, setTurmaEdital] = useState('');

  // User CRUD state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('professor');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [userPass, setUserPass] = useState('comieadepa2026');
  const [userDisciplina, setUserDisciplina] = useState('');
  const [userPolo, setUserPolo] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Mural form state
  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoConteudo, setAvisoConteudo] = useState('');
  const [avisoImportante, setAvisoImportante] = useState(false);

  // Success toast
  const [toast, setToast] = useState('');
  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Handle create Turma
  const handleSaveTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaNome.trim()) return;

    const newTurma: Turma = {
      id: `turma-${Date.now()}`,
      name: turmaNome.trim(),
      urlSlug: (turmaSlug || turmaNome).toLowerCase().replace(/[^a-z0-9]/g, ''),
      status: turmaStatus,
      editalResumo: turmaEdital || `Edital de Seleção Teológica para ${turmaNome}.`,
      dataInicioInscricoes: new Date().toLocaleDateString('pt-BR'),
      dataFimInscricoes: '31/12/2026',
      dataInicioAulas: '15/05/2026',
      dataConclusao: '15/12/2026',
      vagas: turmaVagas,
      inscritosCount: 0,
      matriculadosCount: 0,
    };

    onUpdateTurmas([newTurma, ...turmas]);
    setShowTurmaModal(false);
    setTurmaNome('');
    setTurmaSlug('');
    notify(`Turma "${newTurma.name}" criada com sucesso!`);
  };

  // Handle create User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    const parts = userName.trim().split(' ').filter(Boolean);
    let initials = 'US';
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1 && parts[0]) {
      initials = parts[0].slice(0, 2).toUpperCase();
    } else if (userName.trim()) {
      initials = userName.trim().slice(0, 2).toUpperCase();
    }

    const firstWord = parts[0] || 'User';
    const routeSlug =
      userRole === 'admin'
        ? '/Paineladm'
        : userRole === 'professor'
        ? `/Prof${firstWord}`
        : `/turma2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: SystemUser = {
      id: `user-${Date.now()}`,
      name: userName.trim(),
      email: userEmail.trim(),
      whatsapp: userWhatsapp.trim() || '(91) 98000-0000',
      role: userRole,
      password: userPass.trim() || 'comieadepa2026',
      initials,
      roleLabel:
        userRole === 'admin'
          ? 'COORDENAÇÃO TEOLÓGICA (ADMIN)'
          : userRole === 'professor'
          ? 'PROFESSOR AVALIADOR'
          : 'ALUNO VOCACIONADO',
      routeSlug,
      disciplina: userRole === 'professor' ? userDisciplina || 'Teologia Bíblica' : undefined,
      polo: userRole === 'aluno' ? userPolo || 'Polo Belém' : undefined,
      matricula: userRole === 'aluno' ? routeSlug.replace('/', '') : undefined,
    };

    onUpdateUsers([newUser, ...users]);
    setShowUserModal(false);
    setUserName('');
    setUserEmail('');
    setUserWhatsapp('');
    setUserDisciplina('');
    setUserPolo('');
    notify(`Usuário ${newUser.name} (${newUser.roleLabel}) cadastrado com sucesso!`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Deseja realmente remover este usuário do sistema?')) {
      onUpdateUsers(users.filter((u) => u.id !== userId));
      notify('Usuário removido do sistema.');
    }
  };

  // Handle create Aviso
  const handleSaveAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo.trim() || !avisoConteudo.trim()) return;

    const newAviso: MuralAviso = {
      id: `aviso-${Date.now()}`,
      turmaId: 'turma-2026',
      autorNome: 'Lucas Pimenta',
      autorRole: 'Coordenação Teológica (Admin)',
      titulo: avisoTitulo.trim(),
      conteudo: avisoConteudo.trim(),
      data: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      importante: avisoImportante,
    };

    onUpdateAvisos([newAviso, ...avisos]);
    setShowAvisoModal(false);
    setAvisoTitulo('');
    setAvisoConteudo('');
    setAvisoImportante(false);
    notify('Aviso oficial publicado no mural da turma!');
  };

  const handleDeleteAviso = (id: string) => {
    onUpdateAvisos(avisos.filter((a) => a.id !== id));
    notify('Aviso removido do mural.');
  };

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.polo && u.polo.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Subnav Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#e1e3dd] pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('turmas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
              subTab === 'turmas'
                ? 'bg-[#123d00] text-white shadow-none'
                : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Processos Seletivos & Turmas</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('alunos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
              subTab === 'alunos'
                ? 'bg-[#123d00] text-white shadow-none'
                : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Gestão Acadêmica da Turma</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('usuarios')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
              subTab === 'usuarios'
                ? 'bg-[#123d00] text-white shadow-none'
                : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários (CRUD Docentes/Alunos)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('material')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
              subTab === 'material'
                ? 'bg-[#123d00] text-white shadow-none'
                : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Material Didático Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('mural')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
              subTab === 'mural'
                ? 'bg-[#123d00] text-white shadow-none'
                : 'bg-white hover:bg-[#f4f6f0] text-[#42493d] border border-[#e1e3dd] shadow-none'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Mural de Avisos & Editais</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="px-4 py-2 rounded-xl bg-[#646029] hover:bg-[#4a471e] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Relatórios Oficiais (PDF Timbrado)</span>
        </button>
      </div>

      {/* Notification Toast */}
      {toast && (
        <div className="bg-[#123d00] text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
          <span>{toast}</span>
        </div>
      )}

      {/* SUBTAB 1: TURMAS E PROCESSOS SELETIVOS */}
      {subTab === 'turmas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Gestão de Processos Seletivos e Turmas
              </h2>
              <p className="text-xs text-[#646029]">
                Criação de novas edições, controle de vagas, status de edital e acompanhamento do ciclo de vida da turma.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTurmaModal(true)}
              className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Turma</span>
            </button>
          </div>

          {/* Turmas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {turmas.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#123d00]/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        t.status === 'Aberto'
                          ? 'bg-[#15803d]/10 text-[#15803d]'
                          : t.status === 'Em Andamento'
                          ? 'bg-[#123d00]/10 text-[#123d00]'
                          : 'bg-[#73796c]/10 text-[#73796c]'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-xs text-[#73796c] font-semibold">
                      Slug: /{t.urlSlug}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#082500] font-display">
                    {t.name}
                  </h3>

                  <p className="text-xs text-[#42493d] leading-relaxed">
                    {t.editalResumo}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#f8faf4] border border-[#e1e3dd] text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Vagas
                      </span>
                      <span className="font-bold text-[#191c19]">{t.vagas}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Inscritos
                      </span>
                      <span className="font-bold text-[#123d00]">{t.inscritosCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#73796c] block">
                        Matriculados
                      </span>
                      <span className="font-bold text-[#15803d]">{t.matriculadosCount}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#646029] pt-2 border-t border-[#f0f2eb]">
                    <div>Início das Inscrições: {t.dataInicioInscricoes}</div>
                    <div>Início das Aulas: {t.dataInicioAulas}</div>
                    <div>Previsão de Conclusão: {t.dataConclusao}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#f0f2eb]">
                  <span className="text-[11px] text-[#73796c]">
                    Edição homologada COMIEADEPA
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus: Record<string, 'Aberto' | 'Em Andamento' | 'Concluído'> = {
                          Aberto: 'Em Andamento',
                          'Em Andamento': 'Concluído',
                          Concluído: 'Aberto',
                        };
                        const updated = turmas.map((item) =>
                          item.id === t.id ? { ...item, status: nextStatus[item.status] } : item
                        );
                        onUpdateTurmas(updated);
                        notify(`Status da turma "${t.name}" atualizado!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] text-xs font-bold text-[#191c19] cursor-pointer"
                    >
                      Alterar Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Nova Turma */}
          {showTurmaModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveTurma}
                className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-xl animate-in zoom-in-95"
              >
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Criar Novo Processo Seletivo / Turma
                </h3>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Nome Oficial da Turma
                  </label>
                  <input
                    type="text"
                    required
                    value={turmaNome}
                    onChange={(e) => setTurmaNome(e.target.value)}
                    placeholder="Ex: Turma 2027 • Formação Avançada de Autores"
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      URL Slug (Rota de Inscrição)
                    </label>
                    <input
                      type="text"
                      value={turmaSlug}
                      onChange={(e) => setTurmaSlug(e.target.value)}
                      placeholder="Ex: turma2027"
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      Número de Vagas
                    </label>
                    <input
                      type="number"
                      value={turmaVagas}
                      onChange={(e) => setTurmaVagas(parseInt(e.target.value) || 40)}
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={turmaStatus}
                    onChange={(e) => setTurmaStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="Aberto">Aberto (Inscrições Abertas)</option>
                    <option value="Em Andamento">Em Andamento (Aulas Iniciadas)</option>
                    <option value="Concluído">Concluído (Turma Graduada)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Resumo do Edital de Seleção
                  </label>
                  <textarea
                    rows={3}
                    value={turmaEdital}
                    onChange={(e) => setTurmaEdital(e.target.value)}
                    placeholder="Descrição institucional e requisitos eclesiásticos..."
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTurmaModal(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#c2c9b9] text-xs font-bold text-[#42493d] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Salvar e Ativar Turma
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: GESTÃO ACADÊMICA DA TURMA */}
      {subTab === 'alunos' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Acompanhamento Acadêmico • Turma 2026
              </h2>
              <p className="text-xs text-[#646029]">
                Notas consolidadas, frequência de aulas e trabalhos enviados pelos vocacionados.
              </p>
            </div>

            <span className="text-xs bg-[#f4f6f0] text-[#123d00] font-bold px-3 py-1.5 rounded-xl border border-[#e1e3dd]">
              {students.length} Alunos Matriculados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e1e3dd] bg-[#f8faf4] text-[#646029] uppercase tracking-wider font-bold">
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Aluno</th>
                  <th className="p-3">Polo Regional</th>
                  <th className="p-3 text-center">Frequência</th>
                  <th className="p-3 text-center">Média Geral</th>
                  <th className="p-3 text-center">Trabalhos Entregues</th>
                  <th className="p-3 text-right">Status Acadêmico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3dd]">
                {students.map((st) => (
                  <tr key={st.alunoId} className="hover:bg-[#fafbf8]">
                    <td className="p-3 font-bold text-[#646029]">{st.matricula}</td>
                    <td className="p-3 font-bold text-[#082500]">{st.alunoName}</td>
                    <td className="p-3 text-[#73796c]">{st.polo}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-[#15803d]">{st.frequenciaPercent}%</span>
                      <span className="text-[10px] text-[#73796c] block">
                        ({st.presencas}/{st.aulasTotais} aulas)
                      </span>
                    </td>
                    <td className="p-3 text-center font-display text-sm font-bold text-[#123d00]">
                      {st.mediaGeral.toFixed(1)}
                    </td>
                    <td className="p-3 text-center font-semibold text-[#191c19]">
                      {st.submissions.length} atividades
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#15803d]/10 text-[#15803d]">
                        {st.statusAcademico}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: USUÁRIOS (CRUD) */}
      {subTab === 'usuarios' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Gestão de Usuários e Permissões (CRUD)
              </h2>
              <p className="text-xs text-[#646029]">
                Controle integral dos acessos de Coordenação, Professores Avaliadores e Alunos Vocacionados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Usuário</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#73796c] absolute left-3 top-3" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar usuário por nome, email, perfil ou polo..."
              className="w-full pl-9 pr-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e1e3dd] bg-[#f8faf4] text-[#646029] uppercase tracking-wider font-bold">
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Perfil / Papel</th>
                  <th className="p-3">Contato & WhatsApp</th>
                  <th className="p-3">Rota Exclusiva</th>
                  <th className="p-3">Vínculo Acadêmico</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3dd]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafbf8]">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#123d00] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {u.initials}
                        </div>
                        <div>
                          <span className="font-bold text-[#082500] block">{u.name}</span>
                          <span className="text-[11px] text-[#73796c]">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-[#123d00]/10 text-[#123d00]'
                            : u.role === 'professor'
                            ? 'bg-[#646029]/15 text-[#646029]'
                            : 'bg-[#15803d]/10 text-[#15803d]'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3 text-[#191c19]">{u.whatsapp}</td>

                    <td className="p-3 font-bold text-[#646029]">
                      <code>{u.routeSlug}</code>
                    </td>

                    <td className="p-3 text-[#73796c]">
                      {u.disciplina || u.polo || 'Coordenação Geral'}
                    </td>

                    <td className="p-3 text-right">
                      {u.id !== 'user-admin-1' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-[#b91c1c] hover:bg-[#fee2e2] rounded-lg transition-colors cursor-pointer"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Create Modal */}
          {showUserModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveUser}
                className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-xl animate-in zoom-in-95"
              >
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Cadastrar Novo Usuário no Sistema
                </h3>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Tipo de Perfil
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-bold focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="professor">Professor Avaliador (Banca & Aulas)</option>
                    <option value="aluno">Aluno Vocacionado (Turma Vigente)</option>
                    <option value="admin">Coordenação Teológica (Admin Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ex: Pr. Daniel Miranda"
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      E-mail Institucional / Pessoal
                    </label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="usuario@comieadepa.org"
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={userWhatsapp}
                      onChange={(e) => setUserWhatsapp(e.target.value)}
                      placeholder="(91) 98000-0000"
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                {userRole === 'professor' && (
                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      Disciplina / Cadeira Docente
                    </label>
                    <input
                      type="text"
                      value={userDisciplina}
                      onChange={(e) => setUserDisciplina(e.target.value)}
                      placeholder="Ex: Teologia Bíblica e Hermenêutica"
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                )}

                {userRole === 'aluno' && (
                  <div>
                    <label className="text-xs font-bold text-[#191c19] block mb-1">
                      Polo Regional / Igreja
                    </label>
                    <input
                      type="text"
                      value={userPolo}
                      onChange={(e) => setUserPolo(e.target.value)}
                      placeholder="Ex: Polo Santarém / Templo Central"
                      className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Senha Provisória de Acesso
                  </label>
                  <input
                    type="text"
                    value={userPass}
                    onChange={(e) => setUserPass(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#123d00]"
                  />
                  <span className="text-[10px] text-[#73796c]">
                    O usuário poderá alterá-la no primeiro acesso através da edição de perfil.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#c2c9b9] text-xs font-bold text-[#42493d] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: MATERIAL DIDÁTICO */}
      {subTab === 'material' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Material Didático Oficial da Coordenação
              </h2>
              <p className="text-xs text-[#646029]">
                Estruturação do currículo oficial disponibilizado aos alunos e professores das turmas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((m) => (
              <div
                key={m.id}
                className="border border-[#e1e3dd] rounded-2xl p-5 bg-[#fafbf8] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#123d00] uppercase bg-[#123d00]/10 px-2.5 py-0.5 rounded-full">
                    Módulo 0{m.number}
                  </span>
                  <span className="text-xs text-[#73796c]">{m.professorName}</span>
                </div>

                <h3 className="font-bold text-sm text-[#082500]">{m.title}</h3>
                <p className="text-xs text-[#42493d]">{m.description}</p>

                <div className="space-y-1 pt-2 border-t border-[#e1e3dd]">
                  <span className="text-[10px] font-bold text-[#646029] uppercase block">
                    Apostilas Base Oficiais:
                  </span>
                  {m.baseMaterials.map((bm) => (
                    <div
                      key={bm.id}
                      className="flex items-center justify-between bg-white border border-[#e1e3dd] p-2.5 rounded-xl text-xs"
                    >
                      <span className="truncate text-[#191c19] font-medium">{bm.title}</span>
                      <span className="text-[10px] text-[#73796c] shrink-0">{bm.pages}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: MURAL DE AVISOS */}
      {subTab === 'mural' && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1e3dd]">
            <div>
              <h2 className="text-lg font-bold font-display text-[#082500]">
                Mural de Recados & Avisos Integrados
              </h2>
              <p className="text-xs text-[#646029]">
                Publicações de comunicados visíveis instantaneamente nos portais de professores e alunos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAvisoModal(true)}
              className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Aviso</span>
            </button>
          </div>

          <div className="space-y-4">
            {avisos.map((aviso) => (
              <div
                key={aviso.id}
                className="p-5 rounded-2xl border border-[#e1e3dd] bg-[#fafbf8] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {aviso.importante && (
                      <span className="px-2 py-0.5 rounded-md bg-[#123d00] text-white text-[10px] font-extrabold uppercase">
                        Importante
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#646029]">
                      {aviso.autorRole} • {aviso.data}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#082500]">{aviso.titulo}</h3>
                  <p className="text-xs text-[#42493d] leading-relaxed">{aviso.conteudo}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAviso(aviso.id)}
                  className="p-1.5 text-[#b91c1c] hover:bg-[#fee2e2] rounded-lg transition-colors cursor-pointer self-end sm:self-auto shrink-0"
                  title="Excluir comunicado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Modal Novo Aviso */}
          {showAvisoModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveAviso}
                className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-xl animate-in zoom-in-95"
              >
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Publicar Comunicado Oficial no Mural
                </h3>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Título do Aviso
                  </label>
                  <input
                    type="text"
                    required
                    value={avisoTitulo}
                    onChange={(e) => setAvisoTitulo(e.target.value)}
                    placeholder="Ex: Entrega das atividades do Módulo 2"
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Conteúdo do Comunicado
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={avisoConteudo}
                    onChange={(e) => setAvisoConteudo(e.target.value)}
                    placeholder="Descreva as orientações para a turma e corpo docente..."
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-importante"
                    checked={avisoImportante}
                    onChange={(e) => setAvisoImportante(e.target.checked)}
                    className="w-4 h-4 accent-[#123d00] cursor-pointer"
                  />
                  <label htmlFor="chk-importante" className="text-xs font-bold text-[#191c19] cursor-pointer">
                    Marcar como Comunicado Importante / Urgente
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAvisoModal(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#c2c9b9] text-xs font-bold text-[#42493d] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Publicar Aviso
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
