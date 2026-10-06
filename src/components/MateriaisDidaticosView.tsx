import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  UploadCloud,
  Layers,
  FolderOpen,
  Folder,
  Trash2,
  Edit2,
  CheckCircle2,
  Link,
  ChevronRight,
  ExternalLink,
  Download,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Building2,
  GraduationCap,
  Users,
  ArrowLeft,
  Calendar,
  Clock,
  Check,
  Award,
  ShieldCheck,
  FileCheck,
  BookMarked,
  Filter,
  Share2,
} from 'lucide-react';
import {
  Disciplina,
  DisciplinaModulo,
  AcademicMaterial,
  Turma,
  SystemUser,
  ProfessorAvaliadorVinculo,
} from '../types';

interface MateriaisDidaticosViewProps {
  disciplinas: Disciplina[];
  turmas: Turma[];
  users: SystemUser[];
  onUpdateDisciplinas: (disciplinas: Disciplina[]) => void;
  onNavigateToTurmas?: (turmaId?: string) => void;
}

export const MateriaisDidaticosView: React.FC<MateriaisDidaticosViewProps> = ({
  disciplinas,
  turmas,
  users,
  onUpdateDisciplinas,
  onNavigateToTurmas,
}) => {
  // Navigation: 'grid' (Pastas/Cards Visuais) or 'folder' (Pasta da Disciplina Aberta / Estruturação Modular)
  const [viewMode, setViewMode] = useState<'grid' | 'folder'>('grid');
  const [openDisciplinaId, setOpenDisciplinaId] = useState<string>(disciplinas[0]?.id || '');

  // Search by Module ID
  const [searchIdQuery, setSearchIdQuery] = useState('');

  // Modals state
  const [showDisciplinaModal, setShowDisciplinaModal] = useState(false);
  const [disciplinaToEdit, setDisciplinaToEdit] = useState<Disciplina | null>(null);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<{ modulo: DisciplinaModulo; disciplinaId: string } | null>(null);

  const [showUploadMaterialModal, setShowUploadMaterialModal] = useState(false);
  const [targetModuloId, setTargetModuloId] = useState<string>('');

  const [showLinkTurmasModal, setShowLinkTurmasModal] = useState(false);
  const [showAvaliadorModal, setShowAvaliadorModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Currently open disciplina object
  const currentDisciplina: Disciplina | undefined =
    disciplinas.find((d) => d.id === openDisciplinaId) || disciplinas[0];

  // List of unique theological areas
  const areas = Array.from(new Set(disciplinas.map((d) => d.area).filter(Boolean)));

  // Available professors
  const professors = users.filter((u) => u.role === 'professor');

  // Filtered Disciplinas/Módulos by ID
  const filteredDisciplinas = disciplinas.filter((d) => {
    const query = searchIdQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesCodigo = (d.codigo || '').toLowerCase().includes(query);
    const matchesId = d.id.toLowerCase().includes(query);
    return matchesCodigo || matchesId;
  });

  // Calculate statistics across curriculum
  const totalDisciplinas = disciplinas.length;
  const linkedTurmasCount = Array.from(
    new Set(disciplinas.flatMap((d) => d.turmasIds || []))
  ).length;
  const totalModulos = disciplinas.reduce((acc, d) => acc + (d.modulos?.length || 0), 0);
  const totalMateriais = disciplinas.reduce(
    (acc, d) => acc + (d.modulos?.reduce((mAcc, m) => mAcc + (m.materials?.length || 0), 0) || 0),
    0
  );
  const totalHoras = disciplinas.reduce((acc, d) => acc + (d.cargaHoraria || 0), 0);

  // Open folder view of a specific discipline
  const handleOpenFolder = (disciplinaId: string) => {
    setOpenDisciplinaId(disciplinaId);
    setViewMode('folder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to grid of folders
  const handleBackToGrid = () => {
    setViewMode('grid');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // FORM STATES & HANDLERS: DISCIPLINA
  // ==========================================
  const [formNome, setFormNome] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCargaHoraria, setFormCargaHoraria] = useState(60);
  const [formProfessorPadrao, setFormProfessorPadrao] = useState('');
  const [formTurmasIds, setFormTurmasIds] = useState<string[]>([]);

  const handleOpenCreateDisciplina = () => {
    setDisciplinaToEdit(null);
    setFormNome('');
    setFormCodigo(`TEO-${100 + disciplinas.length + 1}`);
    setFormArea('Exegese e Interpretação Bíblica');
    setFormDescricao('');
    setFormCargaHoraria(60);
    setFormProfessorPadrao(professors[0]?.name || '');
    setFormTurmasIds(turmas.length > 0 ? [turmas[0].id] : []);
    setShowDisciplinaModal(true);
  };

  const handleOpenEditDisciplina = (d: Disciplina, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDisciplinaToEdit(d);
    setFormNome(d.nome);
    setFormCodigo(d.codigo || '');
    setFormArea(d.area);
    setFormDescricao(d.descricao);
    setFormCargaHoraria(d.cargaHoraria);
    setFormProfessorPadrao(d.professorPadrao || '');
    setFormTurmasIds([...d.turmasIds]);
    setShowDisciplinaModal(true);
  };

  const handleSaveDisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    if (disciplinaToEdit) {
      const updated = disciplinas.map((d) =>
        d.id === disciplinaToEdit.id
          ? {
              ...d,
              nome: formNome.trim(),
              codigo: formCodigo.trim(),
              area: formArea.trim(),
              descricao: formDescricao.trim(),
              cargaHoraria: formCargaHoraria,
              professorPadrao: formProfessorPadrao,
              turmasIds: formTurmasIds,
            }
          : d
      );
      onUpdateDisciplinas(updated);
      showToast(`Disciplina "${formNome}" atualizada com sucesso!`);
    } else {
      const newDisc: Disciplina = {
        id: `disc-${Date.now()}`,
        nome: formNome.trim(),
        codigo: formCodigo.trim(),
        area: formArea.trim(),
        descricao: formDescricao.trim(),
        cargaHoraria: formCargaHoraria,
        professorPadrao: formProfessorPadrao,
        turmasIds: formTurmasIds,
        avaliadores: formProfessorPadrao
          ? [
              {
                professorId: professors.find((p) => p.name === formProfessorPadrao)?.id || 'prof-1',
                professorName: formProfessorPadrao,
                turmaId: 'ALL',
                papel: 'titular',
                dataDesignacao: new Date().toLocaleDateString('pt-BR'),
                ativo: true,
              },
            ]
          : [],
        modulos: [
          {
            id: `mod-${Date.now()}-1`,
            number: 1,
            title: 'Módulo 1: Introdução, Fundamentos & Ementa Geral',
            description: 'Unidade fundamental com diretrizes basilares e orientações de pesquisa.',
            ementa: [
              'Conceitos e Metodologia Teológica',
              'Diretrizes Doutrinárias da Convenção COMIEADEPA',
              'Metodologia de Estudo e Produção Textual',
            ],
            materials: [],
          },
        ],
      };
      onUpdateDisciplinas([newDisc, ...disciplinas]);
      setOpenDisciplinaId(newDisc.id);
      showToast(`Disciplina "${formNome}" criada no Repositório Central!`);
    }

    setShowDisciplinaModal(false);
  };

  // ==========================================
  // CONFIRMAÇÃO DE EXCLUSÃO (IN-APP & IFRAME-SAFE)
  // ==========================================
  interface DeleteTarget {
    type: 'disciplina' | 'modulo' | 'material';
    disciplinaId?: string;
    moduloId?: string;
    materialId?: string;
    itemTitle: string;
    itemDescription?: string;
  }
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const requestDeleteDisciplina = (dId: string, dNome: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({
      type: 'disciplina',
      disciplinaId: dId,
      itemTitle: dNome,
      itemDescription:
        'Esta ação removerá o módulo do Repositório Central e desvinculará todos os seus conteúdos de quaisquer turmas associadas.',
    });
  };

  const requestDeleteModule = (modulo: DisciplinaModulo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({
      type: 'modulo',
      moduloId: modulo.id,
      itemTitle: modulo.title,
      itemDescription:
        'Esta ação excluirá este módulo e todas as apostilas e materiais em PDF nele organizados.',
    });
  };

  const requestDeleteMaterial = (moduloId: string, mat: AcademicMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({
      type: 'material',
      moduloId,
      materialId: mat.id,
      itemTitle: mat.title,
      itemDescription:
        'Esta ação removerá permanentemente este arquivo em PDF do acervo da disciplina.',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'disciplina' && deleteTarget.disciplinaId) {
      const dId = deleteTarget.disciplinaId;
      const updated = disciplinas.filter((d) => d.id !== dId);
      onUpdateDisciplinas(updated);
      if (openDisciplinaId === dId) {
        setOpenDisciplinaId(updated[0]?.id || '');
        setViewMode('grid');
      }
      showToast(`Módulo "${deleteTarget.itemTitle}" excluído com sucesso!`, 'danger');
    } else if (deleteTarget.type === 'modulo' && deleteTarget.moduloId && currentDisciplina) {
      const modId = deleteTarget.moduloId;
      const updatedModulos = (currentDisciplina.modulos || []).filter((m) => m.id !== modId);
      const updatedDisciplinas = disciplinas.map((d) =>
        d.id === currentDisciplina.id ? { ...d, modulos: updatedModulos } : d
      );
      onUpdateDisciplinas(updatedDisciplinas);
      showToast(`Módulo "${deleteTarget.itemTitle}" excluído com sucesso!`, 'danger');
    } else if (
      deleteTarget.type === 'material' &&
      deleteTarget.moduloId &&
      deleteTarget.materialId &&
      currentDisciplina
    ) {
      const { moduloId, materialId } = deleteTarget;
      const updatedModulos = (currentDisciplina.modulos || []).map((m) => {
        if (m.id === moduloId) {
          return {
            ...m,
            materials: (m.materials || []).filter((mat) => mat.id !== materialId),
          };
        }
        return m;
      });
      const updatedDisciplinas = disciplinas.map((d) =>
        d.id === currentDisciplina.id ? { ...d, modulos: updatedModulos } : d
      );
      onUpdateDisciplinas(updatedDisciplinas);
      showToast(`Arquivo "${deleteTarget.itemTitle}" excluído com sucesso!`, 'danger');
    }

    setDeleteTarget(null);
  };

  // ==========================================
  // FORM STATES & HANDLERS: MÓDULO
  // ==========================================
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modEmentaRaw, setModEmentaRaw] = useState('');

  const handleOpenAddModule = () => {
    if (!currentDisciplina) return;
    setModuleToEdit(null);
    setModTitle(`Módulo ${(currentDisciplina.modulos?.length || 0) + 1}: `);
    setModDesc('');
    setModEmentaRaw('');
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (m: DisciplinaModulo) => {
    if (!currentDisciplina) return;
    setModuleToEdit({ modulo: m, disciplinaId: currentDisciplina.id });
    setModTitle(m.title);
    setModDesc(m.description);
    setModEmentaRaw((m.ementa || []).join('\n'));
    setShowModuleModal(true);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDisciplina || !modTitle.trim()) return;

    const ementaArr = modEmentaRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (moduleToEdit) {
      const updatedModulos = (currentDisciplina.modulos || []).map((m) =>
        m.id === moduleToEdit.modulo.id
          ? {
              ...m,
              title: modTitle.trim(),
              description: modDesc.trim(),
              ementa: ementaArr,
            }
          : m
      );
      const updatedDisciplinas = disciplinas.map((d) =>
        d.id === currentDisciplina.id ? { ...d, modulos: updatedModulos } : d
      );
      onUpdateDisciplinas(updatedDisciplinas);
      showToast(`Módulo atualizado com sucesso!`);
    } else {
      const newModule: DisciplinaModulo = {
        id: `mod-${Date.now()}`,
        number: (currentDisciplina.modulos?.length || 0) + 1,
        title: modTitle.trim(),
        description: modDesc.trim(),
        ementa: ementaArr,
        materials: [],
      };
      const updatedDisciplinas = disciplinas.map((d) =>
        d.id === currentDisciplina.id
          ? { ...d, modulos: [...(d.modulos || []), newModule] }
          : d
      );
      onUpdateDisciplinas(updatedDisciplinas);
      showToast(`Novo módulo adicionado à disciplina!`);
    }

    setShowModuleModal(false);
  };

  // ==========================================
  // FORM STATES & HANDLERS: UPLOAD DE ARQUIVO REAL (Apenas PDF)
  // ==========================================
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'pdf'>('pdf');
  const [matPages, setMatPages] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matTamanho, setMatTamanho] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleOpenUploadModal = (moduloId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentDisciplina) return;
    const targetId =
      moduloId || currentDisciplina.modulos?.[0]?.id || `mod-${Date.now()}-1`;
    setTargetModuloId(targetId);
    setMatTitle('');
    setMatType('pdf');
    setMatPages('');
    setMatDesc('');
    setMatTamanho('');
    setSelectedFileName(null);
    setSelectedFileUrl(null);
    setShowUploadMaterialModal(true);
  };

  const handleFilePicked = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      showToast('Formato não permitido: selecione exclusivamente arquivos em formato PDF (.pdf).', 'danger');
      return;
    }

    setSelectedFileName(file.name);
    try {
      const fileUrl = URL.createObjectURL(file);
      setSelectedFileUrl(fileUrl);
    } catch {
      // fallback
    }

    // Format size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setMatTamanho(file.size > 0 ? `${sizeInMb} MB` : '1.8 MB');

    // Auto-fill title if empty
    if (!matTitle.trim()) {
      setMatTitle(file.name);
    }

    setMatType('pdf');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      if (!isPdf) {
        showToast('Formato não permitido: selecione exclusivamente arquivos em formato PDF (.pdf).', 'danger');
        return;
      }
      handleFilePicked(file);
    }
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDisciplina || !matTitle.trim()) return;

    let titleClean = matTitle.trim();
    if (!titleClean.toLowerCase().endsWith('.pdf')) {
      titleClean = `${titleClean}.pdf`;
    }

    const newMaterial: AcademicMaterial = {
      id: `mat-${Date.now()}`,
      title: titleClean,
      type: 'pdf',
      pages: matPages.trim() || 'Apostila PDF',
      date: new Date().toLocaleDateString('pt-BR'),
      descricao: matDesc.trim() || 'Material didático oficial em PDF homologado para o módulo.',
      tamanho: matTamanho || '2.5 MB',
      url: selectedFileUrl || undefined,
    };

    const updatedModulos = (currentDisciplina.modulos || []).map((m) => {
      if (m.id === targetModuloId) {
        return {
          ...m,
          materials: [...(m.materials || []), newMaterial],
        };
      }
      return m;
    });

    const updatedDisciplinas = disciplinas.map((d) =>
      d.id === currentDisciplina.id ? { ...d, modulos: updatedModulos } : d
    );

    onUpdateDisciplinas(updatedDisciplinas);
    showToast(`Apostila em PDF "${titleClean}" vinculada com sucesso ao módulo!`);
    setShowUploadMaterialModal(false);
  };

  // Download simulation
  const handleSimulateDownload = (mat: AcademicMaterial) => {
    showToast(`Iniciando download de: ${mat.title}`);
    if (mat.url) {
      const linkEl = document.createElement('a');
      linkEl.href = mat.url;
      linkEl.download = mat.title.endsWith('.pdf') ? mat.title : `${mat.title}.pdf`;
      linkEl.click();
      return;
    }
    const blob = new Blob(
      [
        `%PDF-1.4\n` +
          `% COMIEADEPA - PROGRAMA DE ESCRITORES E TEÓLOGOS QGU\n` +
          `% Repositório Central de Materiais Didáticos\n` +
          `% Disciplina: ${currentDisciplina?.nome || 'Disciplina'}\n` +
          `% Documento Oficial: ${mat.title}\n` +
          `% Data: ${mat.date}\n` +
          `%%EOF`,
      ],
      { type: 'application/pdf' }
    );
    const url = URL.createObjectURL(blob);
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.download = mat.title.endsWith('.pdf') ? mat.title : `${mat.title}.pdf`;
    linkEl.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // DISTRIBUIÇÃO INTELIGENTE (TURMAS VINCULADAS)
  // ==========================================
  const handleToggleTurmaLink = (turmaId: string, disciplinaIdOverride?: string) => {
    const targetDisc = disciplinaIdOverride
      ? disciplinas.find((d) => d.id === disciplinaIdOverride)
      : currentDisciplina;
    if (!targetDisc) return;

    const exists = targetDisc.turmasIds.includes(turmaId);
    const newTurmasIds = exists
      ? targetDisc.turmasIds.filter((id) => id !== turmaId)
      : [...targetDisc.turmasIds, turmaId];

    const updatedDisciplinas = disciplinas.map((d) =>
      d.id === targetDisc.id ? { ...d, turmasIds: newTurmasIds } : d
    );

    onUpdateDisciplinas(updatedDisciplinas);
    showToast(
      exists
        ? `Disciplina desvinculada da turma.`
        : `Distribuição Inteligente ativada! Alunos e professores da turma agora têm acesso instantâneo ao acervo sem duplicação de arquivos.`
    );
  };

  // ==========================================
  // VINCULAÇÃO DE PROFESSORES AVALIADORES
  // ==========================================
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [selectedAvaliadorTurmaId, setSelectedAvaliadorTurmaId] = useState<string>('ALL');
  const [selectedAvaliadorPapel, setSelectedAvaliadorPapel] = useState<
    'titular' | 'adjunto' | 'coordenador'
  >('titular');

  const handleOpenAvaliadorModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentDisciplina) return;
    setSelectedProfId(professors[0]?.id || '');
    setSelectedAvaliadorTurmaId('ALL');
    setSelectedAvaliadorPapel('titular');
    setShowAvaliadorModal(true);
  };

  const handleAddAvaliador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDisciplina || !selectedProfId) return;

    const prof = professors.find((p) => p.id === selectedProfId);
    if (!prof) return;

    const newVinculo: ProfessorAvaliadorVinculo = {
      professorId: prof.id,
      professorName: prof.name,
      turmaId: selectedAvaliadorTurmaId,
      papel: selectedAvaliadorPapel,
      dataDesignacao: new Date().toLocaleDateString('pt-BR'),
      ativo: true,
    };

    // Replace if already exists for same professor and turma, else append
    const existing = currentDisciplina.avaliadores || [];
    const filtered = existing.filter(
      (a) => !(a.professorId === prof.id && a.turmaId === selectedAvaliadorTurmaId)
    );

    const updatedDisciplinas = disciplinas.map((d) =>
      d.id === currentDisciplina.id
        ? {
            ...d,
            avaliadores: [...filtered, newVinculo],
            professorPadrao: selectedAvaliadorPapel === 'titular' ? prof.name : d.professorPadrao,
          }
        : d
    );

    onUpdateDisciplinas(updatedDisciplinas);
    showToast(
      `Professor ${prof.name} designado como avaliador ${
        selectedAvaliadorTurmaId === 'ALL'
          ? 'em todas as turmas'
          : `na turma ${turmas.find((t) => t.id === selectedAvaliadorTurmaId)?.name || 'selecionada'}`
      }!`
    );
    setShowAvaliadorModal(false);
  };

  const handleRemoveAvaliador = (profId: string, turmaId?: string) => {
    if (!currentDisciplina) return;
    const updatedAvaliadores = (currentDisciplina.avaliadores || []).filter(
      (a) => !(a.professorId === profId && a.turmaId === turmaId)
    );

    const updatedDisciplinas = disciplinas.map((d) =>
      d.id === currentDisciplina.id ? { ...d, avaliadores: updatedAvaliadores } : d
    );

    onUpdateDisciplinas(updatedDisciplinas);
    showToast('Designação de avaliador removida.', 'danger');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-xs font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success' ? 'bg-[#123d00]' : 'bg-[#b91c1c]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTRUTURA PRINCIPAL: DASHBOARD (20%) + MÓDULOS CADASTRADOS (80%)         */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ========================================================================= */}
        {/* DASHBOARD (COLUNA ESQUERDA - 20% DA TELA)                                */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[20%] shrink-0 space-y-4">
          <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#e1e3dd]">
              <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4 text-[#a2d486]" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-display text-[#082500]">Dashboard</h2>
                <span className="text-[10px] text-[#73796c] block">Materiais Didáticos</span>
              </div>
            </div>

            {/* Métrica 1: Módulos Cadastrados */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73796c] block">
                Módulos Cadastrados
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-display text-[#082500]">
                  {disciplinas.length}
                </span>
                <Layers className="w-4 h-4 text-[#123d00]" />
              </div>
              <span className="text-[10px] text-[#52594d] block">
                {disciplinas.length === 5 ? '5 módulos canônicos' : 'Grade curricular'}
              </span>
            </div>

            {/* Métrica 2: Turmas Atendidas */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73796c] block">
                Turmas Atendidas
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-display text-[#082500]">
                  {linkedTurmasCount}
                </span>
                <GraduationCap className="w-4 h-4 text-[#123d00]" />
              </div>
              <span className="text-[10px] text-[#52594d] block">
                {turmas.length} turmas no sistema
              </span>
            </div>

            {/* Métrica 3: Arquivos Didáticos */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73796c] block">
                Arquivos Didáticos
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-display text-[#082500]">
                  {totalMateriais}
                </span>
                <FileText className="w-4 h-4 text-[#123d00]" />
              </div>
              <span className="text-[10px] text-[#52594d] block">
                Apostilas e manuais
              </span>
            </div>

            {/* Métrica 4: Carga Horária Total */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9]/60 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73796c] block">
                Carga Horária Total
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-display text-[#082500]">
                  {totalHoras}h
                </span>
                <Clock className="w-4 h-4 text-[#123d00]" />
              </div>
              <span className="text-[10px] text-[#52594d] block">
                Programa teológico QGU
              </span>
            </div>

            {/* Docentes Titulares */}
            <div className="pt-2 border-t border-[#e1e3dd] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#73796c] block">
                Docentes Titulares
              </span>
              <div className="space-y-1.5 text-xs text-[#082500]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                  <span className="text-[11px] font-semibold truncate">Pr. Carlos Pinheiro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                  <span className="text-[11px] font-semibold truncate">Profa. Rachel Macedo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MÓDULOS CADASTRADOS (COLUNA DIREITA - 80% DA TELA)                       */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[80%] flex-1 min-w-0 space-y-4">
          {viewMode === 'grid' && (
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-display text-[#082500]">
                    Módulos Cadastrados
                  </h2>
                  <p className="text-xs text-[#52594d] mt-0.5">
                    Tabela de módulos pedagógicos da formação teológica.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Item de busca pelo id do módulo */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#73796c] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="input-busca-id-modulo"
                      value={searchIdQuery}
                      onChange={(e) => setSearchIdQuery(e.target.value)}
                      placeholder="Buscar por ID..."
                      className="w-full pl-8 pr-7 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs text-[#082500] placeholder:text-[#73796c] focus:outline-hidden focus:border-[#123d00]"
                    />
                    {searchIdQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchIdQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#73796c] hover:text-[#082500] cursor-pointer"
                        title="Limpar busca"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Botão para adicionar módulos (apenas o ícone de mais) */}
                  <button
                    type="button"
                    id="btn-adicionar-modulo"
                    onClick={handleOpenCreateDisciplina}
                    className="p-2.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white flex items-center justify-center cursor-pointer shadow-xs transition-all shrink-0"
                    title="Adicionar Módulo"
                    aria-label="Adicionar Módulo"
                  >
                    <Plus className="w-4 h-4 text-[#a2d486]" />
                  </button>
                </div>
              </div>

              {/* Tabela de Módulos Cadastrados */}
              <div className="overflow-x-auto rounded-2xl border border-[#e1e3dd]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8faf4] border-b border-[#e1e3dd] text-[11px] font-bold text-[#646029] uppercase tracking-wider">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Turmas</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3dd] text-xs">
                    {filteredDisciplinas.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-xs text-[#73796c]">
                          Nenhum módulo encontrado com o ID informado.
                        </td>
                      </tr>
                    ) : (
                      filteredDisciplinas.map((disc) => (
                        <tr
                          key={disc.id}
                          className="hover:bg-[#fcfdfa] transition-colors"
                        >
                          {/* Coluna ID: Nessa coluna fica apenas o id do módulo */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#082500]">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-[#f4f7ee] border border-[#123d00]/20 text-xs">
                              {disc.codigo || disc.id}
                            </span>
                          </td>

                          {/* Coluna Turmas: Quantidade de Turmas naquele módulos */}
                          <td className="py-3.5 px-4 font-semibold text-[#082500]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/20 text-xs font-bold">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {disc.turmasIds?.length || 0} {disc.turmasIds?.length === 1 ? 'turma' : 'turmas'}
                            </span>
                          </td>

                          {/* Coluna Ações: Botão para Excluir o módulo, editar o módulo, e abrira pasta daquele módulo. Todos os botões devem estar em forma de ícone apenas. */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              {/* Botão para Excluir o módulo */}
                              <button
                                type="button"
                                id={`btn-excluir-modulo-${disc.id}`}
                                onClick={(e) => requestDeleteDisciplina(disc.id, disc.nome, e)}
                                className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 bg-red-50/70 border border-red-200 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                                title="Excluir módulo"
                                aria-label="Excluir módulo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Botão para editar o módulo */}
                              <button
                                type="button"
                                id={`btn-editar-modulo-${disc.id}`}
                                onClick={(e) => handleOpenEditDisciplina(disc, e)}
                                className="p-2 rounded-xl text-[#52594d] hover:text-[#082500] hover:bg-[#f4f6f0] border border-[#e1e3dd] cursor-pointer transition-colors"
                                title="Editar módulo"
                                aria-label="Editar módulo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Botão para abrir a pasta daquele módulo */}
                              <button
                                type="button"
                                id={`btn-abrir-pasta-${disc.id}`}
                                onClick={() => handleOpenFolder(disc.id)}
                                className="p-2 rounded-xl text-[#123d00] hover:bg-[#123d00]/10 border border-[#123d00]/20 cursor-pointer transition-colors"
                                title="Abrir pasta do módulo"
                                aria-label="Abrir pasta do módulo"
                              >
                                <FolderOpen className="w-4 h-4 text-[#123d00]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* ========================================================================= */}
      {/* VIEW 2: PASTA DA DISCIPLINA ABERTA (Estruturação Modular & Uploads)       */}
      {/* ========================================================================= */}
      {viewMode === 'folder' && currentDisciplina && (
        <div className="space-y-6">
          {/* Breadcrumb & Navigation Bar - Limpo e sem excesso de botões */}
          <div className="bg-white border border-[#c2c9b9]/70 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToGrid}
              className="px-3.5 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#082500] font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#123d00]" />
              <span>Voltar aos Módulos Cadastrados</span>
            </button>
          </div>

          {/* Banner Hero da Pasta da Disciplina */}
          <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e1e3dd]">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#123d00] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FolderOpen className="w-7 h-7 text-[#a2d486]" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#646029] bg-[#f8faf4] px-2.5 py-0.5 rounded-lg border border-[#e1e3dd]">
                      {currentDisciplina.codigo || 'QGU-TEO'}
                    </span>
                    <span className="text-xs text-[#73796c] font-semibold">
                      Carga Horária: {currentDisciplina.cargaHoraria} horas
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold font-display text-[#082500]">
                    {currentDisciplina.nome}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditDisciplina(currentDisciplina)}
                  className="px-3 py-1.5 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-xs font-bold text-[#52594d] flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Disciplina</span>
                </button>
                <button
                  type="button"
                  id={`btn-excluir-disciplina-${currentDisciplina.id}`}
                  onClick={(e) => requestDeleteDisciplina(currentDisciplina.id, currentDisciplina.nome, e)}
                  className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 bg-red-50/70 border border-red-200 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Excluir Disciplina do Repositório"
                  aria-label="Excluir Disciplina do Repositório"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Banner de Distribuição Inteligente e Turmas Conectadas */}
            <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#123d00]" />
                  <strong className="text-xs text-[#082500] font-bold">
                    Distribuição Inteligente: Turmas Conectadas a esta Pasta ({currentDisciplina.turmasIds.length})
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLinkTurmasModal(true)}
                  className="text-xs font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Gerenciar Turmas Vinculadas</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {currentDisciplina.turmasIds.length === 0 ? (
                  <span className="text-xs text-[#b45309] font-medium bg-[#b45309]/10 px-3 py-1 rounded-xl border border-[#b45309]/20">
                    Aviso: Esta disciplina ainda não está vinculada a nenhuma turma. Clique em &quot;Gerenciar Turmas Vinculadas&quot; para liberar aos alunos.
                  </span>
                ) : (
                  currentDisciplina.turmasIds.map((tId) => {
                    const turmaObj = turmas.find((t) => t.id === tId);
                    return (
                      <div
                        key={tId}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#c2c9b9] text-xs font-semibold text-[#082500] shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                        <span>{turmaObj?.name || tId}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTurmaLink(tId)}
                          className="ml-1 text-[#73796c] hover:text-[#b91c1c] cursor-pointer"
                          title="Desconectar desta turma"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Seção: Professores Avaliadores Designados nesta Disciplina */}
            <div className="bg-[#fafbf8] border border-[#e1e3dd] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#123d00]" />
                  <strong className="text-xs text-[#082500] font-bold">
                    Professores Titulares Designados para esta Disciplina
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAvaliadorModal}
                  className="text-xs font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Designar Professor Titular</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(currentDisciplina.avaliadores && currentDisciplina.avaliadores.length > 0) ? (
                  currentDisciplina.avaliadores.map((av, idx) => {
                    const turmaNome =
                      av.turmaId === 'ALL' || !av.turmaId
                        ? 'Todas as Turmas Vinculadas'
                        : turmas.find((t) => t.id === av.turmaId)?.name || av.turmaId;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-[#e1e3dd] rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <strong className="text-xs text-[#082500] truncate block">
                            {av.professorName}
                          </strong>
                          <span className="text-[10px] text-[#123d00] font-semibold bg-[#123d00]/10 px-2 py-0.5 rounded-md inline-block">
                            Professor Titular
                          </span>
                          <span className="text-[10px] text-[#73796c] block">
                            Atuação: <span className="font-mono">{turmaNome}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAvaliador(av.professorId, av.turmaId)}
                          className="p-1.5 rounded-lg text-[#73796c] hover:text-[#b91c1c] hover:bg-[#fee2e2] cursor-pointer"
                          title="Remover designação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-xs text-[#73796c] italic p-3 bg-white rounded-xl border border-dashed border-[#c2c9b9]">
                    Nenhum professor avaliador designado para turmas específicas. O titular geral atual é:{' '}
                    <span className="font-bold text-[#082500]">
                      {currentDisciplina.professorPadrao || 'Não definido'}
                    </span>
                    .
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ESTRUTURAÇÃO MODULAR: MÓDULOS (Módulo 1, Módulo 2, etc.) & UPLOADS        */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {(!currentDisciplina.modulos || currentDisciplina.modulos.length === 0) ? (
              <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-10 text-center space-y-3">
                <FolderOpen className="w-10 h-10 text-[#73796c] mx-auto opacity-60" />
                <h4 className="font-bold text-sm text-[#082500]">Nenhum módulo cadastrado nesta disciplina</h4>
                <p className="text-xs text-[#73796c] max-w-md mx-auto">
                  Estruture os conteúdos pedagógicos dividindo a matéria em módulos (ex: Módulo 1, Módulo 2) e anexe as
                  apostilas correspondentes.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModule}
                  className="px-4 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#a2d486]" />
                  <span>Criar Primeiro Módulo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {currentDisciplina.modulos.map((modulo, mIndex) => {
                  const materials = modulo.materials || [];

                  return (
                    <div
                      key={modulo.id}
                      className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-6 shadow-xs space-y-4 hover:border-[#123d00]/50 transition-all"
                    >
                      {/* Module Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#123d00] text-white text-[10px] font-extrabold uppercase tracking-wide">
                              Módulo {modulo.number || mIndex + 1}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#082500] font-display">
                            {modulo.title}
                          </h4>
                          {modulo.description && (
                            <p className="text-xs text-[#52594d] leading-relaxed">
                              {modulo.description}
                            </p>
                          )}
                        </div>

                        {/* Actions for this specific module */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenUploadModal(modulo.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Fazer upload de apostila em PDF"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-[#a2d486]" />
                            <span>Upload de PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModule(modulo)}
                            className="p-1.5 rounded-xl text-[#52594d] hover:bg-[#f4f6f0] border border-[#e1e3dd] cursor-pointer"
                            title="Editar Módulo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`btn-excluir-modulo-item-${modulo.id}`}
                            onClick={(e) => requestDeleteModule(modulo, e)}
                            className="p-1.5 rounded-xl text-red-600 hover:text-white hover:bg-red-600 bg-red-50/70 border border-red-200 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                            title="Excluir Módulo"
                            aria-label="Excluir Módulo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ementa e Tópicos */}
                      {modulo.ementa && modulo.ementa.length > 0 && (
                        <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3.5 space-y-1.5">
                          <span className="text-[10px] font-bold text-[#646029] uppercase tracking-wider block">
                            Ementa & Tópicos:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#191c19]">
                            {modulo.ementa.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Materiais Didáticos do Módulo */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#082500] uppercase tracking-wider flex items-center gap-1.5">
                            <BookMarked className="w-3.5 h-3.5 text-[#123d00]" />
                            <span>Materiais & Apostilas em PDF do Módulo ({materials.length}):</span>
                          </span>
                        </div>

                        {materials.length === 0 ? (
                          <div
                            onClick={() => handleOpenUploadModal(modulo.id)}
                            className="p-6 rounded-2xl bg-[#fafbf8] border-2 border-dashed border-[#c2c9b9] hover:border-[#123d00] text-center space-y-2 cursor-pointer transition-all group"
                          >
                            <UploadCloud className="w-6 h-6 text-[#73796c] group-hover:text-[#123d00] mx-auto transition-colors" />
                            <p className="text-xs font-semibold text-[#082500]">
                              Nenhum arquivo enviado para este módulo ainda.
                            </p>
                            <p className="text-[10px] text-[#73796c]">
                              Clique aqui para fazer o upload da apostila em formato PDF (.pdf).
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {materials.map((mat) => (
                              <div
                                key={mat.id}
                                className="p-3.5 rounded-2xl bg-[#f8faf4] border border-[#e1e3dd] hover:border-[#123d00]/40 flex items-center justify-between gap-3 group transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                      mat.type === 'pdf'
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : mat.type === 'text'
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    }`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <strong className="text-xs text-[#082500] truncate block font-bold">
                                      {mat.title}
                                    </strong>
                                    <div className="flex items-center gap-2 text-[10px] text-[#73796c]">
                                      <span className="font-semibold uppercase">{mat.type}</span>
                                      <span>•</span>
                                      <span>{mat.tamanho || '2.4 MB'}</span>
                                      <span>•</span>
                                      <span>{mat.pages || 'Doc'}</span>
                                      <span>•</span>
                                      <span>{mat.date}</span>
                                    </div>
                                    {mat.descricao && (
                                      <p className="text-[10px] text-[#52594d] line-clamp-1 italic">
                                        {mat.descricao}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateDownload(mat)}
                                    className="p-2 rounded-xl text-[#123d00] hover:bg-white border border-[#e1e3dd] cursor-pointer shadow-2xs"
                                    title="Baixar Arquivo Oficial"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    id={`btn-excluir-material-${mat.id}`}
                                    onClick={(e) => requestDeleteMaterial(modulo.id, mat, e)}
                                    className="p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 bg-red-50/70 border border-red-200 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                                    title="Excluir Arquivo PDF"
                                    aria-label="Excluir Arquivo PDF"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CADASTRAR / EDITAR DISCIPLINA NO CURRÍCULO BASE                  */}
      {/* ========================================================================= */}
      {showDisciplinaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDisciplina}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  {disciplinaToEdit ? 'Editar Disciplina' : 'Cadastrar Nova Disciplina'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDisciplinaModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52594d]">
              Cadastre a disciplina no repositório central. Os conteúdos e módulos cadastrados aqui alimentam as
              turmas vinculadas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Nome Oficial da Disciplina *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Hermenêutica e Métodos Exegéticos"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Código da Disciplina (Sigla)
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: TEO-101"
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Carga Horária (Horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formCargaHoraria}
                    onChange={(e) => setFormCargaHoraria(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Área Teológica de Concentração
                </label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                >
                  <option value="Exegese e Interpretação Bíblica">Exegese e Interpretação Bíblica</option>
                  <option value="Comunicação e Redação Eclesiástica">Comunicação e Redação Eclesiástica</option>
                  <option value="Teologia Sistemática & Bíblica">Teologia Sistemática & Bíblica</option>
                  <option value="Doutrina e Apologética">Doutrina e Apologética</option>
                  <option value="História Eclesiástica e Pentecostalismo">História Eclesiástica e Pentecostalismo</option>
                  <option value="Ética Pastoral e Prática Ministerial">Ética Pastoral e Prática Ministerial</option>
                </select>
              </div>

              {/* Distribuição Inicial para Turmas */}
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Vincular Imediatamente às Turmas (Distribuição Inteligente):
                </label>
                <div className="space-y-1.5 p-3 rounded-xl bg-[#f8faf4] border border-[#e1e3dd] max-h-32 overflow-y-auto">
                  {turmas.length === 0 ? (
                    <span className="text-xs text-[#73796c] italic">Nenhuma turma cadastrada no sistema.</span>
                  ) : (
                    turmas.map((t) => {
                      const isChecked = formTurmasIds.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFormTurmasIds((prev) =>
                                isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className="rounded text-[#123d00] focus:ring-[#123d00]"
                          />
                          <span className="text-[#082500] font-medium">{t.name}</span>
                          <span className="text-[10px] text-[#73796c] font-mono">({t.routeSlug})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowDisciplinaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Disciplina
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADICIONAR / EDITAR MÓDULO PEDAGÓGICO                             */}
      {/* ========================================================================= */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModule}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  {moduleToEdit ? 'Editar Módulo' : 'Adicionar Novo Módulo Pedagógico'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Título do Módulo *
                </label>
                <input
                  type="text"
                  required
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="Ex: Módulo 1: Leitura Analítica e Crítica Teológica"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Descrição e Objetivos do Módulo
                </label>
                <textarea
                  rows={2}
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Explicação didática das competências que o vocacionado desenvolverá..."
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Tópicos da Ementa (um por linha)
                </label>
                <textarea
                  rows={4}
                  value={modEmentaRaw}
                  onChange={(e) => setModEmentaRaw(e.target.value)}
                  placeholder="Fundamentos da Hermenêutica Bíblica&#10;Análise Contextual e Gêneros Literários&#10;Distinção entre Texto e Aplicação Prática"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Módulo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD REAL DE ARQUIVOS (Drag & Drop + Arquivo)                  */}
      {/* ========================================================================= */}
      {showUploadMaterialModal && currentDisciplina && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMaterial}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Upload de Apostila em PDF
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadMaterialModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52594d]">
              Faça o upload do arquivo em <strong>PDF (.pdf)</strong> para a disciplina <strong>{currentDisciplina.nome}</strong>. O material ficará disponível automaticamente para todos os alunos das turmas vinculadas.
            </p>

            <div className="space-y-3">
              {/* Seletor do Módulo de Destino */}
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Módulo de Destino *
                </label>
                <select
                  value={targetModuloId}
                  onChange={(e) => setTargetModuloId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                >
                  {(currentDisciplina.modulos || []).map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      Módulo {m.number || idx + 1}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop Zone Real - Apenas PDF */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#191c19]">
                    Arquivo em Formato PDF (.pdf obrigatório) *
                  </label>
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md uppercase">
                    Apenas PDF
                  </span>
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                    isDraggingFile
                      ? 'border-[#123d00] bg-[#123d00]/10 scale-[1.01]'
                      : selectedFileName
                      ? 'border-[#15803d] bg-[#15803d]/5'
                      : 'border-[#c2c9b9] bg-[#fafbf8] hover:border-[#123d00]'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilePicked(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud
                    className={`w-8 h-8 mx-auto transition-colors ${
                      selectedFileName ? 'text-[#15803d]' : 'text-[#123d00]'
                    }`}
                  />
                  {selectedFileName ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs font-bold text-[#082500] flex items-center justify-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 text-[10px] font-extrabold uppercase">PDF</span>
                        <span>{selectedFileName}</span>
                      </p>
                      <p className="text-[10px] text-[#15803d] font-semibold">
                        Tamanho: {matTamanho} • Arquivo PDF validado e pronto para envio
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs font-semibold text-[#082500]">
                        Arraste e solte o arquivo PDF aqui ou clique para selecionar
                      </p>
                      <p className="text-[10px] text-[#73796c]">
                        Exclusivo para apostilas e documentos em formato PDF (.pdf até 50MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Título de Exibição */}
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Título de Exibição da Apostila / Documento *
                </label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Ex: Apostila_Modulo_1_Hermeneutica.pdf"
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Formato do Material
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-extrabold uppercase">
                      PDF
                    </span>
                    <span className="font-bold text-[#082500]">Documento PDF (.pdf)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#191c19] block mb-1">
                    Número de Páginas (estimado)
                  </label>
                  <input
                    type="text"
                    value={matPages}
                    onChange={(e) => setMatPages(e.target.value)}
                    placeholder="Ex: 48 páginas"
                    className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Instruções ou Orientação ao Vocacionado
                </label>
                <textarea
                  rows={2}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Ex: Leitura obrigatória antes da confecção da lição do Módulo 1..."
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowUploadMaterialModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Upload do PDF
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DISTRIBUIÇÃO INTELIGENTE: VINCULAR A TURMAS                      */}
      {/* ========================================================================= */}
      {showLinkTurmasModal && currentDisciplina && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Distribuição Inteligente de Conteúdo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkTurmasModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-2xl p-3.5 space-y-1">
              <strong className="text-xs text-[#082500] block">
                Disciplina: {currentDisciplina.nome} ({currentDisciplina.codigo || 'TEO'})
              </strong>
              <p className="text-[11px] text-[#52594d] leading-relaxed">
                Marque abaixo as turmas que terão acesso a esta disciplina. A vinculação automatiza a liberação dos
                módulos e apostilas para os alunos matriculados sem duplicar arquivos no sistema.
              </p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {turmas.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#73796c]">
                  Nenhuma turma cadastrada. Crie uma turma na aba &quot;Gestão de Turmas&quot;.
                </div>
              ) : (
                turmas.map((turma) => {
                  const isLinked = currentDisciplina.turmasIds.includes(turma.id);
                  return (
                    <div
                      key={turma.id}
                      className="p-3.5 rounded-2xl bg-[#f8faf4] border border-[#e1e3dd] flex items-center justify-between gap-3 hover:border-[#123d00]/30 transition-all"
                    >
                      <div className="space-y-0.5">
                        <strong className="text-xs text-[#082500] block">{turma.name}</strong>
                        <div className="flex items-center gap-2 text-[10px] text-[#73796c]">
                          <span className="font-mono">{turma.routeSlug}</span>
                          <span>•</span>
                          <span>Status: {turma.status}</span>
                          <span>•</span>
                          <span>{turma.matriculadosCount || 0} alunos</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleTurmaLink(turma.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          isLinked
                            ? 'bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca]'
                            : 'bg-[#123d00] text-white hover:bg-[#0d2a00]'
                        }`}
                      >
                        {isLinked ? 'Desconectar' : 'Conectar'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e1e3dd]">
              {onNavigateToTurmas && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkTurmasModal(false);
                    onNavigateToTurmas();
                  }}
                  className="text-xs font-bold text-[#123d00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Aba de Gestão de Turmas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLinkTurmasModal(false)}
                className="px-5 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold cursor-pointer shadow-xs ml-auto"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DESIGNAR PROFESSOR AVALIADOR (POR DISCIPLINA & TURMA)            */}
      {/* ========================================================================= */}
      {showAvaliadorModal && currentDisciplina && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddAvaliador}
            className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Designar Professor Titular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvaliadorModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52594d]">
              Defina as turmas vinculadas ao Professor Titular para a condução curricular e bancas examinadoras de ensaios e artigos finais.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Docente Avaliador *
                </label>
                <select
                  required
                  value={selectedProfId}
                  onChange={(e) => setSelectedProfId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                >
                  <option value="">Selecione um professor cadastrado...</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c19] block mb-1">
                  Escopo de Atuação (Turma) *
                </label>
                <select
                  value={selectedAvaliadorTurmaId}
                  onChange={(e) => setSelectedAvaliadorTurmaId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs focus:outline-hidden focus:border-[#123d00]"
                >
                  <option value="ALL">Todas as turmas vinculadas a esta disciplina</option>
                  {currentDisciplina.turmasIds.map((tId) => {
                    const turmaObj = turmas.find((t) => t.id === tId);
                    return (
                      <option key={tId} value={tId}>
                        Apenas: {turmaObj?.name || tId}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-[#73796c] mt-1 block">
                  Permite atribuir avaliadores diferentes por turma para a mesma disciplina.
                </span>
              </div>

              <div className="p-3 bg-[#f4f6f0] border border-[#e1e3dd] rounded-xl text-xs">
                <span className="font-bold text-[#082500] block">Categoria Docente:</span>
                <span className="text-[#646029]">Professor Titular (categoria única com vínculo exclusivamente com as turmas e responsável pelas bancas examinadoras de ensaios e artigos finais).</span>
              </div>

              {/* Avaliadores já existentes nesta disciplina */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#082500] uppercase tracking-wider block mb-1.5">
                  Avaliadores Atuais desta Disciplina:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto bg-[#f8faf4] border border-[#e1e3dd] rounded-xl p-2.5">
                  {(!currentDisciplina.avaliadores || currentDisciplina.avaliadores.length === 0) ? (
                    <span className="text-xs text-[#73796c] italic">Nenhum avaliador atribuído no momento.</span>
                  ) : (
                    currentDisciplina.avaliadores.map((av, idx) => {
                      const turmaNome =
                        av.turmaId === 'ALL' || !av.turmaId
                          ? 'Todas as Turmas'
                          : turmas.find((t) => t.id === av.turmaId)?.name || av.turmaId;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-[#e1e3dd]"
                        >
                          <div>
                            <strong className="text-[#082500]">{av.professorName}</strong>
                            <span className="text-[10px] text-[#73796c] block">
                              {av.papel} • {turmaNome}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAvaliador(av.professorId, av.turmaId)}
                            className="text-[#b91c1c] hover:underline text-[11px] font-bold cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowAvaliadorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#0d2a00] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Atribuição
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: MATRIZ GERAL DE AVALIADORES (VISÃO CONSOLIDADA)                  */}
      {/* ========================================================================= */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#c2c9b9] p-6 max-w-3xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3dd]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#123d00]" />
                <h3 className="font-display font-bold text-lg text-[#082500]">
                  Matriz Geral de Professores Avaliadores
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="p-1.5 rounded-full text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#52594d]">
              Visão consolidada do corpo docente avaliador da convenção. Mostra quais professores atuam como avaliadores
              em cada disciplina e turma.
            </p>

            <div className="border border-[#e1e3dd] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8faf4] border-b border-[#e1e3dd] text-[10px] uppercase font-bold text-[#73796c]">
                  <tr>
                    <th className="p-3">Docente Avaliador</th>
                    <th className="p-3">Disciplina(s) Atribuída(s)</th>
                    <th className="p-3">Turmas de Atuação</th>
                    <th className="p-3 text-right">Papel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3dd]">
                  {professors.map((prof) => {
                    // Find all disciplines where this professor is evaluator
                    const assignedDisciplinas = disciplinas.filter((d) =>
                      (d.avaliadores || []).some((a) => a.professorId === prof.id) ||
                      d.professorPadrao === prof.name
                    );

                    return (
                      <tr key={prof.id} className="hover:bg-[#fafbf8]">
                        <td className="p-3">
                          <strong className="text-[#082500] block">{prof.name}</strong>
                          <span className="text-[10px] text-[#73796c]">{prof.email}</span>
                        </td>
                        <td className="p-3">
                          {assignedDisciplinas.length > 0 ? (
                            <div className="space-y-1">
                              {assignedDisciplinas.map((d) => (
                                <span
                                  key={d.id}
                                  className="inline-block text-[10px] font-medium bg-[#f4f6f0] text-[#082500] border border-[#e1e3dd] px-2 py-0.5 rounded mr-1"
                                >
                                  {d.codigo || 'TEO'}: {d.nome}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#73796c] italic text-[11px]">Nenhuma disciplina</span>
                          )}
                        </td>
                        <td className="p-3">
                          {assignedDisciplinas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedDisciplinas.flatMap((d) =>
                                d.turmasIds.map((tId) => (
                                  <span
                                    key={`${d.id}-${tId}`}
                                    className="text-[10px] bg-[#123d00]/10 text-[#123d00] px-1.5 py-0.5 rounded font-mono"
                                  >
                                    {turmas.find((t) => t.id === tId)?.name || tId}
                                  </span>
                                ))
                              )}
                            </div>
                          ) : (
                            <span className="text-[#73796c] text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2 py-0.5 rounded-full">
                            {prof.roleLabel || 'Docente Avaliador'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#e1e3dd]">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-5 py-2 rounded-xl bg-[#123d00] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIRMAÇÃO DE EXCLUSÃO (IN-APP & COMPATÍVEL COM IFRAMES)       */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div
          id="modal-confirm-delete"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#082500]">
                  {deleteTarget.type === 'disciplina'
                    ? 'Confirmar Exclusão de Módulo'
                    : deleteTarget.type === 'modulo'
                    ? 'Confirmar Exclusão de Módulo'
                    : 'Confirmar Exclusão de Arquivo'}
                </h3>
                <p className="text-xs text-[#73796c]">Ação de exclusão permanente</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-2xl space-y-1.5">
              <p className="text-xs font-bold text-red-950 break-words">
                {deleteTarget.itemTitle}
              </p>
              {deleteTarget.itemDescription && (
                <p className="text-[11px] text-red-800 leading-relaxed">
                  {deleteTarget.itemDescription}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#e1e3dd]">
              <button
                type="button"
                id="btn-cancelar-exclusao"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-[#082500] hover:bg-[#f4f6f0] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-exclusao"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
