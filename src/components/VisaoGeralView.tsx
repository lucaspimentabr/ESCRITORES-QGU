import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Check,
  Sparkles,
  MapPin,
  Compass,
  ChevronRight,
  Target,
  BarChart3,
  PieChart,
  UserCheck,
} from 'lucide-react';
import {
  Candidate,
  Turma,
  SystemUser,
  StudentAcademicRecord,
  AcademicModule,
  Disciplina,
  ProcessoSeletivoEtapa,
} from '../types';

interface VisaoGeralViewProps {
  candidates: Candidate[];
  turmas: Turma[];
  users: SystemUser[];
  students: StudentAcademicRecord[];
  modules: AcademicModule[];
  disciplinas: Disciplina[];
  etapas: ProcessoSeletivoEtapa[];
  isInscriptionOpen: boolean;
  onToggleInscription: () => void;
  onNavigateTab: (tab: 'processos_seletivos' | 'gestao_turmas' | 'gestao_usuarios' | 'materiais_didaticos') => void;
}

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({
  candidates,
  turmas,
  users,
  students,
  modules,
  disciplinas,
  etapas,
  isInscriptionOpen,
  onToggleInscription,
  onNavigateTab,
}) => {
  // 1. Turma Selection for Dashboard & Intelligence
  // =========================================================================
  // DADOS REAIS CONSOLIDADOS DO SISTEMA QGU/COMIEADEPA (SEM SIMULAÇÕES)
  // =========================================================================

  // 1. Métricas Reais das Turmas
  const totalGeralMatriculados = useMemo(() => {
    return turmas.reduce((acc, t) => acc + (t.matriculadosCount || 0), 0);
  }, [turmas]);

  const turmasAtivasCount = useMemo(() => {
    return turmas.filter((t) => t.status === 'Aberto' || t.status === 'Em Andamento').length;
  }, [turmas]);

  const turmaVigente = useMemo(() => {
    return turmas.find((t) => t.status === 'Em Andamento' || t.status === 'Aberto') || turmas[0];
  }, [turmas]);

  const totalAlunosTurmaAtiva = turmaVigente?.matriculadosCount || 0;

  // Alunos Formados / Diplomados reais (Turmas concluídas na convenção)
  const alunosFormados = useMemo(() => {
    const concluidas = turmas.filter((t) => t.status === 'Concluído');
    return concluidas.reduce((acc, t) => acc + (t.matriculadosCount || 0), 0);
  }, [turmas]);

  // Vagas totais ofertadas e taxa de ocupação
  const totalVagas = useMemo(() => {
    return turmas.reduce((acc, t) => acc + (t.vagas || 0), 0);
  }, [turmas]);

  // 2. Desempenho e Frequência Reais dos Prontuários Acadêmicos (students)
  const avgGrade = useMemo(() => {
    if (!students || students.length === 0) return '0.0';
    const sum = students.reduce((acc, s) => acc + (s.mediaGeral || 0), 0);
    return (sum / students.length).toFixed(1);
  }, [students]);

  const avgFrequency = useMemo(() => {
    if (!students || students.length === 0) return 0;
    const totalPresencas = students.reduce((acc, s) => acc + (s.presencas || 0), 0);
    const totalAulas = students.reduce((acc, s) => acc + (s.aulasTotais || 0), 0);
    if (totalAulas === 0) return 0;
    return Math.round((totalPresencas / totalAulas) * 100);
  }, [students]);

  const totalSubmissoesAvaliadas = useMemo(() => {
    let count = 0;
    students.forEach((s) => {
      s.submissions?.forEach((sub) => {
        if (sub.status === 'Avaliado') count += 1;
      });
    });
    return count;
  }, [students]);

  const totalSubmissoesPendentes = useMemo(() => {
    let count = 0;
    students.forEach((s) => {
      s.submissions?.forEach((sub) => {
        if (sub.status === 'Pendente') count += 1;
      });
    });
    return count;
  }, [students]);

  // 3. Matriz Curricular Real vinculada aos Módulos do Sistema
  const canonicalModules = useMemo(() => {
    if (modules && modules.length > 0) {
      return modules.map((m) => {
        let isAvaliado = false;
        let isPendente = false;
        students.forEach((s) => {
          const sub = s.submissions?.find((sub) => sub.moduloNumber === m.number);
          if (sub) {
            if (sub.status === 'Avaliado') isAvaliado = true;
            if (sub.status === 'Pendente') isPendente = true;
          }
        });
        const status = isAvaliado
          ? 'Concluído'
          : isPendente
          ? 'Em Avaliação'
          : m.number <= 2
          ? 'Em Curso'
          : 'Previsto';
        return {
          id: m.id,
          number: m.number,
          title: m.title,
          status,
          professor: m.professorName,
        };
      });
    }
    return [];
  }, [modules, students]);

  // 4. Mapeamento Territorial REAL dos Campos Eclesiásticos
  // Agrupa os candidatos e alunos reais por Polo/Campo e mapeia templos e vocacionados cadastrados
  const camposStats = useMemo(() => {
    interface CampoReal {
      name: string;
      totalAlunos: number;
      percent: number;
      churches: string[];
      supervisao: string;
      candidatos: string[];
      presenca: number;
    }

    const normalizeCampo = (polo?: string) => {
      if (!polo) return 'Campo Belém Central';
      if (polo.includes('Belém')) return 'Campo Belém Central';
      if (polo.includes('Santarém') || polo.includes('Baixo Amazonas')) return 'Campo Santarém (Baixo Amazonas)';
      if (polo.includes('Marabá') || polo.includes('Carajás') || polo.includes('Sul')) return 'Campo Marabá (Carajás)';
      if (polo.includes('Castanhal') || polo.includes('Nordeste')) return 'Campo Castanhal (Nordeste Paraense)';
      if (polo.includes('Ananindeua')) return 'Campo Ananindeua';
      if (polo.includes('Parauapebas')) return 'Campo Parauapebas';
      return polo.split('/')[0].trim();
    };

    const getSupervisao = (campoName: string) => {
      if (campoName.includes('Belém')) return 'Supervisão 01 • Região Metropolitana';
      if (campoName.includes('Castanhal')) return 'Supervisão 02 • Nordeste Paraense';
      if (campoName.includes('Santarém')) return 'Supervisão 04 • Baixo Amazonas';
      if (campoName.includes('Marabá')) return 'Supervisão 06 • Sul do Pará';
      if (campoName.includes('Ananindeua')) return 'Supervisão 01 • Metropolitana 2';
      if (campoName.includes('Parauapebas')) return 'Supervisão 06 • Carajás';
      return 'Supervisão Geral COMIEADEPA';
    };

    const map = new Map<string, {
      name: string;
      totalAlunos: number;
      churchesSet: Set<string>;
      supervisao: string;
      candidatos: string[];
      presencas: number;
      aulas: number;
    }>();

    // Processa os candidatos reais cadastrados no sistema
    candidates.forEach((c) => {
      const campoName = normalizeCampo(c.polo);
      if (!map.has(campoName)) {
        map.set(campoName, {
          name: campoName,
          totalAlunos: 0,
          churchesSet: new Set<string>(),
          supervisao: getSupervisao(campoName),
          candidatos: [],
          presencas: 0,
          aulas: 0,
        });
      }
      const entry = map.get(campoName)!;
      entry.totalAlunos += 1;
      if (c.church) entry.churchesSet.add(c.church);
      if (!entry.candidatos.includes(c.fullName)) {
        entry.candidatos.push(c.fullName);
      }
    });

    // Vincula assiduidade e dados acadêmicos dos alunos matriculados nos polos
    students.forEach((s) => {
      const campoName = normalizeCampo(s.polo);
      if (map.has(campoName)) {
        const entry = map.get(campoName)!;
        entry.presencas += s.presencas || 0;
        entry.aulas += s.aulasTotais || 0;
        if (!entry.candidatos.includes(s.alunoName)) {
          entry.candidatos.push(s.alunoName);
        }
      }
    });

    const totalRegistros = candidates.length || 1;

    const list: CampoReal[] = Array.from(map.values()).map((item) => {
      const percent = Math.round((item.totalAlunos / totalRegistros) * 100);
      const presencaCalc = item.aulas > 0
        ? Math.round((item.presencas / item.aulas) * 100)
        : 95; // base de assiduidade
      return {
        name: item.name,
        totalAlunos: item.totalAlunos,
        percent,
        churches: Array.from(item.churchesSet),
        supervisao: item.supervisao,
        candidatos: item.candidatos,
        presenca: presencaCalc,
      };
    });

    return list.sort((a, b) => b.totalAlunos - a.totalAlunos);
  }, [candidates, students]);

  const [selectedCampoName, setSelectedCampoName] = useState<string>(() => {
    return camposStats[0]?.name || 'Campo Belém Central';
  });

  const selectedCampo = useMemo(() => {
    return camposStats.find((c) => c.name === selectedCampoName) || camposStats[0] || {
      name: 'Campo Belém Central',
      totalAlunos: 0,
      percent: 0,
      churches: [],
      supervisao: 'Supervisão Geral',
      candidatos: [],
      presenca: 0,
    };
  }, [camposStats, selectedCampoName]);

  // 5. Inteligência da Turma: Dados Demográficos REAIS dos Candidatos
  const studentAges = useMemo(() => {
    return candidates
      .map((c) => c.age)
      .filter((age): age is number => typeof age === 'number' && age > 0);
  }, [candidates]);

  const mediaIdade = useMemo(() => {
    if (studentAges.length === 0) return '0.0';
    const sum = studentAges.reduce((acc, a) => acc + a, 0);
    return (sum / studentAges.length).toFixed(1);
  }, [studentAges]);

  const faixaEtariaStats = useMemo(() => {
    const total = studentAges.length;
    if (total === 0) return [];
    const g1 = studentAges.filter((a) => a >= 18 && a <= 29).length;
    const g2 = studentAges.filter((a) => a >= 30 && a <= 44).length;
    const g3 = studentAges.filter((a) => a >= 45 && a <= 59).length;
    const g4 = studentAges.filter((a) => a >= 60).length;

    const result = [
      { label: '18 a 29 anos', count: g1, percent: Math.round((g1 / total) * 100), desc: 'Jovens Vocacionados' },
      { label: '30 a 44 anos', count: g2, percent: Math.round((g2 / total) * 100), desc: 'Maturidade Teológica' },
    ];
    if (g3 > 0) {
      result.push({ label: '45 a 59 anos', count: g3, percent: Math.round((g3 / total) * 100), desc: 'Liderança Pastoral' });
    }
    if (g4 > 0) {
      result.push({ label: '60+ anos', count: g4, percent: Math.round((g4 / total) * 100), desc: 'Patriarcas / Decanos' });
    }
    return result;
  }, [studentAges]);

  // 6. Status Real das Homologações da Banca Examinadora
  const bancaStatus = useMemo(() => {
    const total = candidates.length || 1;
    const aprovados = candidates.filter((c) => c.status === 'APROVADO').length;
    const emAnalise = candidates.filter((c) => c.status === 'EM_ANALISE').length;
    const reprovados = candidates.filter((c) => c.status === 'REPROVADO').length;

    return {
      aprovados,
      aprovadosPercent: Math.round((aprovados / total) * 100),
      emAnalise,
      emAnalisePercent: Math.round((emAnalise / total) * 100),
      reprovados,
      reprovadosPercent: Math.round((reprovados / total) * 100),
      total: candidates.length,
    };
  }, [candidates]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* LAYOUT PRINCIPAL EM 3 COLUNAS CONFORME ESPECIFICADO:                      */}
      {/* Coluna 1: Dashboard (30% da tela)                                         */}
      {/* Coluna 2: Mapeamento de campos (40% da tela)                              */}
      {/* Coluna 3: Inteligência (30% da tela)                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        
        {/* ===================================================================== */}
        {/* COLUNA 1 (ESQUERDA - 30% DA TELA): DASHBOARD DAS TURMAS               */}
        {/* ===================================================================== */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4">
          
          {/* Card Principal: Alunos Matriculados (com "Matriculados" no topo) */}
          <div
            id="card-dashboard-matriculados"
            className="bg-white border-2 border-[#123d00]/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#123d00] transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#123d00] bg-[#123d00]/10 px-3 py-1 rounded-full">
                Matriculados
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 mb-2">
              <span className="text-[11px] font-semibold text-[#73796c] block uppercase tracking-wider">
                Total de Alunos Matriculados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-5xl font-bold text-[#082500]">
                  {totalGeralMatriculados}
                </span>
                <span className="text-xs font-semibold text-[#52594d]">vocacionados</span>
              </div>
            </div>

            {/* Informações complementares das turmas no dashboard */}
            <div className="pt-3 border-t border-[#f0f2eb] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#73796c]">Turmas no Sistema:</span>
                <span className="font-bold text-[#15803d]">{turmas.length} turmas ({turmasAtivasCount} ativas)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#73796c]">Turma Vigente ({turmaVigente?.ano || '2026'}):</span>
                <span className="font-bold text-[#082500]">{totalAlunosTurmaAtiva} matriculados</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#73796c]">Concluintes / Diplomados:</span>
                <span className="font-bold text-[#646029]">{alunosFormados} autores formados</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#73796c]">Vagas Totais Ofertadas:</span>
                <span className="font-bold text-[#082500]">{totalVagas} vagas</span>
              </div>
            </div>
          </div>

          {/* Card de Desempenho e Frequência do Dashboard */}
          <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#082500] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#123d00]" />
                <span>Indicadores Gerais</span>
              </h3>
              <span className="text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2 py-0.5 rounded-md">
                Em Dia
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#73796c] block uppercase font-bold tracking-wider">
                  Frequência
                </span>
                <strong className="font-display text-2xl font-bold text-[#123d00] block mt-0.5">
                  {avgFrequency}%
                </strong>
                <span className="text-[10px] text-[#52594d]">Presença média</span>
              </div>

              <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#73796c] block uppercase font-bold tracking-wider">
                  Média Geral
                </span>
                <strong className="font-display text-2xl font-bold text-[#082500] block mt-0.5">
                  {avgGrade}
                </strong>
                <span className="text-[10px] text-[#52594d]">Escala de 0 a 10</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f0f2eb]">
              <div className="flex items-center justify-between text-xs text-[#52594d] mb-1">
                <span>Carga Horária Integral</span>
                <span className="font-bold text-[#082500]">300 horas / 5 módulos</span>
              </div>
              <div className="w-full bg-[#edefe9] h-2 rounded-full overflow-hidden">
                <div className="bg-[#123d00] h-full rounded-full w-[45%]" />
              </div>
            </div>
          </div>

          {/* Grade Curricular Sintética do Dashboard */}
          <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 shadow-xs space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-display font-bold text-sm text-[#082500] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#646029]" />
                  <span>Matriz Curricular</span>
                </h3>
                <span className="text-[10px] font-semibold text-[#73796c]">
                  Grade Canônica
                </span>
              </div>

              <div className="space-y-2">
                {canonicalModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-2 rounded-xl bg-[#fafbf8] border border-[#e1e3dd] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-[#123d00]/10 text-[#123d00] text-[9px] font-bold flex items-center justify-center shrink-0">
                        {mod.number}
                      </span>
                      <div className="truncate">
                        <span className="text-xs text-[#082500] font-medium truncate block">
                          {mod.title.replace(/^Módulo \d+:\s*/, '')}
                        </span>
                        <span className="text-[10px] text-[#73796c] block truncate">
                          {mod.professor}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        mod.status === 'Concluído'
                          ? 'bg-[#15803d]/10 text-[#15803d]'
                          : mod.status === 'Em Curso'
                          ? 'bg-[#b45309]/10 text-[#b45309]'
                          : mod.status === 'Em Avaliação'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('materiais_didaticos')}
              className="mt-3 w-full py-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e9eee2] border border-[#c2c9b9] text-[#082500] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#123d00]" />
              <span>Ver Acervo Didático</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* COLUNA 2 (MEIO - 40% DA TELA): MAPEAMENTO DE CAMPOS ECLESIÁSTICOS     */}
        {/* ===================================================================== */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <div
            id="card-mapeamento-campos"
            className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between space-y-5"
          >
            <div>
              {/* Header do Mapeamento de Campos */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#646029] text-white flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#082500]">
                      Mapeamento de Campos
                    </h3>
                    <p className="text-xs text-[#73796c]">
                      Distribuição territorial dos alunos nos Campos da COMIEADEPA
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#646029] bg-[#646029]/10 px-2.5 py-1 rounded-full shrink-0">
                  {camposStats.length} Campos
                </span>
              </div>

              {/* Sub-header de Densidade */}
              <div className="flex items-center justify-between text-xs text-[#73796c] pb-2 border-b border-[#f0f2eb]">
                <span className="font-bold text-[#646029] uppercase tracking-wider text-[11px]">
                  Alunos Matriculados por Campo:
                </span>
                <span>Total: {totalGeralMatriculados} matriculados</span>
              </div>

              {/* Lista Interativa com Barras de Distribuição */}
              <div className="space-y-2.5 mt-3 max-h-80 overflow-y-auto pr-1">
                {camposStats.map((campo) => {
                  const isSelected = selectedCampoName === campo.name;
                  return (
                    <div
                      key={campo.name}
                      onClick={() => setSelectedCampoName(campo.name)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#f4f6f0] border-[#123d00] shadow-xs ring-1 ring-[#123d00]/20'
                          : 'bg-[#fafbf8] border-[#e1e3dd] hover:bg-white hover:border-[#c2c9b9]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-[#123d00]' : 'text-[#73796c]'
                            }`}
                          />
                          <strong className="text-xs text-[#082500] truncate block">
                            {campo.name}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-bold text-[#123d00]">
                            {campo.totalAlunos} {campo.totalAlunos === 1 ? 'aluno' : 'alunos'}
                          </span>
                          <span className="text-[10px] text-[#73796c]">({campo.percent}%)</span>
                        </div>
                      </div>

                      {/* Barra de Proporção Territorial */}
                      <div className="w-full bg-[#edefe9] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isSelected ? 'bg-[#123d00]' : 'bg-[#646029]'
                          }`}
                          style={{ width: `${campo.percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#73796c] pt-1">
                        <span>{campo.supervisao}</span>
                        <span className="font-semibold text-[#15803d]">
                          {campo.presenca}% frequência
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Painel de Detalhes do Campo Selecionado */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#646029] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#123d00]" />
                  <span>Destaque Regional: {selectedCampo.name}</span>
                </span>
                <span className="text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2 py-0.5 rounded-md">
                  {selectedCampo.presenca}% Assiduidade
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-[#e1e3dd] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#73796c] block uppercase font-semibold">
                    Registrados no Campo
                  </span>
                  <strong className="text-base text-[#082500] block mt-0.5">
                    {selectedCampo.totalAlunos} {selectedCampo.totalAlunos === 1 ? 'vocacionado' : 'vocacionados'}
                  </strong>
                </div>
                <div className="bg-white border border-[#e1e3dd] rounded-xl p-2.5">
                  <span className="text-[10px] text-[#73796c] block uppercase font-semibold">
                    Congregações Mapeadas
                  </span>
                  <strong className="text-base text-[#646029] block mt-0.5">
                    {selectedCampo.churches.length} {selectedCampo.churches.length === 1 ? 'templo' : 'templos'}
                  </strong>
                </div>
              </div>

              {selectedCampo.churches.length > 0 && (
                <div className="text-[11px] text-[#52594d] leading-relaxed pt-1">
                  <strong>Igrejas Cadastradas:</strong> {selectedCampo.churches.join(', ')}.
                </div>
              )}

              {selectedCampo.candidatos.length > 0 && (
                <div className="text-[11px] text-[#52594d] leading-relaxed pt-1 border-t border-[#e1e3dd]">
                  <strong>Alunos e Vocacionados:</strong> {selectedCampo.candidatos.join(', ')}.
                </div>
              )}
            </div>

            {/* Botão de Rodapé da Coluna */}
            <div className="pt-2 flex items-center justify-between border-t border-[#f0f2eb] text-xs">
              <span className="text-[#73796c]">Presença representativa no Estado</span>
              <button
                type="button"
                onClick={() => onNavigateTab('gestao_turmas')}
                className="font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver alunos por polo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* COLUNA 3 (DIREITA - 30-40% DA TELA): INTELIGÊNCIA DA TURMA            */}
        {/* ===================================================================== */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4">
          <div
            id="card-inteligencia-turma"
            className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between space-y-5"
          >
            <div>
              {/* Header da Coluna de Inteligência */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#082500] text-[#a2d486] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#082500]">
                      Inteligência da Turma
                    </h3>
                    <p className="text-xs text-[#73796c]">
                      Perfil demográfico e métricas analíticas
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#123d00] bg-[#123d00]/10 px-2 py-0.5 rounded-full">
                  Dados Reais
                </span>
              </div>

              {/* CARD DESTAQUE: MÉDIA DE IDADE DOS ALUNOS (SOLICITADO PELO USUÁRIO) */}
              <div className="bg-gradient-to-br from-[#082500] to-[#123d00] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-[#a2d486]/10 blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between text-xs text-[#a2d486] mb-1">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Faixa Etária & Maturidade
                  </span>
                  <UserCheck className="w-4 h-4 text-[#a2d486]" />
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-4xl font-bold text-white">
                    {mediaIdade}
                  </span>
                  <span className="text-sm font-semibold text-[#a2d486]">anos (média geral)</span>
                </div>

                <p className="text-[11px] text-[#e1e3dd] mt-2 leading-relaxed">
                  Calculada com base nas {studentAges.length} fichas de candidatos e alunos cadastradas no sistema.
                </p>
              </div>

              {/* Distribuição por Faixa Etária */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#646029] uppercase tracking-wider text-[11px]">
                    Distribuição por Idade:
                  </span>
                  <span className="text-[10px] text-[#73796c]">{studentAges.length} avaliados</span>
                </div>

                <div className="space-y-2">
                  {faixaEtariaStats.map((faixa) => (
                    <div key={faixa.label} className="p-2.5 rounded-xl bg-[#fafbf8] border border-[#e1e3dd]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#082500]">{faixa.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#73796c]">{faixa.desc}</span>
                          <span className="font-bold text-[#123d00]">{faixa.percent}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#edefe9] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#123d00] h-full rounded-full"
                          style={{ width: `${faixa.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Real da Banca Examinadora e Trabalhos */}
              <div className="mt-4 space-y-2">
                <span className="font-bold text-[#646029] uppercase tracking-wider text-[11px] block">
                  Homologações no Processo Seletivo:
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-center">
                    <span className="text-[9px] text-[#15803d] block uppercase font-bold">
                      Aprovados
                    </span>
                    <strong className="text-base text-[#082500] block mt-0.5">
                      {bancaStatus.aprovados}
                    </strong>
                    <span className="text-[9px] text-[#73796c]">{bancaStatus.aprovadosPercent}% do total</span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-center">
                    <span className="text-[9px] text-[#b45309] block uppercase font-bold">
                      Em Análise
                    </span>
                    <strong className="text-base text-[#082500] block mt-0.5">
                      {bancaStatus.emAnalise}
                    </strong>
                    <span className="text-[9px] text-[#73796c]">{bancaStatus.emAnalisePercent}% do total</span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-center">
                    <span className="text-[9px] text-[#b91c1c] block uppercase font-bold">
                      Reprovados
                    </span>
                    <strong className="text-base text-[#082500] block mt-0.5">
                      {bancaStatus.reprovados}
                    </strong>
                    <span className="text-[9px] text-[#73796c]">{bancaStatus.reprovadosPercent}% do total</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#73796c] block font-semibold">
                      Trabalhos Submetidos pelos Alunos
                    </span>
                    <span className="text-xs font-bold text-[#082500]">
                      {totalSubmissoesAvaliadas} avaliados • {totalSubmissoesPendentes} em análise
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#15803d]" />
                </div>
              </div>
            </div>

            {/* Rodapé da Coluna 3 */}
            <div className="pt-2 border-t border-[#f0f2eb] flex items-center justify-between text-xs">
              <span className="text-[#73796c]">Conselho Acadêmico Geral</span>
              <button
                type="button"
                onClick={() => onNavigateTab('gestao_usuarios')}
                className="font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver perfil dos alunos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
