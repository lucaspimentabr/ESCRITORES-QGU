import React, { useState, useMemo, useEffect } from 'react';
import {
  Candidate,
  CandidateStatus,
  Turma,
  ProcessoSeletivoEtapa,
  FormFieldConfig,
} from '../types';
import {
  ExamQuestionDefinition,
  CognitiveLevel,
  DiscursivePromptDefinition,
  getStoredExamQuestions,
  saveStoredExamQuestions,
  getStoredDiscursivePrompts,
  saveStoredDiscursivePrompts,
  EXAM_QUESTIONS,
  DISCURSIVE_PROMPTS_REPOSITORY,
} from '../data/examQuestions';
import {
  getStoredFormFields,
  saveStoredFormFields,
  DEFAULT_FORM_FIELDS,
} from '../data/mockFormFields';
import {
  validateProcessoIdUnique,
  createDefaultJourneyConfig,
  saveProcessoConfig,
  getProcessoConfig,
  normalizeProcessoId,
  deleteProcessoAndRelatedData,
  saveStoredProcessos,
  ProcessoJourneyConfig,
} from '../data/processoSeletivoService';
import { ProcessoInscricaoEditor } from './ProcessoInscricaoEditor';
import {
  FileText,
  SlidersHorizontal,
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ExternalLink,
  Copy,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileEdit,
  RotateCcw,
  Sparkles,
  Search,
  Download,
  Calendar,
  Building,
  User,
  BookOpen,
  Layers,
  ArrowUpRight,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCheck,
  HelpCircle,
  Cpu,
  Users,
  Filter,
  ArrowLeft,
  Lock,
  Unlock,
  IdCard,
  Link2,
  Pencil,
  XCircle,
  GripVertical,
  ArrowRight,
  Mail,
  Quote,
  Type,
  ListFilter,
  FileUp,
  AlignLeft,
  CheckSquare,
  Settings2,
} from 'lucide-react';

interface ProcessoSeletivoViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidateId: string) => void;
  isInscriptionOpen: boolean;
  onToggleInscription: () => void;
  onCreateCandidate?: (candidate: Candidate) => void;
  onUpdateCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  etapas?: ProcessoSeletivoEtapa[];
  onUpdateEtapas?: (etapas: ProcessoSeletivoEtapa[]) => void;
}

export type ProcessoSubTab = 'etapas' | 'dados_pessoais' | 'prova_teologica';

export interface ProcessoSeletivoItem {
  id: string; // e.g. '#PS-2026-1'
  nome: string;
  route: string;
  editalId: string;
  status: 'Aberto' | 'Encerrado';
}

export const ProcessoSeletivoView: React.FC<ProcessoSeletivoViewProps> = ({
  candidates,
  onSelectCandidate,
  isInscriptionOpen,
  onToggleInscription,
  onCreateCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  etapas,
  onUpdateEtapas,
}) => {
  // Main Sub-Tab State
  const [subTab, setSubTab] = useState<ProcessoSubTab>('etapas');

  // Floating Toast Notification
  const [toastNotification, setToastNotification] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastNotification({ text, type });
    setTimeout(() => {
      setToastNotification((current) => (current?.text === text ? null : current));
    }, 3500);
  };

  // =========================================================================
  // GESTÃO DE PROCESSOS SELETIVOS (APENAS #PS-2026-1 INICIALMENTE)
  // =========================================================================
  const [processos, setProcessos] = useState<ProcessoSeletivoItem[]>(() => {
    const saved = localStorage.getItem('qgu_processos_seletivos_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading processos seletivos', e);
      }
    }
    return [
      {
        id: '#PS-2026-1',
        nome: 'Processo Seletivo 2026.1',
        route: '/inscricao',
        editalId: 'edital-2026-1',
        status: 'Aberto',
      },
    ];
  });

  const [processoSearchId, setProcessoSearchId] = useState('');
  const [activeProcessoPainelId, setActiveProcessoPainelId] = useState<string | null>(null);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoSeletivoItem | null>(null);
  const [editProcessoId, setEditProcessoId] = useState('');
  const [processoToDelete, setProcessoToDelete] = useState<ProcessoSeletivoItem | null>(null);

  // Estados do Fluxo de Criação de Novo Processo Seletivo
  const [showNewProcessoIdModal, setShowNewProcessoIdModal] = useState(false);
  const [newProcessoRawId, setNewProcessoRawId] = useState('');
  const [newProcessoIdError, setNewProcessoIdError] = useState<string | null>(null);
  const [editingJourneyConfig, setEditingJourneyConfig] = useState<ProcessoJourneyConfig | null>(null);
  const [isEditingNewJourney, setIsEditingNewJourney] = useState(false);
  const [isSavingJourney, setIsSavingJourney] = useState(false);

  const handleProceedWithNewProcessoId = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = validateProcessoIdUnique(newProcessoRawId, processos);
    if (!validation.valid) {
      setNewProcessoIdError(validation.error || 'ID do Processo Seletivo inválido.');
      return;
    }

    setNewProcessoIdError(null);
    setShowNewProcessoIdModal(false);

    // Cria rascunho de jornada de inscrição em memória
    const draftConfig = createDefaultJourneyConfig(validation.cleanId);
    setEditingJourneyConfig(draftConfig);
    setIsEditingNewJourney(true);
  };

  const handleSaveJourney = () => {
    if (!editingJourneyConfig) return;
    setIsSavingJourney(true);

    try {
      // 1. Salva a configuração da jornada no localStorage
      saveProcessoConfig(editingJourneyConfig);

      // 2. Se for novo processo, inclui na lista geral de processos seletivos
      if (isEditingNewJourney) {
        const newItem: ProcessoSeletivoItem = {
          id: editingJourneyConfig.processoId,
          nome: editingJourneyConfig.nome,
          route: `/inscricao/${editingJourneyConfig.cleanId}`,
          editalId: `edital-${editingJourneyConfig.cleanId.toLowerCase()}`,
          status: 'Aberto',
        };
        const updated = [newItem, ...processos.filter((p) => p.id !== newItem.id)];
        setProcessos(updated);
        saveStoredProcessos(updated);
      } else {
        // Atualiza o nome na lista se foi alterado
        const updated = processos.map((p) =>
          p.id === editingJourneyConfig.processoId
            ? { ...p, nome: editingJourneyConfig.nome }
            : p
        );
        setProcessos(updated);
        saveStoredProcessos(updated);
      }

      triggerToast(
        `Processo seletivo ${editingJourneyConfig.processoId} e suas definições foram salvos com sucesso!`,
        'success'
      );
      setEditingJourneyConfig(null);
      setIsEditingNewJourney(false);
    } catch (err) {
      console.error('Erro ao salvar processo seletivo', err);
      triggerToast('Erro ao salvar processo seletivo.', 'warning');
    } finally {
      setIsSavingJourney(false);
    }
  };

  const handleCancelJourney = () => {
    // Caso o usuário cancele antes de salvar: nada é criado e rascunhos são descartados
    setEditingJourneyConfig(null);
    setIsEditingNewJourney(false);
    setNewProcessoRawId('');
    setNewProcessoIdError(null);
    triggerToast('Criação do processo seletivo cancelada. Nenhum dado foi salvo.', 'info');
  };

  const filteredProcessos = useMemo(() => {
    const q = processoSearchId.trim().toLowerCase();
    if (!q) return processos;
    return processos.filter((p) => p.id.toLowerCase().includes(q));
  }, [processos, processoSearchId]);

  const handleOpenEditProcesso = (proc: ProcessoSeletivoItem) => {
    setEditingProcesso(proc);
    setEditProcessoId(proc.id);
  };

  const handleSaveEditedProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcesso) return;
    const updatedId = editProcessoId.trim() || editingProcesso.id;
    const next = processos.map((p) =>
      p.id === editingProcesso.id
        ? {
            ...p,
            id: updatedId,
          }
        : p
    );
    setProcessos(next);
    localStorage.setItem('qgu_processos_seletivos_list', JSON.stringify(next));
    if (activeProcessoPainelId === editingProcesso.id) {
      setActiveProcessoPainelId(updatedId);
    }
    setEditingProcesso(null);
    triggerToast(`Processo seletivo ${updatedId} atualizado com sucesso!`, 'success');
  };

  const handleConfirmDeleteProcesso = () => {
    if (!processoToDelete) return;
    const deletedId = processoToDelete.id;

    // Exclusão definitiva do processo seletivo e dados vinculados (inscrições e configurações)
    const result = deleteProcessoAndRelatedData(deletedId, candidates);
    setProcessos(result.remainingProcessos);

    if (onDeleteCandidate && result.deletedCandidateIds.length > 0) {
      result.deletedCandidateIds.forEach((id) => onDeleteCandidate(id));
    }

    if (activeProcessoPainelId === deletedId) {
      setActiveProcessoPainelId(null);
    }
    setProcessoToDelete(null);
    triggerToast(`Processo seletivo ${deletedId} e todas as suas inscrições foram excluídos definitivamente.`, 'info');
  };

  const handleNavigateOrCopyRoute = (route: string) => {
    const fullUrl = `${window.location.origin}${route}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
    }
    triggerToast(`Link da rota (${route}) copiado com sucesso!`, 'success');
    window.open(route, '_blank');
  };

  // =========================================================================
  // 1. PROCESSO SELETIVO: MONITORAMENTO DE CANDIDATOS
  // =========================================================================
  const [selectedCandidateForMinisterial, setSelectedCandidateForMinisterial] = useState<Candidate | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<'ALL' | 'APROVADO' | 'EM_ANALISE' | 'REPROVADO'>('ALL');
  const [candidatePoloFilter, setCandidatePoloFilter] = useState<string>('ALL');
  const [copiedInscricao, setCopiedInscricao] = useState(false);

  const handleCopyInscricaoLink = () => {
    const url = `${window.location.origin}/inscricao`;
    navigator.clipboard.writeText(url);
    setCopiedInscricao(true);
    setTimeout(() => setCopiedInscricao(false), 2500);
  };

  // Filter candidates for monitoring table
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = candidateSearchQuery.toLowerCase();
      const matchesSearch =
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.polo.toLowerCase().includes(q) ||
        c.church.toLowerCase().includes(q) ||
        c.pastor.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);

      const matchesStatus =
        candidateStatusFilter === 'ALL' || c.status === candidateStatusFilter;

      const matchesPolo =
        candidatePoloFilter === 'ALL' || c.polo === candidatePoloFilter;

      return matchesSearch && matchesStatus && matchesPolo;
    });
  }, [candidates, candidateSearchQuery, candidateStatusFilter, candidatePoloFilter]);

  const uniquePolos = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.polo) set.add(c.polo);
    });
    return Array.from(set);
  }, [candidates]);

  // WhatsApp Contact Helper - Pre-formatted message "Paz do Senhor!"
  const openWhatsApp = (c: Candidate) => {
    const cleanPhone = c.phone.replace(/\D/g, '');
    const message = encodeURIComponent('Paz do Senhor!');
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  // Manual candidate modal state (linked to /candidato without exam)
  const [isManualCandidateModalOpen, setIsManualCandidateModalOpen] = useState(false);
  const [manualFullName, setManualFullName] = useState('');
  const [manualBirthDate, setManualBirthDate] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPolo, setManualPolo] = useState('Belém - Sede');
  const [manualChurch, setManualChurch] = useState('');
  const [manualPastor, setManualPastor] = useState('');
  const [manualMotivation, setManualMotivation] = useState('');
  const [manualInitialStatus, setManualInitialStatus] = useState<CandidateStatus>('APROVADO');
  const [manualError, setManualError] = useState('');
  const [manualSuccessToast, setManualSuccessToast] = useState('');

  const handleOpenManualModal = () => {
    setManualFullName('');
    setManualBirthDate('');
    setManualEmail('');
    setManualPhone('');
    setManualPolo(uniquePolos[0] || 'Belém - Sede');
    setManualChurch('');
    setManualPastor('');
    setManualMotivation('');
    setManualInitialStatus('APROVADO');
    setManualError('');
    setIsManualCandidateModalOpen(true);
  };

  const handleSaveManualCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFullName.trim()) {
      setManualError('O nome completo do candidato é obrigatório.');
      return;
    }
    if (!manualEmail.trim()) {
      setManualError('O e-mail do candidato é obrigatório.');
      return;
    }
    if (!manualPhone.trim()) {
      setManualError('O WhatsApp de contato é obrigatório.');
      return;
    }

    const newCandidate: Candidate = {
      id: `#QGU-2026-${String(candidates.length + 1).padStart(4, '0')}`,
      editalId: 'edital-2026-1',
      fullName: manualFullName.trim(),
      initials: manualFullName
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CD',
      avatarColor: '#123d00',
      birthDate: manualBirthDate || 'Não informada',
      age: manualBirthDate ? Math.max(18, new Date().getFullYear() - new Date(manualBirthDate).getFullYear()) : 28,
      email: manualEmail.trim(),
      phone: manualPhone.trim(),
      polo: manualPolo,
      church: manualChurch.trim() || `Assembleia de Deus - ${manualPolo}`,
      jurisdiction: `COMIEADEPA – ${manualPolo}`,
      pastor: manualPastor.trim() || '',
      communionStatus: 'Membro em Comunhão • Cadastro Manual',
      registrationDate:
        new Date().toLocaleDateString('pt-BR') +
        ` às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      objectiveScore: {
        correct: 0,
        total: 0,
        percentage: 0,
      },
      status: manualInitialStatus,
      statusLabel: manualInitialStatus === 'APROVADO' ? 'Aprovado' : 'Em Análise',
      memorial: manualMotivation.trim() || '',
      characterCount: (manualMotivation.trim() || '').length,
      parecerId: `#PAR-${Date.now().toString().slice(-4)}`,
      objectiveQuestions: [],
      discursive: {
        prompt: 'Memorial vocacional para produção literária teológica.',
        candidateAnswer: manualMotivation.trim() || '',
        evaluatorScore: 0,
        maxScore: 10,
        preliminaryVerdict: manualInitialStatus === 'APROVADO' ? 'Homologado Administrativamente' : 'Em Análise',
        theologicalNotes: 'Inclusão manual via painel da coordenação.',
      },
    };

    if (onCreateCandidate) {
      onCreateCandidate(newCandidate);
    }
    setIsManualCandidateModalOpen(false);
    setManualSuccessToast(`Candidato ${newCandidate.fullName} adicionado com sucesso!`);
    setTimeout(() => setManualSuccessToast(''), 4000);
  };

  // =========================================================================
  // 2. DADOS PESSOAIS (FORM BUILDER) STATE
  // =========================================================================
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(() => getStoredFormFields());
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldConfig['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldCategory, setNewFieldCategory] = useState<'pessoal' | 'eclesiastico' | 'documentacao'>('pessoal');
  const [fieldToDelete, setFieldToDelete] = useState<FormFieldConfig | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestionDefinition | null>(null);

  const handleToggleFieldActive = (id: string) => {
    setFormFields((prev) => {
      const target = prev.find((f) => f.id === id);
      const newActive = target ? !target.active : true;
      const next = prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
      saveStoredFormFields(next);
      triggerToast(
        `Campo "${target?.label || id}" ${newActive ? 'ativado na página /candidato' : 'desativado (oculto no formulário)'}.`,
        newActive ? 'success' : 'info'
      );
      return next;
    });
  };

  const handleToggleFieldRequired = (id: string) => {
    setFormFields((prev) => {
      const target = prev.find((f) => f.id === id);
      const newRequired = target ? !target.required : true;
      const next = prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f));
      saveStoredFormFields(next);
      triggerToast(
        `Campo "${target?.label || id}" agora é ${newRequired ? 'Obrigatório (*)' : 'Opcional'}.`,
        'info'
      );
      return next;
    });
  };

  const handleDeleteField = (fieldOrId: string | FormFieldConfig) => {
    const target = typeof fieldOrId === 'string' ? formFields.find((f) => f.id === fieldOrId) : fieldOrId;
    if (target) {
      setFieldToDelete(target);
    }
  };

  const handleConfirmDeleteField = () => {
    if (!fieldToDelete) return;
    const deletedLabel = fieldToDelete.label;
    const idToDelete = fieldToDelete.id;
    setFormFields((prev) => {
      const next = prev.filter((f) => f.id !== idToDelete);
      saveStoredFormFields(next);
      return next;
    });
    setFieldToDelete(null);
    triggerToast(`Campo "${deletedLabel}" excluído com sucesso!`, 'success');
  };

  const handleResetDefaultFields = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmResetDefaultFields = () => {
    setFormFields(DEFAULT_FORM_FIELDS);
    saveStoredFormFields(DEFAULT_FORM_FIELDS);
    setShowResetConfirmModal(false);
    triggerToast('Campos canônicos oficiais padrão restaurados com sucesso!', 'success');
  };

  const handleSaveNewField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldName.trim()) return;

    const newField: FormFieldConfig = {
      id: `field-${Date.now()}`,
      name: newFieldName.trim().replace(/\s+/g, '_').toLowerCase(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      active: true,
      placeholder: newFieldPlaceholder,
      helpText: newFieldHelpText,
      category: newFieldCategory,
      order: formFields.length + 1,
    };

    const next = [...formFields, newField];
    setFormFields(next);
    saveStoredFormFields(next);
    setIsNewFieldModalOpen(false);
    setNewFieldLabel('');
    setNewFieldName('');
    setNewFieldHelpText('');
    setNewFieldPlaceholder('');
  };

  const [editingOptionInput, setEditingOptionInput] = useState('');

  const handleAddOptionToEditingField = () => {
    if (!editingOptionInput.trim() || !editingField) return;
    const currentOptions = editingField.options || [];
    if (!currentOptions.includes(editingOptionInput.trim())) {
      setEditingField({
        ...editingField,
        options: [...currentOptions, editingOptionInput.trim()],
      });
    }
    setEditingOptionInput('');
  };

  const handleRemoveOptionFromEditingField = (indexToRemove: number) => {
    if (!editingField) return;
    const currentOptions = editingField.options || [];
    setEditingField({
      ...editingField,
      options: currentOptions.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleFillDefaultPolosOptions = () => {
    if (!editingField) return;
    const defaultCampos = [
      'Campo Belém Central',
      'Campo Coqueiro',
      'Campo Ananindeua',
      'Campo Marituba',
      'Campo Castanhal',
      'Campo Santarém',
      'Campo Marabá',
      'Campo Altamira',
      'Campo Paragominas',
    ];
    setEditingField({
      ...editingField,
      options: defaultCampos,
    });
  };

  const handleSaveEditField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    setFormFields((prev) => {
      const next = prev.map((f) => (f.id === editingField.id ? editingField : f));
      saveStoredFormFields(next);
      return next;
    });
    setEditingField(null);
    setEditingOptionInput('');
  };

  // Drag and drop & ordering handlers
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [previewInputValues, setPreviewInputValues] = useState<Record<string, string>>({
    fullName: 'Lucas Alencar de Oliveira',
    birthDate: '1992-06-15',
    email: 'lucas.oliveira@comieadepa.org',
    phone: '(91) 98257-7589',
    polo: 'Coqueiro/COMIEADEPA',
    pastor: 'Pr. Océlio Nauar de Araújo',
    motivation: 'Desde o início do meu discipulado nas fileiras da COMIEADEPA, compreendi que a pena do escritor sagrado tem o poder de cristalizar a sã doutrina para as futuras gerações...',
  });
  const [previewRequirements, setPreviewRequirements] = useState<boolean>(true);

  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedFieldIndex === null || draggedFieldIndex === dropIndex) return;
    setFormFields((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedFieldIndex, 1);
      updated.splice(dropIndex, 0, draggedItem);
      const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      saveStoredFormFields(reordered);
      return reordered;
    });
    setDraggedFieldIndex(null);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formFields.length) return;
    setFormFields((prev) => {
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, item);
      const reordered = updated.map((it, idx) => ({ ...it, order: idx + 1 }));
      saveStoredFormFields(reordered);
      return reordered;
    });
  };

  // =========================================================================
  // 3. PROVA TEOLÓGICA (REPOSITÓRIO DE TESTES) STATE
  // =========================================================================
  const [questions, setQuestions] = useState<ExamQuestionDefinition[]>(() => getStoredExamQuestions());
  const [discursivePrompts, setDiscursivePrompts] = useState<DiscursivePromptDefinition[]>(() => getStoredDiscursivePrompts());
  const [questionCognitiveFilter, setQuestionCognitiveFilter] = useState<'ALL' | CognitiveLevel>('ALL');
  const [questionTopicFilter, setQuestionTopicFilter] = useState<string>('ALL');
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestionDefinition | null>(null);
  const [isAutomatingProof, setIsAutomatingProof] = useState(false);
  const [automatedProofSuccess, setAutomatedProofSuccess] = useState(false);

  // Live Preview Prova state (simulação interativa de respostas)
  const [previewExamAnswers, setPreviewExamAnswers] = useState<Record<number, 'A' | 'B' | 'C'>>({
    1: 'B',
    2: 'B',
  });
  const [previewDiscursiveAnswer, setPreviewDiscursiveAnswer] = useState<string>(
    'Ser cheio do Espírito Santo é viver sob a contínua liderança e senhorio de Cristo, manifestando os dons e o fruto do Espírito na edificação da Igreja e na proclamação da sã doutrina bíblica.'
  );

  // Modal de edição da Redação Discursiva
  const [showDiscursiveEditModal, setShowDiscursiveEditModal] = useState(false);
  const [editingDiscursivePrompt, setEditingDiscursivePrompt] = useState<DiscursivePromptDefinition | null>(null);
  const [editPromptText, setEditPromptText] = useState('');

  // Form State for Question (Creating or Editing)
  const [qTopic, setQTopic] = useState('Bibliologia');
  const [qCognitive, setQCognitive] = useState<CognitiveLevel>('compreensao');
  const [qQuestion, setQQuestion] = useState('');
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C'>('B');
  const [qNote, setQNote] = useState('');

  // Ativar / Desativar Questão na Prova
  const handleToggleQuestionActive = (id: number) => {
    const next = questions.map((q) => (q.id === id ? { ...q, active: q.active === false ? true : false } : q));
    setQuestions(next);
    saveStoredExamQuestions(next);
    window.dispatchEvent(new Event('exam_questions_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  // Reordenar Questões na Prova (Subir / Descer)
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    const reindexed = copy.map((q, idx) => ({ ...q, id: idx + 1 }));
    setQuestions(reindexed);
    saveStoredExamQuestions(reindexed);
    window.dispatchEvent(new Event('exam_questions_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  // Abrir Modal de Edição de Questão
  const handleOpenEditQuestion = (q: ExamQuestionDefinition) => {
    setEditingQuestion(q);
    setQTopic(q.topic);
    setQCognitive(q.cognitiveLevel);
    setQQuestion(q.question);
    setQOptionA(q.options.find((o) => o.key === 'A')?.text || '');
    setQOptionB(q.options.find((o) => o.key === 'B')?.text || '');
    setQOptionC(q.options.find((o) => o.key === 'C')?.text || '');
    setQCorrect(q.correctKey);
  };

  // Salvar Edição de Questão
  const handleSaveEditQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!qQuestion.trim() || !qOptionA.trim() || !qOptionB.trim() || !qOptionC.trim()) {
      alert('Preencha o enunciado e as três alternativas (A, B e C).');
      return;
    }
    const next = questions.map((q) => {
      if (q.id === editingQuestion.id) {
        return {
          ...q,
          topic: qTopic.trim() || 'Teologia',
          question: qQuestion.trim(),
          options: [
            { key: 'A', text: qOptionA.trim() },
            { key: 'B', text: qOptionB.trim() },
            { key: 'C', text: qOptionC.trim() },
          ],
          correctKey: qCorrect,
        };
      }
      return q;
    });
    setQuestions(next);
    saveStoredExamQuestions(next);
    window.dispatchEvent(new Event('exam_questions_updated'));
    window.dispatchEvent(new Event('storage'));
    setEditingQuestion(null);
    triggerToast('Questão atualizada com sucesso no banco e na rota /prova!', 'success');
  };

  // Restaurar Banco Canônico Padrão da Prova
  const handleResetDefaultQuestions = () => {
    if (window.confirm('Deseja restaurar as questões e a redação para o padrão canônico oficial?')) {
      setQuestions(EXAM_QUESTIONS);
      saveStoredExamQuestions(EXAM_QUESTIONS);
      setDiscursivePrompts(DISCURSIVE_PROMPTS_REPOSITORY);
      saveStoredDiscursivePrompts(DISCURSIVE_PROMPTS_REPOSITORY);
      window.dispatchEvent(new Event('exam_questions_updated'));
      window.dispatchEvent(new Event('exam_discursive_updated'));
      window.dispatchEvent(new Event('storage'));
      triggerToast('Banco da prova restaurado com sucesso!', 'success');
    }
  };

  // Abrir Modal de Edição da Redação Discursiva
  const handleOpenEditDiscursive = (disc: DiscursivePromptDefinition) => {
    setEditingDiscursivePrompt(disc);
    setEditPromptText(disc.prompt);
    setShowDiscursiveEditModal(true);
  };

  // Salvar Tema da Redação Discursiva
  const handleSaveDiscursivePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscursivePrompt || !editPromptText.trim()) return;
    const next = discursivePrompts.map((d) =>
      d.id === editingDiscursivePrompt.id ? { ...d, prompt: editPromptText.trim() } : d
    );
    setDiscursivePrompts(next);
    saveStoredDiscursivePrompts(next);
    window.dispatchEvent(new Event('exam_discursive_updated'));
    window.dispatchEvent(new Event('storage'));
    setShowDiscursiveEditModal(false);
    setEditingDiscursivePrompt(null);
    triggerToast('Tema da redação atualizado com sucesso!', 'success');
  };

  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qQuestion.trim() || !qOptionA.trim() || !qOptionB.trim() || !qOptionC.trim()) {
      alert('Preencha o enunciado e as três alternativas (A, B e C).');
      return;
    }

    const newQ: ExamQuestionDefinition = {
      id: questions.length + 1,
      topic: qTopic.trim() || 'Teologia Geral',
      cognitiveLevel: qCognitive,
      question: qQuestion.trim(),
      options: [
        { key: 'A', text: qOptionA.trim() },
        { key: 'B', text: qOptionB.trim() },
        { key: 'C', text: qOptionC.trim() },
      ],
      correctKey: qCorrect,
      theologicalNote: 'Fundamento doutrinário canônico.',
      active: true,
    };

    const next = [...questions, newQ];
    setQuestions(next);
    saveStoredExamQuestions(next);
    window.dispatchEvent(new Event('exam_questions_updated'));
    window.dispatchEvent(new Event('storage'));
    setShowNewQuestionModal(false);
    setQQuestion('');
    setQOptionA('');
    setQOptionB('');
    setQOptionC('');
    setQNote('');
    triggerToast('Nova questão adicionada com sucesso!', 'success');
  };

  const handleDeleteQuestion = (id: number) => {
    const q = questions.find((item) => item.id === id);
    if (q) {
      setQuestionToDelete(q);
    }
  };

  const handleConfirmDeleteQuestion = () => {
    if (!questionToDelete) return;
    const qId = questionToDelete.id;
    const next = questions.filter((q) => q.id !== qId).map((q, idx) => ({ ...q, id: idx + 1 }));
    setQuestions(next);
    saveStoredExamQuestions(next);
    window.dispatchEvent(new Event('exam_questions_updated'));
    window.dispatchEvent(new Event('storage'));
    setQuestionToDelete(null);
    triggerToast('Questão excluída do repositório da prova com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ===================================================================== */}
      {/* BARRA DE CONTROLE: APENAS PROCESSO SELETIVOS E OS 3 BOTÕES EM ÍCONE    */}
      {/* ===================================================================== */}
      <div className="bg-white border border-[#c2c9b9] rounded-2xl p-3 sm:p-4 shadow-none flex items-center justify-between gap-4">
        <h2 className="font-display text-base sm:text-lg font-bold text-[#082500] tracking-wide uppercase">
          PROCESSO SELETIVO
        </h2>

        {/* Botões de navegação da barra de controle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Processos Seletivos */}
          <button
            type="button"
            id="btn-subtab-etapas"
            onClick={() => {
              setSubTab('etapas');
              setActiveProcessoPainelId(null);
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-none ${
              subTab === 'etapas'
                ? 'bg-[#123d00] border-[#123d00] text-white shadow-none'
                : 'bg-[#f8faf4] border-[#c2c9b9]/80 text-[#52594d] hover:text-[#082500] hover:bg-[#f2f5ec] shadow-none'
            }`}
            title="Processos Seletivos • Tabela Geral"
            aria-label="Processos Seletivos • Tabela Geral"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Processos Seletivos</span>
          </button>

          {/* 2. Candidato */}
          <button
            type="button"
            id="btn-subtab-candidato"
            onClick={() => setSubTab('dados_pessoais')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-none ${
              subTab === 'dados_pessoais'
                ? 'bg-[#123d00] border-[#123d00] text-white shadow-none'
                : 'bg-[#f8faf4] border-[#c2c9b9]/80 text-[#52594d] hover:text-[#082500] hover:bg-[#f2f5ec] shadow-none'
            }`}
            title="Candidato • Editar página da rota /candidato"
            aria-label="Candidato • Editar página da rota /candidato"
          >
            <IdCard className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Candidato</span>
          </button>

          {/* 3. prova */}
          <button
            type="button"
            id="btn-subtab-prova"
            onClick={() => setSubTab('prova_teologica')}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-none ${
              subTab === 'prova_teologica'
                ? 'bg-[#123d00] border-[#123d00] text-white shadow-none'
                : 'bg-[#f8faf4] border-[#c2c9b9]/80 text-[#52594d] hover:text-[#082500] hover:bg-[#f2f5ec] shadow-none'
            }`}
            title="prova • Editar página da rota /prova"
            aria-label="prova • Editar página da rota /prova"
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">prova</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. ABA PROCESSO SELETIVO: EDITOR DE JORNADA OU TABELA GERAL           */}
      {/* ===================================================================== */}
      {subTab === 'etapas' && editingJourneyConfig && (
        <ProcessoInscricaoEditor
          config={editingJourneyConfig}
          onChangeConfig={setEditingJourneyConfig}
          onSave={handleSaveJourney}
          onCancel={handleCancelJourney}
          isSaving={isSavingJourney}
        />
      )}

      {subTab === 'etapas' && !activeProcessoPainelId && !editingJourneyConfig && (
        <div className="bg-white border border-[#c2c9b9]/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 shadow-xs space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[#f0f2eb]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#123d00] shrink-0" />
                <h3 className="font-display text-sm sm:text-lg font-bold text-[#082500]">
                  Processos Seletivos
                </h3>
              </div>
            </div>
            <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-xs font-semibold text-[#52594d] self-start sm:self-auto">
              {filteredProcessos.length} {filteredProcessos.length === 1 ? 'processo' : 'processos'}
            </div>
          </div>

          {/* Item de busca pelo ID do processo seletivo E Botão "+" para criar novo processo */}
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#73796c] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-busca-processo-id"
                value={processoSearchId}
                onChange={(e) => setProcessoSearchId(e.target.value)}
                placeholder="Buscar pelo ID do processo seletivo..."
                className="w-full pl-10 pr-9 py-2 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] transition-all placeholder-[#73796c]"
              />
              {processoSearchId && (
                <button
                  type="button"
                  onClick={() => setProcessoSearchId('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73796c] hover:text-[#191c19] p-0.5 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botão para criar novo processo seletivo exibindo apenas o ícone "+" */}
            <button
              type="button"
              id="btn-criar-novo-processo"
              onClick={() => {
                setNewProcessoRawId('');
                setNewProcessoIdError(null);
                setShowNewProcessoIdModal(true);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white border border-[#123d00] transition-all cursor-pointer inline-flex items-center justify-center shrink-0 shadow-xs"
              title="Criar novo processo seletivo"
              aria-label="Criar novo processo seletivo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tabela de Processos Seletivos redimensionada para 1 linha única sem rolagem no mobile */}
          <div className="w-full max-w-full overflow-hidden border border-[#c2c9b9]/80 rounded-xl sm:rounded-2xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <colgroup>
                <col className="w-[30%] sm:w-[28%]" />
                <col className="w-[20%] sm:w-[22%]" />
                <col className="w-[50%] sm:w-[50%]" />
              </colgroup>
              <thead className="bg-[#f8faf4] border-b border-[#e1e3dd] font-bold text-[#646029] uppercase tracking-wider text-[10px] sm:text-[11px]">
                <tr>
                  <th className="py-2.5 px-2 sm:py-3.5 sm:px-4 text-left truncate">ID</th>
                  <th className="py-2.5 px-1 sm:py-3.5 sm:px-4 text-center truncate">Inscritos</th>
                  <th className="py-2.5 px-1 sm:py-3.5 sm:px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2eb]">
                {filteredProcessos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-[#73796c]">
                      Nenhum processo seletivo encontrado com o ID pesquisado.
                    </td>
                  </tr>
                ) : (
                  filteredProcessos.map((proc) => {
                    const countInscritos = candidates.filter(
                      (c) => !c.editalId || c.editalId === proc.editalId || proc.id === '#PS-2026-1' || proc.id.toLowerCase() === '#ps-2026-1'
                    ).length;

                    return (
                      <tr key={proc.id} className="hover:bg-[#fafbf8] transition-colors">
                        {/* Coluna ID: Apenas o id do processo seletivo */}
                        <td className="py-2.5 px-2 sm:py-4 sm:px-4 align-middle">
                          <span
                            className="font-mono font-bold text-[10.5px] sm:text-xs text-[#082500] truncate block leading-tight whitespace-nowrap"
                            title={proc.id}
                          >
                            {proc.id}
                          </span>
                        </td>

                        {/* Coluna Inscritos: Quantidade de Inscritos naquele processo seletivo */}
                        <td className="py-2.5 px-1 sm:py-4 sm:px-4 text-center align-middle">
                          <span className="text-[11px] sm:text-xs font-bold text-[#191c19] inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-md bg-[#f4f6f0] sm:bg-transparent">
                            {countInscritos}
                          </span>
                        </td>

                        {/* Coluna Ações: Apenas ícones em 1 única linha sem quebra */}
                        <td className="py-2.5 px-1 sm:py-4 sm:px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-nowrap w-full">
                            {/* 1. Botão para Excluir o processo seletivo */}
                            <button
                              type="button"
                              onClick={() => setProcessoToDelete(proc)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border border-[#fca5a5] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                              title={`Excluir processo seletivo ${proc.id}`}
                              aria-label={`Excluir processo seletivo ${proc.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            </button>

                            {/* 2. Botão para Editar o processo seletivo */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditProcesso(proc)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                              title={`Editar processo seletivo ${proc.id}`}
                              aria-label={`Editar processo seletivo ${proc.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            </button>

                            {/* 3. Botão para Rota daquele processo seletivo */}
                            <button
                              type="button"
                              onClick={() => handleNavigateOrCopyRoute(proc.route)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                              title={`Rota do processo seletivo (${proc.route})`}
                              aria-label={`Rota do processo seletivo (${proc.route})`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            </button>

                            {/* 4. Botão para Abrir o Painel Operacional do Processo Seletivo daquele processo seletivo */}
                            <button
                              type="button"
                              onClick={() => setActiveProcessoPainelId(proc.id)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#123d00] hover:bg-[#082500] text-white transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center shrink-0"
                              title={`Abrir Painel Operacional do Processo Seletivo ${proc.id}`}
                              aria-label={`Abrir Painel Operacional do Processo Seletivo ${proc.id}`}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            </button>
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
      )}

      {/* ===================================================================== */}
      {/* 2. PAINEL OPERACIONAL DO PROCESSO SELETIVO (ACESSADO PELA TABELA)     */}
      {/* ===================================================================== */}
      {subTab === 'etapas' && activeProcessoPainelId && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Barra de Navegação do Painel Operacional com Botão Voltar */}
          <div className="bg-white border border-[#c2c9b9]/80 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-voltar-tabela-processos"
                onClick={() => setActiveProcessoPainelId(null)}
                className="px-3 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] transition-all cursor-pointer inline-flex items-center gap-2 text-xs font-bold shadow-2xs"
                title="Voltar para a Tabela de Processos Seletivos"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Processos Seletivos</span>
              </button>
              <div className="h-5 w-px bg-[#e1e3dd] hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#646029] hidden sm:inline">
                  Painel Operacional:
                </span>
                <span className="font-mono font-bold text-xs text-[#082500] bg-[#f8faf4] border border-[#c2c9b9] px-2.5 py-0.5 rounded-md">
                  {activeProcessoPainelId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ================================================================= */}
            {/* PRIMEIRO COMPONENTE: COLUNA ESQUERDA (20% DA TELA)                */}
            {/* Controle Operacional e Indicadores Rápidos (KPIs)                 */}
            {/* ================================================================= */}
            <div className="w-full lg:w-[22%] xl:w-[20%] shrink-0 space-y-4">
              <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                {/* Identificação da Edição & Controles Rápidos */}
                <div className="pb-3.5 border-b border-[#f0f2eb]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      id="badge-processo-seletivo-id"
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#123d00] text-white shadow-2xs tracking-wider"
                      title={`ID do Processo Seletivo: ${activeProcessoPainelId}`}
                    >
                      {activeProcessoPainelId}
                    </span>

                  {/* Controles Rápidos no topo: Cadeado e Link */}
                  <div className="flex items-center gap-1.5">
                    {/* Chave de Abertura/Fechamento: APENAS ÍCONE DE CADEADO */}
                    <button
                      type="button"
                      id="btn-toggle-inscricoes-processo"
                      onClick={onToggleInscription}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isInscriptionOpen
                          ? 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] border-[#15803d]/30'
                          : 'bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] border-[#b91c1c]/30'
                      }`}
                      title={
                        isInscriptionOpen
                          ? 'Inscrições abertas: clique para encerrar inscrições'
                          : 'Inscrições encerradas: clique para abrir inscrições'
                      }
                      aria-label={isInscriptionOpen ? 'Encerrar Inscrições' : 'Abrir Inscrições'}
                    >
                      {isInscriptionOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>

                    {/* Distribuição e Divulgação: APENAS UM ÍCONE DE LINK */}
                    <button
                      type="button"
                      id="btn-link-distribuicao"
                      onClick={handleCopyInscricaoLink}
                      className="p-2 rounded-xl border border-[#c2c9b9] bg-[#f8faf4] hover:bg-[#f2f5ec] text-[#123d00] transition-colors cursor-pointer relative"
                      title={copiedInscricao ? 'Link copiado com sucesso!' : 'Copiar link da página pública (/inscricao)'}
                      aria-label="Copiar link da página de inscrição"
                    >
                      {copiedInscricao ? (
                        <Check className="w-4 h-4 text-[#15803d]" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Termômetro de Captação: 4 métricas consolidadas em tempo real */}
              <div className="space-y-2.5">
                {/* 1. Total de Inscritos */}
                <div className="p-3 rounded-2xl bg-[#f8faf4] border border-[#c2c9b9]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                      Total de Inscritos
                    </span>
                    <span className="text-xl font-bold text-[#082500] block mt-0.5">
                      {candidates.length}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#123d00]/10 text-[#123d00] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. Aprovados */}
                <div className="p-3 rounded-2xl bg-[#f8faf4] border border-[#15803d]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider block">
                      Aprovados
                    </span>
                    <span className="text-xl font-bold text-[#15803d] block mt-0.5">
                      {candidates.filter((c) => c.status === 'APROVADO').length}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#15803d]/10 text-[#15803d] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. Em Análise */}
                <div className="p-3 rounded-2xl bg-[#f8faf4] border border-[#b45309]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wider block">
                      Em Análise
                    </span>
                    <span className="text-xl font-bold text-[#b45309] block mt-0.5">
                      {candidates.filter((c) => c.status === 'EM_ANALISE').length}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#b45309]/10 text-[#b45309] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* 4. Reprovados */}
                <div className="p-3 rounded-2xl bg-[#f8faf4] border border-[#b91c1c]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-wider block">
                      Reprovados
                    </span>
                    <span className="text-xl font-bold text-[#b91c1c] block mt-0.5">
                      {candidates.filter((c) => c.status === 'REPROVADO').length}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#b91c1c]/10 text-[#b91c1c] flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SEGUNDO COMPONENTE: COLUNA DIREITA (80% DA TELA)                  */}
          {/* Painel Operacional de Monitoramento e Gestão dos Candidatos (CRM)  */}
          {/* ================================================================= */}
          <div className="w-full lg:w-[78%] xl:w-[80%] min-w-0 space-y-4">
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
              {/* Toast de Sucesso do Cadastro Manual */}
              {manualSuccessToast && (
                <div className="p-3 rounded-xl bg-[#15803d] text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#a2d486] shrink-0" />
                  <span>{manualSuccessToast}</span>
                </div>
              )}

              {/* Cabeçalho de Monitoramento e Ação de Adicionar Candidato */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f2eb]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <ShieldCheck className="w-5 h-5 text-[#123d00] shrink-0" />
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                      Monitoramento de Candidatos
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-[#f8faf4] border border-[#c2c9b9] text-xs font-semibold text-[#52594d]">
                    {filteredCandidates.length} de {candidates.length} candidatos
                  </div>

                  {/* Adicionar Candidato Manualmente: APENAS ÍCONE DE MAIS (+) */}
                  <button
                    type="button"
                    id="btn-adicionar-candidato-manual"
                    onClick={handleOpenManualModal}
                    className="p-2.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white shadow-xs transition-all cursor-pointer flex items-center justify-center"
                    title="Adicionar candidato manualmente (sem prova)"
                    aria-label="Adicionar candidato manualmente"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Localização e Triagem: Busca Multifatorial (Nome e ID) e Filtro de Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Busca Multifatorial: Nome e ID */}
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-[#73796c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-busca-candidato"
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    placeholder="Buscar por nome ou ID de inscrição (ex: QGU-2026-0842)..."
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                  />
                  {candidateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCandidateSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtro por Status na Banca Avaliadora */}
                <div className="sm:col-span-4">
                  <select
                    id="select-filtro-status"
                    value={candidateStatusFilter}
                    onChange={(e) => setCandidateStatusFilter(e.target.value as any)}
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="ALL">Todos os Status da Banca</option>
                    <option value="APROVADO">Aprovados</option>
                    <option value="EM_ANALISE">Em Análise / Pendentes</option>
                    <option value="REPROVADO">Reprovados</option>
                  </select>
                </div>
              </div>

              {/* Tabela Operacional de Monitoramento */}
              <div className="overflow-x-auto border border-[#e1e3dd] rounded-2xl">
                <table className="w-full text-left text-xs text-[#191c19]">
                  <thead className="bg-[#f8faf4] border-b border-[#e1e3dd] font-bold text-[#646029] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Candidato / Identificação</th>
                      <th className="py-3.5 px-4 text-center">WhatsApp</th>
                      <th className="py-3.5 px-4 text-center">Ficha de Inscrição</th>
                      <th className="py-3.5 px-4 text-center">Prova Teológica</th>
                      <th className="py-3.5 px-4 text-center">Status da Banca</th>
                      <th className="py-3.5 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2eb]">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-[#73796c]">
                          <div className="max-w-md mx-auto space-y-3 px-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#f4f6f0] border border-[#c2c9b9] flex items-center justify-center mx-auto text-[#73796c]">
                              <Users className="w-6 h-6 opacity-60" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#082500]">
                                Nenhum candidato encontrado
                              </p>
                              <p className="text-xs text-[#73796c] mt-1">
                                {candidates.length === 0
                                  ? 'O Processo Seletivo ainda não possui inscritos registrados. Candidatos que enviarem o formulário pelo link público serão listados aqui automaticamente.'
                                  : 'Nenhum candidato corresponde aos critérios de busca ou filtros selecionados.'}
                              </p>
                            </div>
                            {candidates.length === 0 && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={handleCopyInscricaoLink}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#a2d486]" />
                                  <span>Copiar Link de Inscrição (/inscricao)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c) => {
                        const isExempt = c.communionStatus?.includes('Cadastro Manual');

                        return (
                          <tr key={c.id} className="hover:bg-[#fafbf8] transition-colors">
                            {/* 1. Candidato / Identificação */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5 min-w-0">
                                <strong className="text-xs text-[#082500] truncate block">
                                  {c.fullName}
                                </strong>
                                <span className="text-[10px] font-mono text-[#73796c] block">
                                  {c.id}
                                </span>
                              </div>
                            </td>

                            {/* 2. Ações Imediatas com Candidatos: WhatsApp APENAS ÍCONE */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openWhatsApp(c)}
                                className="p-2 rounded-xl bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] transition-colors cursor-pointer inline-flex items-center justify-center border border-[#15803d]/20 shadow-2xs"
                                title='Enviar mensagem via WhatsApp: "Paz do Senhor!"'
                                aria-label="WhatsApp Paz do Senhor"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </td>

                            {/* 4. Acesso à Ficha de Inscrição: APENAS ÍCONE */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateForMinisterial(c)}
                                className="p-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                title="Acessar Ficha de Inscrição Completa"
                                aria-label="Acessar Ficha de Inscrição Completa"
                              >
                                <FileText className="w-4 h-4 text-[#123d00]" />
                              </button>
                            </td>

                            {/* 5. Prova Teológica */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {isExempt ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e2e8f0] text-[#475569] font-medium text-[10px]">
                                  Dispensado
                                </span>
                              ) : (
                                <div>
                                  <span className="font-bold text-xs text-[#082500]">
                                    {c.objectiveScore.correct}/{c.objectiveScore.total}
                                  </span>
                                  <span className="text-[10px] text-[#73796c] block">
                                    ({c.objectiveScore.percentage}%)
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 6. Status da Banca */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  c.status === 'APROVADO'
                                    ? 'bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30'
                                    : c.status === 'EM_ANALISE'
                                    ? 'bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30'
                                    : 'bg-[#b91c1c]/10 text-[#b91c1c] border border-[#b91c1c]/30'
                                }`}
                              >
                                {c.status === 'APROVADO'
                                  ? 'Aprovado'
                                  : c.status === 'EM_ANALISE'
                                  ? 'Em Análise'
                                  : 'Reprovado'}
                              </span>
                            </td>

                            {/* 7. Gestão de Registros: APENAS ÍCONES (Editar e Excluir) */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Editar: apenas ícone */}
                                <button
                                  type="button"
                                  onClick={() => onUpdateCandidate?.(c)}
                                  className="p-1.5 rounded-lg border border-[#c2c9b9] hover:bg-[#f2f5ec] text-[#123d00] transition-colors cursor-pointer"
                                  title="Editar dados cadastrais"
                                  aria-label="Editar dados cadastrais"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Excluir: apenas ícone */}
                                <button
                                  type="button"
                                  onClick={() => onDeleteCandidate?.(c.id)}
                                  className="p-1.5 rounded-lg border border-[#fca5a5] hover:bg-[#fee2e2] text-[#b91c1c] transition-colors cursor-pointer"
                                  title="Excluir inscrição"
                                  aria-label="Excluir inscrição"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
          </div>
        </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ABA CANDIDATO: EDITOR DO CANDIDATO & PAGINA CANDIDATO (LIVE PREVIEW) */}
      {/* ===================================================================== */}
      {subTab === 'dados_pessoais' && (
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* PAINEL DE CONTROLES (COLUNA ESQUERDA - 40% DA TELA) */}
          <div className="w-full lg:w-[40%] space-y-4">
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              {/* Header com o título principal exigido */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#f0f2eb]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
                      <IdCard className="w-4 h-4 text-[#a2d486]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                          Editor do Candidato
                        </h3>
                        <span className="text-[10px] font-bold bg-[#123d00]/10 text-[#123d00] px-2 py-0.5 rounded-full border border-[#123d00]/20">
                          Página-Modelo
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#73796c] block">
                        Base canônica da rota /candidato para criação de novos processos seletivos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-add-form-field"
                    onClick={() => setIsNewFieldModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Adicionar novo campo ao formulário"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#a2d486]" />
                    <span>Novo Campo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultFields}
                    className="p-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] text-[#191c19] text-xs font-semibold transition-colors cursor-pointer"
                    title="Restaurar campos canônicos oficiais"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#646029]" />
                  </button>
                </div>
              </div>

              {/* Status bar */}
              <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-xl px-3 py-2 flex items-center justify-between text-xs text-[#52594d]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                  <span className="font-semibold text-[#082500]">
                    {formFields.filter((f) => f.active).length} de {formFields.length} campos ativos
                  </span>
                </div>
                <span className="text-[11px] text-[#73796c]">
                  Arraste para reordenar
                </span>
              </div>

              {/* Área Rolável onde o administrador adiciona campos, arrasta itens e ativa/desativa configurações */}
              <div className="max-h-[calc(100vh-270px)] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {formFields.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`p-3 rounded-2xl border transition-all select-none ${
                      draggedFieldIndex === index
                        ? 'opacity-40 border-dashed border-[#123d00] bg-[#eef7e8]'
                        : field.active
                        ? 'bg-[#fafbf8] border-[#e1e3dd] hover:border-[#c2c9b9]'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Drag Handle, Order, and Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-[#949a8d] hover:text-[#082500] p-1 rounded"
                          title="Clique e arraste para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Subir / Descer Buttons */}
                        <div className="flex flex-col -space-y-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveField(index, 'up')}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Subir posição"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formFields.length - 1}
                            onClick={() => handleMoveField(index, 'down')}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Descer posição"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="w-5 h-5 rounded-full bg-[#123d00]/10 text-[#123d00] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-xs text-[#082500] truncate">
                              {field.label}
                            </strong>
                            <span className="text-[9px] font-mono text-[#73796c] bg-[#f0f2eb] px-1 py-0.2 rounded">
                              {field.name}
                            </span>
                            <span className="text-[9px] font-semibold text-[#646029] bg-[#646029]/10 px-1.5 py-0.2 rounded-full uppercase">
                              {field.type}
                            </span>
                            {!field.active && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded uppercase">
                                Inativo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Controles Rápidos (Obrigatório / Opcional, Ativo / Inativo, Editar e Excluir) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Required Toggle */}
                        <button
                          type="button"
                          id={`btn-toggle-req-${field.id}`}
                          onClick={() => handleToggleFieldRequired(field.id)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                            field.required
                              ? 'bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]/30 hover:bg-[#fecaca]'
                              : 'bg-[#f0f2eb] text-[#52594d] border-[#c2c9b9]/60 hover:bg-[#e4e7dd]'
                          }`}
                          title={`Alternar obrigatoriedade (atualmente ${field.required ? 'Obrigatório' : 'Opcional'})`}
                          aria-label={`Alternar obrigatoriedade do campo ${field.label}`}
                        >
                          {field.required ? 'Obrigatório' : 'Opcional'}
                        </button>

                        {/* Active Toggle */}
                        <button
                          type="button"
                          id={`btn-toggle-active-${field.id}`}
                          onClick={() => handleToggleFieldActive(field.id)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                            field.active
                              ? 'bg-[#dcfce7] text-[#15803d] border-[#15803d]/30 hover:bg-[#bbf7d0]'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          }`}
                          title={`Ativar ou desativar na página /candidato (atualmente ${field.active ? 'Ativo' : 'Inativo'})`}
                          aria-label={`Ativar ou desativar campo ${field.label}`}
                        >
                          {field.active ? 'Ativo' : 'Inativo'}
                        </button>

                        {/* Edit Quick Control */}
                        <button
                          type="button"
                          id={`btn-edit-field-${field.id}`}
                          onClick={() =>
                            setEditingField({
                              ...field,
                              options: field.options ? [...field.options] : [],
                              rows: field.rows || (field.type === 'textarea' ? 4 : undefined),
                              maxFileSizeMb: field.maxFileSizeMb || (field.type === 'file' ? 10 : undefined),
                              fileAccept: field.fileAccept || (field.type === 'file' ? '.pdf,.jpg,.jpeg,.png' : undefined),
                              checkboxTerms: field.checkboxTerms || (field.type === 'checkbox' ? field.helpText || field.label : undefined),
                            })
                          }
                          className="px-2 py-1 rounded-lg border border-[#c2c9b9] hover:border-[#123d00] hover:bg-[#123d00]/10 text-[#123d00] transition-all cursor-pointer inline-flex items-center gap-1 text-[9px] font-bold uppercase shadow-2xs"
                          title={`Editar configurações avançadas do campo (${field.type})`}
                          aria-label={`Editar campo ${field.label}`}
                        >
                          <Edit className="w-3 h-3 text-[#123d00]" />
                          <span>Editar</span>
                        </button>

                        {/* Delete (disponível em todos os campos novos e canônicos) */}
                        <button
                          type="button"
                          id={`btn-delete-field-${field.id}`}
                          onClick={() => handleDeleteField(field)}
                          className="p-1.5 rounded-lg border border-[#c2c9b9] hover:bg-[#fee2e2] hover:border-[#b91c1c]/40 text-[#b91c1c] transition-colors cursor-pointer"
                          title="Excluir Campo"
                          aria-label={`Excluir campo ${field.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW (COLUNA DIREITA - 60% DA TELA) */}
          <div className="w-full lg:w-[60%] lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl shadow-xs overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
              {/* Header com o título principal exigido */}
              <div className="px-5 py-4 bg-white border-b border-[#f0f2eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#123d00]/10 text-[#123d00] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#123d00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                        Pagina Candidato
                      </h3>
                      <span className="text-[10px] font-bold bg-[#123d00]/10 text-[#123d00] px-2 py-0.5 rounded-full border border-[#123d00]/20">
                        Página-Modelo
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-gray-100 text-[#42493d] px-2 py-0.5 rounded-full border border-gray-200">
                        Rota: /candidato
                      </span>
                    </div>
                    <p className="text-[11px] text-[#73796c]">
                      Espelho em tempo real da página-modelo de cadastro de candidatos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-ping"></span>
                    <span>Live Preview Ativo</span>
                  </span>
                </div>
              </div>

              {/* Espelho fiel da página /candidato (CandidatePersonalData.tsx) */}
              {(() => {
                const fullNameField = formFields.find((f) => f.name === 'fullName');
                const birthDateField = formFields.find((f) => f.name === 'birthDate');
                const emailField = formFields.find((f) => f.name === 'email');
                const phoneField = formFields.find((f) => f.name === 'phone');
                const poloField = formFields.find((f) => f.name === 'polo');
                const pastorField = formFields.find((f) => f.name === 'pastor');
                const reqField = formFields.find((f) => f.name === 'meetsRequirements');
                const motivationField = formFields.find((f) => f.name === 'motivation');
                const customFields = formFields.filter(
                  (f) =>
                    f.active &&
                    !['fullName', 'birthDate', 'email', 'phone', 'polo', 'pastor', 'meetsRequirements', 'motivation'].includes(
                      f.name
                    )
                );

                return (
                  <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-[#f8faf4]/40 custom-scrollbar">
                    <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:px-8 sm:pb-8 sm:pt-6 shadow-xs space-y-6">
                      {/* Step Header */}
                      <div>
                        <span className="text-xs font-bold text-[#646029] tracking-widest uppercase block">
                          ETAPA 1 DE 2
                        </span>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#082500] uppercase tracking-wide mt-1">
                          SOBRE O CANDIDATO
                        </h2>
                        <p className="text-xs sm:text-sm text-[#42493d] mt-1">
                          Preencha todos os campos cadastrais para sua inscrição.
                        </p>
                      </div>

                      {/* Form Fields Grid */}
                      <div className="space-y-6 pt-2">
                        {/* Row 1: Full Name & Birthdate */}
                        {(fullNameField?.active || birthDateField?.active) && (
                          <div
                            className={`grid grid-cols-1 ${
                              fullNameField?.active && birthDateField?.active ? 'sm:grid-cols-3' : 'sm:grid-cols-1'
                            } gap-4`}
                          >
                            {fullNameField?.active && (
                              <div className={`${birthDateField?.active ? 'sm:col-span-2' : ''} space-y-1.5`}>
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {fullNameField.label}{' '}
                                    {fullNameField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                <input
                                  id="input-full-name-preview"
                                  type="text"
                                  value={previewInputValues.fullName || ''}
                                  onChange={(e) =>
                                    setPreviewInputValues((prev) => ({ ...prev, fullName: e.target.value }))
                                  }
                                  placeholder={fullNameField.placeholder || 'Ex: Lucas Alencar de Oliveira'}
                                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                />
                              </div>
                            )}

                            {birthDateField?.active && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {birthDateField.label}{' '}
                                    {birthDateField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                <input
                                  id="input-birth-date-preview"
                                  type="date"
                                  value={previewInputValues.birthDate || ''}
                                  onChange={(e) =>
                                    setPreviewInputValues((prev) => ({ ...prev, birthDate: e.target.value }))
                                  }
                                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Row 2: Email & WhatsApp */}
                        {(emailField?.active || phoneField?.active) && (
                          <div
                            className={`grid grid-cols-1 ${
                              emailField?.active && phoneField?.active ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
                            } gap-4`}
                          >
                            {emailField?.active && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {emailField.label}{' '}
                                    {emailField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                <input
                                  id="input-email-preview"
                                  type="email"
                                  value={previewInputValues.email || ''}
                                  onChange={(e) =>
                                    setPreviewInputValues((prev) => ({ ...prev, email: e.target.value }))
                                  }
                                  placeholder={emailField.placeholder || 'Ex: lucas.oliveira@comieadepa.org'}
                                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                />
                              </div>
                            )}

                            {phoneField?.active && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-[#15803d]" />
                                  <span>
                                    {phoneField.label}{' '}
                                    {phoneField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                <input
                                  id="input-phone-preview"
                                  type="tel"
                                  value={previewInputValues.phone || ''}
                                  onChange={(e) =>
                                    setPreviewInputValues((prev) => ({ ...prev, phone: e.target.value }))
                                  }
                                  placeholder={phoneField.placeholder || 'Ex: (91) 98257-7589'}
                                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Row 3: Campo & Nome Pastor Presidente */}
                        {(poloField?.active || pastorField?.active) && (
                          <div
                            className={`grid grid-cols-1 ${
                              poloField?.active && pastorField?.active ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
                            } gap-4`}
                          >
                            {poloField?.active && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {poloField.label}{' '}
                                    {poloField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                {poloField.type === 'select' || (poloField.options && poloField.options.length > 0) ? (
                                  <select
                                    id="input-polo-preview"
                                    value={previewInputValues.polo || ''}
                                    onChange={(e) =>
                                      setPreviewInputValues((prev) => ({ ...prev, polo: e.target.value }))
                                    }
                                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                  >
                                    <option value="">{poloField.placeholder || 'Selecione seu Campo...'}</option>
                                    {poloField.options?.map((opt, oIdx) => (
                                      <option key={oIdx} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    id="input-polo-preview"
                                    type="text"
                                    value={previewInputValues.polo || ''}
                                    onChange={(e) =>
                                      setPreviewInputValues((prev) => ({ ...prev, polo: e.target.value }))
                                    }
                                    placeholder={poloField.placeholder || 'Ex: Coqueiro/COMIEADEPA'}
                                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                  />
                                )}
                              </div>
                            )}

                            {pastorField?.active && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {pastorField.label}{' '}
                                    {pastorField.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                <input
                                  id="input-pastor-preview"
                                  type="text"
                                  value={previewInputValues.pastor || ''}
                                  onChange={(e) =>
                                    setPreviewInputValues((prev) => ({ ...prev, pastor: e.target.value }))
                                  }
                                  placeholder={pastorField.placeholder || 'Ex: Pr. Océlio Nauar de Araújo'}
                                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Custom Fields adicionados pelo Administrador */}
                        {customFields.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            {customFields.map((cf) => (
                              <div
                                key={cf.id}
                                className={`space-y-1.5 ${
                                  cf.type === 'file' || cf.type === 'textarea' ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[#123d00]" />
                                  <span>
                                    {cf.label} {cf.required && <span className="text-[#b91c1c]">*</span>}
                                  </span>
                                </label>
                                {cf.type === 'select' ? (
                                  <select
                                    value={previewInputValues[cf.name] || ''}
                                    onChange={(e) =>
                                      setPreviewInputValues((prev) => ({ ...prev, [cf.name]: e.target.value }))
                                    }
                                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                                  >
                                    <option value="">Selecione uma opção...</option>
                                    {cf.options?.map((opt, oIdx) => (
                                      <option key={oIdx} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : cf.type === 'file' ? (
                                  <div className="border-2 border-dashed border-[#c2c9b9] rounded-2xl p-4 bg-[#f8faf4] text-center hover:bg-[#f2f5ec] transition-colors cursor-pointer space-y-1">
                                    <FileText className="w-5 h-5 text-[#123d00] mx-auto" />
                                    <p className="text-xs font-semibold text-[#082500]">
                                      {cf.placeholder || 'Clique ou arraste documento'}
                                    </p>
                                    <p className="text-[10px] text-[#73796c]">
                                      Formatos aceitos: {cf.fileAccept || 'PDF, PNG, JPG'} (máx. {cf.maxFileSizeMb || 10}MB)
                                    </p>
                                  </div>
                                ) : cf.type === 'textarea' ? (
                                  <textarea
                                    rows={cf.rows || 4}
                                    value={previewInputValues[cf.name] || ''}
                                    onChange={(e) =>
                                      setPreviewInputValues((prev) => ({ ...prev, [cf.name]: e.target.value }))
                                    }
                                    placeholder={cf.placeholder || `Informe ${cf.label.toLowerCase()}...`}
                                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-3 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                                  />
                                ) : cf.type === 'checkbox' ? (
                                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf4] border border-[#c2c9b9] hover:bg-[#f2f5ec] transition-colors cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(previewInputValues[cf.name])}
                                      onChange={(e) =>
                                        setPreviewInputValues((prev) => ({ ...prev, [cf.name]: e.target.checked }))
                                      }
                                      className="mt-0.5 rounded border-[#c2c9b9] text-[#123d00] focus:ring-[#123d00] h-4 w-4"
                                    />
                                    <span className="text-xs text-[#191c19] font-medium leading-relaxed">
                                      {cf.checkboxTerms || cf.helpText || cf.label}
                                    </span>
                                  </label>
                                ) : (
                                  <input
                                    type={
                                      cf.type === 'date'
                                        ? 'date'
                                        : cf.type === 'email'
                                        ? 'email'
                                        : cf.type === 'tel'
                                        ? 'tel'
                                        : 'text'
                                    }
                                    value={previewInputValues[cf.name] ?? ''}
                                    onChange={(e) =>
                                      setPreviewInputValues((prev) => ({ ...prev, [cf.name]: e.target.value }))
                                    }
                                    placeholder={cf.placeholder || `Informe ${cf.label.toLowerCase()}...`}
                                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Confirmação de Requisitos * (Radio Buttons - Idêntico a CandidatePersonalData) */}
                        {reqField?.active && (
                          <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-5 space-y-3">
                            <label className="text-xs font-bold text-[#082500] uppercase tracking-wider block">
                              {reqField.label} {reqField.required && <span className="text-[#b91c1c]">*</span>}
                            </label>
                            <p className="text-xs text-[#42493d] leading-relaxed">
                              {reqField.helpText ||
                                'Você confirma que é membro da COMIEADEPA em perfeita comunhão, possui Ensino Médio completo e tem o curso básico em teologia completo (ou está cursando a EMIL)?'}
                            </p>

                            <div className="flex items-center gap-6 pt-1 flex-wrap">
                              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#191c19]">
                                <input
                                  id="radio-req-sim-preview"
                                  type="radio"
                                  name="previewMeetsRequirements"
                                  checked={previewRequirements === true}
                                  onChange={() => setPreviewRequirements(true)}
                                  className="w-4 h-4 accent-[#123d00] cursor-pointer"
                                />
                                <span>Sim, confirmo plenamente todos os requisitos</span>
                              </label>

                              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#b91c1c]">
                                <input
                                  id="radio-req-nao-preview"
                                  type="radio"
                                  name="previewMeetsRequirements"
                                  checked={previewRequirements === false}
                                  onChange={() => setPreviewRequirements(false)}
                                  className="w-4 h-4 accent-[#b91c1c] cursor-pointer"
                                />
                                <span>Não possuo os requisitos</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Escreva um pouco * (Campo de Parágrafo: Motivação - Idêntico a CandidatePersonalData) */}
                        {motivationField?.active && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                                <Quote className="w-3.5 h-3.5 text-[#123d00]" />
                                <span>
                                  {motivationField.label}{' '}
                                  {motivationField.required && <span className="text-[#b91c1c]">*</span>}
                                </span>
                              </label>
                              <span className="text-[10px] text-[#73796c] font-mono">
                                {(previewInputValues.motivation || '').length} caracteres
                              </span>
                            </div>
                            <p className="text-xs text-[#42493d]">
                              {motivationField.helpText ||
                                'Explique a sua motivação para participar do projeto de escritores QGU e a sua convicção para atuar na área da escrita cristã.'}
                            </p>

                            <textarea
                              id="textarea-motivation-preview"
                              rows={5}
                              value={previewInputValues.motivation || ''}
                              onChange={(e) =>
                                setPreviewInputValues((prev) => ({ ...prev, motivation: e.target.value }))
                              }
                              placeholder={
                                motivationField.placeholder ||
                                'Ex: Desde o início do meu discipulado nas fileiras da COMIEADEPA, compreendi que a pena do escritor sagrado tem o poder de cristalizar a sã doutrina para as futuras gerações...'
                              }
                              className="w-full bg-[#f8faf4] border rounded-2xl p-4 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] leading-relaxed border-[#c2c9b9]"
                            />
                          </div>
                        )}

                        {/* Action Buttons da página /candidato (Idêntico a CandidatePersonalData) */}
                        <div className="pt-6 border-t border-[#e7e9e3] flex flex-col sm:flex-row items-center justify-between gap-4">
                          <button
                            type="button"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[#c2c9b9] text-[#42493d] hover:bg-[#f2f4ee] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Voltar para Instruções</span>
                          </button>

                          <button
                            type="button"
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-100"
                          >
                            <span>Avançar para Conhecimentos Gerais em Teologia</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#123d00]/5 border border-[#123d00]/15 text-center text-[11px] text-[#082500]">
                      💡 <strong>Espelho Fiel da Rota /candidato:</strong> Exibe com exatidão os componentes, tipografia, grid responsivo, caixas de diálogo e botões de <code>CandidatePersonalData</code>. Qualquer modificação no painel esquerdo reflete instantaneamente neste contêiner.
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ABA PROVA: EDITOR DA PÁGINA DA ROTA /prova COM LIVE PREVIEW        */}
      {/* ===================================================================== */}
      {subTab === 'prova_teologica' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ================================================================= */}
          {/* COLUNA ESQUERDA (40%): EDITOR DA PROVA (/prova)                  */}
          {/* ================================================================= */}
          <div className="w-full lg:w-[40%] space-y-4">
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              {/* Header do Editor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#f0f2eb]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-[#a2d486]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                          Editor da Prova
                        </h3>
                        <span className="text-[10px] font-bold bg-[#123d00]/10 text-[#123d00] px-2 py-0.5 rounded-full border border-[#123d00]/20">
                          Página-Modelo
                        </span>
                      </div>
                      <span className="text-[10px] text-[#73796c] block">
                        Base canônica da rota /prova para criação de processos seletivos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-add-exam-question"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQTopic('Bibliologia');
                      setQQuestion('');
                      setQOptionA('');
                      setQOptionB('');
                      setQOptionC('');
                      setQCorrect('B');
                      setShowNewQuestionModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Adicionar nova questão objetiva"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#a2d486]" />
                    <span>Nova Questão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultQuestions}
                    className="p-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] text-[#191c19] text-xs font-semibold transition-colors cursor-pointer"
                    title="Restaurar questões canônicas padrão da prova"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#646029]" />
                  </button>
                </div>
              </div>

              {/* Barra de Status */}
              <div className="bg-[#f8faf4] border border-[#e1e3dd] rounded-xl px-3 py-2 flex items-center justify-between text-xs text-[#52594d]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                  <span className="font-semibold text-[#082500]">
                    {questions.filter((q) => q.active !== false).length} de {questions.length} questões ativas
                  </span>
                </div>
                <span className="text-[11px] text-[#73796c]">
                  Use as setas para reordenar
                </span>
              </div>

              {/* Lista Rolável de Questões */}
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {questions.map((q, index) => {
                  const isActive = q.active !== false;
                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-[#fafbf8] border-[#e1e3dd] hover:border-[#c2c9b9]'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#f0f2eb]">
                        {/* Botões de Subir/Descer, Número e Tópico */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col -space-y-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveQuestion(index, 'up')}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Subir posição"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === questions.length - 1}
                              onClick={() => handleMoveQuestion(index, 'down')}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Descer posição"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          <span className="text-xs font-bold text-[#082500]">
                            {q.topic}
                          </span>
                        </div>

                        {/* Ações: Ativar/Ocultar, Editar, Excluir */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionActive(q.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#123d00]/10 text-[#123d00] hover:bg-[#123d00]/20'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={isActive ? 'Desativar da prova' : 'Ativar na prova'}
                          >
                            {isActive ? 'Ativa' : 'Oculta'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="p-1.5 rounded-lg text-[#52594d] hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Editar questão"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-[#b91c1c] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                            title="Excluir questão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Enunciado */}
                      <p className="text-xs font-bold text-[#082500] mt-2 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Alternativas (A, B e C) */}
                      <div className="space-y-1.5 mt-2.5">
                        {q.options.map((opt) => {
                          const isCorrect = opt.key === q.correctKey;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-xl border text-[11px] flex items-start gap-2 ${
                                isCorrect
                                  ? 'bg-[#dcfce7]/60 border-[#15803d] text-[#14532d] font-semibold'
                                  : 'bg-white border-[#e1e3dd] text-[#42493d]'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${
                                  isCorrect ? 'bg-[#15803d] text-white' : 'bg-[#f0f2eb] text-[#73796c]'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="flex-1 leading-snug">{opt.text}</span>
                              {isCorrect && (
                                <span className="text-[9px] font-bold text-[#15803d] flex items-center gap-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                  Gabarito
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tema da Redação Discursiva */}
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
                <div>
                  <h4 className="font-display text-base font-bold text-[#082500]">
                    Tema da Redação (/prova)
                  </h4>
                  <p className="text-xs text-[#73796c]">
                    Proposta dissertativa avaliada pela Coordenação Teológica.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#123d00] bg-[#123d00]/10 px-2.5 py-1 rounded-xl">
                  {discursivePrompts.filter((d) => d.active).length} Ativo
                </span>
              </div>

              <div className="space-y-3">
                {discursivePrompts.map((disc) => (
                  <div
                    key={disc.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      disc.active ? 'bg-[#fcfdfa] border-[#123d00]/60' : 'bg-gray-50 border-gray-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[#082500]">
                        {disc.title}
                      </strong>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDiscursive(disc)}
                          className="p-1 rounded-lg text-[#52594d] hover:bg-gray-100 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                          title="Editar enunciado do tema"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            disc.active ? 'bg-[#15803d]/10 text-[#15803d]' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {disc.active ? 'Vigente' : 'Suplente'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#191c19] font-medium bg-white p-3 rounded-xl border border-[#e1e3dd]">
                      "{disc.prompt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* COLUNA DIREITA (60%): LIVE PREVIEW EM TEMPO REAL (/prova)         */}
          {/* ================================================================= */}
          <div className="w-full lg:w-[60%] lg:sticky lg:top-4 space-y-4">
            <div className="bg-white border border-[#c2c9b9]/80 rounded-3xl overflow-hidden shadow-xs">
              {/* Browser Mock Header */}
              <div className="p-4 sm:p-5 border-b border-[#f0f2eb] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-base sm:text-lg font-bold text-[#082500]">
                        Pagina Prova
                      </h3>
                      <span className="text-[10px] font-bold bg-[#123d00]/10 text-[#123d00] px-2 py-0.5 rounded-full border border-[#123d00]/20">
                        Página-Modelo
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-gray-100 text-[#42493d] px-2 py-0.5 rounded-full border border-gray-200">
                        Rota: /prova
                      </span>
                    </div>
                    <p className="text-[11px] text-[#73796c]">
                      Espelho em tempo real da página-modelo de avaliação teológica
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/prova"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] text-[#082500] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Abrir página /prova em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#123d00]" />
                    <span>Abrir /prova</span>
                  </a>

                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#15803d] bg-[#15803d]/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-ping"></span>
                    <span>Live Preview Ativo</span>
                  </span>
                </div>
              </div>

              {/* Espelho fiel da página /prova (CandidateTheologicalExam.tsx) */}
              {(() => {
                const activeQuestions = questions.filter((q) => q.active !== false);
                const activePrompt =
                  discursivePrompts.find((d) => d.active) ||
                  discursivePrompts[0] || {
                    id: 'disc-default',
                    title: 'Tema Vigente',
                    prompt: 'O que significa, para você, ser um cristão cheio do Espírito Santo?',
                    minimumChars: 30,
                    active: true,
                    evaluationCriteria: [],
                  };

                const answeredObjCount = Object.keys(previewExamAnswers).filter((k) =>
                  activeQuestions.some((q) => q.id === Number(k))
                ).length;
                const isDiscursiveFilled = (previewDiscursiveAnswer || '').trim().length >= 30;
                const totalQuestionsCount = activeQuestions.length + 1;
                const totalAnsweredCount = answeredObjCount + (isDiscursiveFilled ? 1 : 0);

                return (
                  <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-[#f8faf4]/40 custom-scrollbar max-h-[calc(100vh-270px)]">
                    {/* Header Card */}
                    <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:px-8 sm:pb-8 sm:pt-6 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-[#646029] tracking-widest uppercase block">
                            ETAPA 2 DE 2
                          </span>
                          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#082500] uppercase tracking-wide mt-1">
                            Conhecimentos Gerais em Teologia
                          </h2>
                          <p className="text-xs sm:text-sm text-[#42493d] mt-1">
                            Avaliação de {activeQuestions.length} questões objetivas e 1 redação discursiva.
                          </p>
                        </div>

                        {/* Progress Pill */}
                        <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-4 shrink-0 flex flex-col items-end">
                          <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider">
                            PROGRESSO DA PROVA
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="font-display text-2xl font-bold text-[#082500]">
                              {totalAnsweredCount}
                            </span>
                            <span className="text-xs font-bold text-[#73796c]">
                              / {totalQuestionsCount} respondidas
                            </span>
                          </div>
                          <div className="w-28 bg-[#edefe9] h-2 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-[#123d00] h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${
                                  totalQuestionsCount > 0
                                    ? (totalAnsweredCount / totalQuestionsCount) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Canonical Note Banner */}
                      <div className="bg-[#f2f4ee] border border-[#c2c9b9] rounded-2xl p-4 text-xs text-[#42493d] flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-[#123d00] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#082500] block">
                            Instruções para a Prova:
                          </span>
                          <p className="mt-0.5 text-[11px] leading-relaxed">
                            As questões objetivas possuem apenas 1 (uma) alternativa correta. A questão {totalQuestionsCount} será avaliada pela Coordenação Teológica QGU.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Questões Objetivas Renderizadas */}
                    <div className="space-y-5">
                      {activeQuestions.map((q, idx) => {
                        const selectedKey = previewExamAnswers[q.id];
                        return (
                          <div
                            key={q.id}
                            className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all ${
                              selectedKey ? 'border-[#123d00]/50' : 'border-[#c2c9b9]/60'
                            }`}
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#f2f4ee]">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-[#123d00] text-white flex items-center justify-center font-display font-bold text-sm">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-[#646029] uppercase tracking-wider">
                                  {q.topic}
                                </span>
                              </div>

                              {selectedKey && (
                                <span className="text-[11px] font-bold text-[#15803d] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Respondida ({selectedKey})</span>
                                </span>
                              )}
                            </div>

                            {/* Question Text */}
                            <h4 className="text-xs sm:text-sm font-bold text-[#082500] mt-3.5 leading-relaxed">
                              {q.question}
                            </h4>

                            {/* Interactive Options A, B, C */}
                            <div className="space-y-2.5 mt-3.5">
                              {q.options.map((opt) => {
                                const isSelected = selectedKey === opt.key;
                                return (
                                  <div
                                    key={opt.key}
                                    onClick={() =>
                                      setPreviewExamAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: opt.key,
                                      }))
                                    }
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                                      isSelected
                                        ? 'bg-[#f4f6f0] border-[#123d00] shadow-xs'
                                        : 'bg-[#fcfdfa] border-[#e1e3dd] hover:bg-[#f8faf4] hover:border-[#c2c9b9]'
                                    }`}
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                        isSelected
                                          ? 'bg-[#123d00] text-white'
                                          : 'border border-[#c2c9b9] text-[#73796c]'
                                      }`}
                                    >
                                      {opt.key}
                                    </div>

                                    <span
                                      className={`text-xs leading-relaxed ${
                                        isSelected ? 'font-semibold text-[#082500]' : 'text-[#42493d]'
                                      }`}
                                    >
                                      {opt.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Questão Discursiva (Redação) */}
                      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#f2f4ee]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#123d00] text-white flex items-center justify-center font-display font-bold text-sm">
                              {totalQuestionsCount}
                            </span>
                            <span className="text-xs font-bold text-[#646029] uppercase tracking-wider">
                              Redação Teológica Discursiva
                            </span>
                          </div>

                          {isDiscursiveFilled && (
                            <span className="text-[11px] font-bold text-[#15803d] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Respondida</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#082500] leading-relaxed mb-2">
                            "{activePrompt.prompt}"
                          </label>
                          <p className="text-[11px] text-[#73796c] mb-3">
                            Desenvolva sua resposta fundamentando biblicamente a sua convicção teológica e vocacional.
                          </p>

                          <textarea
                            rows={5}
                            value={previewDiscursiveAnswer}
                            onChange={(e) => setPreviewDiscursiveAnswer(e.target.value)}
                            placeholder="Digite sua resposta aqui para testar o live preview..."
                            className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-3.5 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] leading-relaxed"
                          />

                          <div className="flex items-center justify-between text-[11px] text-[#73796c] mt-2">
                            <span>Mínimo: 30 caracteres</span>
                            <span
                              className={`font-mono font-bold ${
                                isDiscursiveFilled ? 'text-[#15803d]' : 'text-[#b91c1c]'
                              }`}
                            >
                              {previewDiscursiveAnswer.trim().length} caracteres
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Mock */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#f0f2eb]">
                        <button
                          type="button"
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#f4f6f0] hover:bg-[#e7e9e3] border border-[#c2c9b9] text-[#191c19] text-xs font-bold transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Voltar para Cadastro</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerToast(
                              'Teste do Live Preview: Prova totalmente preenchida e validada com sucesso!',
                              'success'
                            );
                          }}
                          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-100"
                        >
                          <span>Finalizar e Enviar Avaliação</span>
                          <CheckCircle2 className="w-4 h-4 text-[#a2d486]" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#123d00]/5 border border-[#123d00]/15 text-center text-[11px] text-[#082500]">
                      💡 <strong>Espelho Fiel da Rota /prova:</strong> Exibe com exatidão os componentes, tipografia, alternativas (A, B e C), barra de progresso em tempo real e a redação dissertativa de <code>CandidateTheologicalExam</code>. Qualquer modificação no editor reflete instantaneamente neste contêiner e na rota pública.
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: FICHA DE INSCRIÇÃO DO CANDIDATO                                */}
      {/* ===================================================================== */}
      {selectedCandidateForMinisterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#a2d486]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#082500]">
                    Ficha de Inscrição do Candidato
                  </h4>
                  <p className="text-xs text-[#73796c]">
                    Protocolo {selectedCandidateForMinisterial.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateForMinisterial(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Summary: Apenas as informações que estão no cadastro dele */}
            <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-bold text-[#646029] uppercase tracking-wider block">
                Dados do Cadastro
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {formFields
                  .filter((f) => f.active && f.name !== 'motivation')
                  .map((f) => {
                    let value = '';
                    if (f.name === 'fullName') {
                      value = selectedCandidateForMinisterial.fullName;
                    } else if (f.name === 'birthDate') {
                      const hasBirthDate =
                        selectedCandidateForMinisterial.birthDate &&
                        selectedCandidateForMinisterial.birthDate !== 'Não informada';
                      value = hasBirthDate
                        ? `${selectedCandidateForMinisterial.birthDate}${
                            selectedCandidateForMinisterial.age
                              ? ` (${selectedCandidateForMinisterial.age} anos)`
                              : ''
                          }`
                        : '';
                    } else if (f.name === 'email') {
                      value = selectedCandidateForMinisterial.email;
                    } else if (f.name === 'phone') {
                      value = selectedCandidateForMinisterial.phone;
                    } else if (f.name === 'polo') {
                      value = selectedCandidateForMinisterial.polo;
                    } else if (f.name === 'pastor') {
                      value = selectedCandidateForMinisterial.pastor;
                    } else if (f.name === 'meetsRequirements') {
                      value =
                        selectedCandidateForMinisterial.communionStatus ||
                        'Requisitos confirmados conforme edital';
                    } else {
                      value = selectedCandidateForMinisterial[f.name] || '';
                    }

                    if (!value) return null;

                    const isFullWidth = f.name === 'meetsRequirements' || value.length > 35;

                    return (
                      <div
                        key={f.id || f.name}
                        className={isFullWidth ? 'col-span-1 sm:col-span-2' : ''}
                      >
                        <span className="text-[#73796c] block">{f.label}:</span>
                        <strong className="text-[#082500] font-semibold">{value}</strong>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Prova Teológica Status */}
            <div className="p-4 rounded-2xl bg-[#fafbf8] border border-[#e1e3dd] space-y-1.5">
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                Etapa de Avaliação Teológica:
              </span>
              {selectedCandidateForMinisterial.communionStatus?.includes('Cadastro Manual') ? (
                <div className="flex items-center gap-2 text-xs text-[#15803d] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Candidato homologado administrativamente com dispensa de prova teológica.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#52594d]">
                    Pontuação Objetiva: <strong>{selectedCandidateForMinisterial.objectiveScore.correct}/{selectedCandidateForMinisterial.objectiveScore.total}</strong> ({selectedCandidateForMinisterial.objectiveScore.percentage}%)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedCandidateForMinisterial.status === 'APROVADO'
                      ? 'bg-[#15803d]/10 text-[#15803d]'
                      : selectedCandidateForMinisterial.status === 'EM_ANALISE'
                      ? 'bg-[#b45309]/10 text-[#b45309]'
                      : 'bg-[#b91c1c]/10 text-[#b91c1c]'
                  }`}>
                    {selectedCandidateForMinisterial.status === 'APROVADO' ? 'Aprovado' : selectedCandidateForMinisterial.status === 'EM_ANALISE' ? 'Em Análise' : 'Reprovado'}
                  </span>
                </div>
              )}
            </div>

            {/* Memorial Snippet */}
            <div className="p-4 rounded-2xl bg-[#fafbf8] border border-[#e1e3dd] space-y-1">
              <span className="text-[10px] font-bold text-[#73796c] uppercase tracking-wider block">
                Memorial Vocacional do Vocacionado:
              </span>
              <p className="text-xs text-[#42493d] italic leading-relaxed">
                "{selectedCandidateForMinisterial.memorial || 'Tenho profunda vocação para a escrita e produção literária teológica cristã, buscando fortalecer a sã doutrina no contexto paraense.'}"
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => openWhatsApp(selectedCandidateForMinisterial)}
                className="px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#14532d] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title='Enviar WhatsApp "Paz do Senhor!"'
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Paz do Senhor! (WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectCandidate(selectedCandidateForMinisterial.id);
                  setSelectedCandidateForMinisterial(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Ficha Completa</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADICIONAR CANDIDATO MANUALMENTE (SEM PROVA)                    */}
      {/* ===================================================================== */}
      {isManualCandidateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#a2d486]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#082500]">
                    Cadastrar Candidato Manualmente
                  </h4>
                  <p className="text-xs text-[#73796c]">
                    Inclusão direta vinculada a /candidato (dispensado de prova)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualCandidateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-[#fee2e2] text-[#b91c1c] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleSaveManualCandidate} className="space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-[#646029] uppercase tracking-wider block">
                  Identificação do Candidato
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#082500]">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualFullName}
                    onChange={(e) => setManualFullName(e.target.value)}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="candidato@email.com"
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      WhatsApp de Contato *
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="(91) 98765-4321"
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={manualBirthDate}
                      onChange={(e) => setManualBirthDate(e.target.value)}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      Campo
                    </label>
                    <select
                      value={manualPolo}
                      onChange={(e) => setManualPolo(e.target.value)}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs font-semibold text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                    >
                      {uniquePolos.map((polo) => (
                        <option key={polo} value={polo}>
                          {polo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      Igreja Local
                    </label>
                    <input
                      type="text"
                      value={manualChurch}
                      onChange={(e) => setManualChurch(e.target.value)}
                      placeholder="Ex: Assembleia de Deus Central"
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#082500]">
                      Pastor Presidente
                    </label>
                    <input
                      type="text"
                      value={manualPastor}
                      onChange={(e) => setManualPastor(e.target.value)}
                      placeholder="Ex: Pr. Carlos Alberto"
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#082500]">
                    Status Inicial da Banca
                  </label>
                  <select
                    value={manualInitialStatus}
                    onChange={(e) => setManualInitialStatus(e.target.value as CandidateStatus)}
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs font-semibold text-[#082500] focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="APROVADO">Aprovado Diretamente</option>
                    <option value="EM_ANALISE">Em Análise / Pendente</option>
                    <option value="REPROVADO">Reprovado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#082500]">
                    Memorial / Motivo da Inclusão Direta
                  </label>
                  <textarea
                    rows={2}
                    value={manualMotivation}
                    onChange={(e) => setManualMotivation(e.target.value)}
                    placeholder="Descreva a justificativa ou histórico ministerial do candidato..."
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
                <button
                  type="button"
                  onClick={() => setIsManualCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f2f5ec] text-[#52594d] text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar sem Prova</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: NOVO CAMPO DE FORMULÁRIO (DADOS PESSOAIS)                      */}
      {/* ===================================================================== */}
      {isNewFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveNewField}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <h4 className="font-display font-bold text-base text-[#082500]">
                Adicionar Campo ao Formulário
              </h4>
              <button
                type="button"
                onClick={() => setIsNewFieldModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Rótulo do Campo (Label):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grau de Escolaridade"
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value);
                    if (!newFieldName) {
                      setNewFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                    }
                  }}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                />
              </div>

              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Chave Técnica (Name):
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs font-mono text-[#191c19]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Tipo de Input:
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                  >
                    <option value="text">Texto</option>
                    <option value="email">E-mail</option>
                    <option value="tel">Telefone/WhatsApp</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção (Dropdown)</option>
                    <option value="file">Upload de Arquivo</option>
                    <option value="textarea">Área de Texto (Dissertação)</option>
                    <option value="checkbox">Termo (Checkbox)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Obrigatoriedade:
                  </label>
                  <select
                    value={newFieldRequired ? 'sim' : 'nao'}
                    onChange={(e) => setNewFieldRequired(e.target.value === 'sim')}
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                  >
                    <option value="sim">Obrigatório</option>
                    <option value="nao">Opcional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Texto de Ajuda / Instrução:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Preencha com atenção conforme seu documento."
                  value={newFieldHelpText}
                  onChange={(e) => setNewFieldHelpText(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => setIsNewFieldModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Adicionar Campo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDITAR CAMPO COM EDIÇÃO ESPECÍFICA POR TIPO DE INPUT          */}
      {/* ===================================================================== */}
      {editingField && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-[#c2c9b9] max-h-[92vh] flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#123d00]/10 border border-[#123d00]/20 flex items-center justify-center text-[#123d00]">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-bold text-base sm:text-lg text-[#082500]">
                      Editar Campo: {editingField.label}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e8eee1] text-[#123d00] border border-[#c2c9b9]">
                      {editingField.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#73796c] font-medium flex items-center gap-2 flex-wrap">
                    <span>Identificador: <code className="font-mono text-[#191c19] bg-gray-100 px-1 py-0.5 rounded">{editingField.name}</code></span>
                    <span>•</span>
                    <span>Tipo Atual: <strong className="text-[#123d00] uppercase font-bold">{editingField.type}</strong></span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingField(null);
                  setEditingOptionInput('');
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEditField} className="flex-1 overflow-y-auto pr-1.5 space-y-5 py-4">
              {/* 1. SELETOR DE TIPO DE INPUT (8 TIPOS DISPONÍVEIS) */}
              <div className="bg-[#f8faf4] border border-[#c2c9b9] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#123d00]" />
                    <span>Tipo de Componente (Input)</span>
                  </label>
                  <span className="text-[10px] text-[#73796c]">
                    O formulário abaixo se adapta automaticamente ao tipo escolhido
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'text', label: 'Texto Simples', desc: 'Nomes e textos curtos', icon: Type },
                    { type: 'email', label: 'E-mail', desc: 'Com validação @', icon: Mail },
                    { type: 'tel', label: 'WhatsApp / Tel', desc: 'Com link direto', icon: Phone },
                    { type: 'date', label: 'Data', desc: 'Calendário nativo', icon: Calendar },
                    { type: 'select', label: 'Seleção / Lista', desc: 'Menu suspenso', icon: ListFilter },
                    { type: 'file', label: 'Upload Arquivo', desc: 'PDFs e documentos', icon: FileUp },
                    { type: 'textarea', label: 'Área de Texto', desc: 'Redação / Motivação', icon: AlignLeft },
                    { type: 'checkbox', label: 'Termo / Checkbox', desc: 'Confirmação formal', icon: CheckSquare },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = editingField.type === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => {
                          const newType = t.type as FormFieldConfig['type'];
                          setEditingField({
                            ...editingField,
                            type: newType,
                            options:
                              newType === 'select'
                                ? editingField.options && editingField.options.length > 0
                                  ? editingField.options
                                  : [
                                      'Belém Central/COMIEADEPA',
                                      'Coqueiro/COMIEADEPA',
                                      'Ananindeua/COMIEADEPA',
                                      'Marituba/COMIEADEPA',
                                      'Castanhal/COMIEADEPA',
                                    ]
                                : editingField.options,
                            rows:
                              newType === 'textarea'
                                ? editingField.rows || 4
                                : editingField.rows,
                            maxFileSizeMb:
                              newType === 'file'
                                ? editingField.maxFileSizeMb || 10
                                : editingField.maxFileSizeMb,
                            fileAccept:
                              newType === 'file'
                                ? editingField.fileAccept || '.pdf,.jpg,.jpeg,.png'
                                : editingField.fileAccept,
                            checkboxTerms:
                              newType === 'checkbox'
                                ? editingField.checkboxTerms ||
                                  editingField.helpText ||
                                  `Declaro atender a todos os requisitos do campo ${editingField.label} conforme o Edital Oficial.`
                                : editingField.checkboxTerms,
                          });
                        }}
                        className={`p-2 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#123d00] text-white border-[#123d00] shadow-sm'
                            : 'bg-white text-[#191c19] border-[#c2c9b9] hover:bg-[#f2f5ec]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#123d00]'}`} />
                          <span className="text-[11px] font-bold leading-tight truncate">{t.label}</span>
                        </div>
                        <span className={`text-[9px] line-clamp-1 ${isSelected ? 'text-white/80' : 'text-[#73796c]'}`}>
                          {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. REGRAS GERAIS: RÓTULO, CATEGORIA, OBRIGATORIEDADE E ATIVAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Rótulo do Campo (Label visível):
                  </label>
                  <input
                    type="text"
                    required
                    value={editingField.label}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Categoria do Formulário:
                  </label>
                  <select
                    value={editingField.category}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                  >
                    <option value="pessoal">Dados Pessoais</option>
                    <option value="eclesiastico">Dados Eclesiásticos</option>
                    <option value="ministerial">Dados Ministeriais</option>
                    <option value="documentacao">Documentação e Anexos</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Obrigatoriedade de Preenchimento:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingField({ ...editingField, required: true })}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center ${
                        editingField.required
                          ? 'bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]'
                          : 'bg-[#f8faf4] text-gray-600 border-[#c2c9b9] hover:bg-gray-100'
                      }`}
                    >
                      * Obrigatório
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingField({ ...editingField, required: false })}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center ${
                        !editingField.required
                          ? 'bg-[#dcfce7] text-[#15803d] border-[#15803d]'
                          : 'bg-[#f8faf4] text-gray-600 border-[#c2c9b9] hover:bg-gray-100'
                      }`}
                    >
                      Opcional
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#191c19] block mb-1">
                    Visibilidade na Rota /candidato:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingField({ ...editingField, active: true })}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center ${
                        editingField.active
                          ? 'bg-[#123d00] text-white border-[#123d00]'
                          : 'bg-[#f8faf4] text-gray-600 border-[#c2c9b9] hover:bg-gray-100'
                      }`}
                    >
                      ✓ Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingField({ ...editingField, active: false })}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center ${
                        !editingField.active
                          ? 'bg-gray-200 text-gray-800 border-gray-400'
                          : 'bg-[#f8faf4] text-gray-600 border-[#c2c9b9] hover:bg-gray-100'
                      }`}
                    >
                      ✕ Oculto
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. CONFIGURAÇÕES ESPECÍFICAS POR TIPO DE INPUT */}
              <div className="border-t border-[#f0f2eb] pt-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#123d00]"></span>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#082500]">
                    Configuração Específica: Entrada do Tipo {editingField.type.toUpperCase()}
                  </h5>
                </div>

                {/* --- TIPO: TEXT (TEXTO SIMPLES) --- */}
                {editingField.type === 'text' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Exemplo (Placeholder):
                      </label>
                      <input
                        type="text"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: Lucas Alencar de Oliveira"
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Ajuda / Instrução ao Candidato:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: Informe seu nome civil completo conforme consta no documento de identidade."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Mínimo de Caracteres:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingField.minChars ?? 3}
                          onChange={(e) =>
                            setEditingField({ ...editingField, minChars: parseInt(e.target.value) || 0 })
                          }
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Máximo de Caracteres:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editingField.maxChars ?? 120}
                          onChange={(e) =>
                            setEditingField({ ...editingField, maxChars: parseInt(e.target.value) || 120 })
                          }
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TIPO: EMAIL --- */}
                {editingField.type === 'email' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Exemplo (Placeholder de E-mail):
                      </label>
                      <input
                        type="email"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: lucas.oliveira@comieadepa.org"
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Instrução de Confirmação:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: Enviaremos a confirmação e link da prova para este e-mail."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#dcfce7]/60 border border-[#15803d]/30 text-[11px] text-[#14532d] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803d]" />
                      <span>
                        Validação de formato ativada: o navegador rejeitará e-mails sem o caractere @ ou domínio válido.
                      </span>
                    </div>
                  </div>
                )}

                {/* --- TIPO: TEL (WHATSAPP / TELEFONE) --- */}
                {editingField.type === 'tel' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Placeholder com Formato do DDD:
                      </label>
                      <input
                        type="text"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: (91) 98257-7589"
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Instrução para WhatsApp:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: Informe telefone celular com WhatsApp ativo para convocações da banca examinadora."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#dcfce7]/60 border border-[#15803d]/30 text-[11px] text-[#14532d] flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0 text-[#15803d]" />
                      <span>
                        Integração WhatsApp: O painel administrativo terá link direto para abrir conversa com o candidato.
                      </span>
                    </div>
                  </div>
                )}

                {/* --- TIPO: DATE (DATA) --- */}
                {editingField.type === 'date' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Instrução da Data:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: Data de nascimento oficial conforme certidão ou documento de identidade."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#e8eee1] border border-[#c2c9b9] text-[11px] text-[#123d00] flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0 text-[#123d00]" />
                      <span>
                        O candidato terá um calendário visual de seleção rápida adaptado para celular ou computador.
                      </span>
                    </div>
                  </div>
                )}

                {/* --- TIPO: SELECT (LISTA / DROPDOWN) --- */}
                {editingField.type === 'select' && (
                  <div className="space-y-3.5 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto da Opção Padrão (Placeholder da Lista):
                      </label>
                      <input
                        type="text"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: Selecione o seu Campo..."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    {/* Gerenciador de Opções da Lista */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-[#191c19]">
                          Opções Disponíveis na Lista ({editingField.options?.length || 0}):
                        </label>
                        <button
                          type="button"
                          onClick={handleFillDefaultPolosOptions}
                          className="text-[10px] text-[#123d00] font-bold hover:underline cursor-pointer"
                        >
                          + Preencher Campos COMIEADEPA
                        </button>
                      </div>

                      {/* Input para adicionar nova opção */}
                      <div className="flex gap-2 mb-2.5">
                        <input
                          type="text"
                          value={editingOptionInput}
                          onChange={(e) => setEditingOptionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionToEditingField();
                            }
                          }}
                          placeholder="Digite uma nova opção e clique em Adicionar..."
                          className="flex-1 bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        />
                        <button
                          type="button"
                          onClick={handleAddOptionToEditingField}
                          className="px-3 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>

                      {/* Lista de tags/opções */}
                      <div className="bg-white border border-[#c2c9b9] rounded-xl p-2.5 max-h-40 overflow-y-auto space-y-1.5">
                        {(!editingField.options || editingField.options.length === 0) ? (
                          <div className="text-center py-3 text-amber-700 font-medium text-[11px]">
                            ⚠️ Nenhuma opção cadastrada. Adicione opções acima para o menu suspenso.
                          </div>
                        ) : (
                          editingField.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#f8faf4] border border-[#e4e7dd] text-xs text-[#191c19]"
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#73796c]">{idx + 1}.</span>
                                <span>{opt}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromEditingField(idx)}
                                className="p-1 rounded-md text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Remover opção"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Ajuda / Instrução:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: Selecione o Campo correspondente à sua igreja local."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>
                  </div>
                )}

                {/* --- TIPO: TEXTAREA (ÁREA DE TEXTO / REDAÇÃO) --- */}
                {editingField.type === 'textarea' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Linhas Visíveis (Altura do Campo):
                        </label>
                        <select
                          value={editingField.rows || 4}
                          onChange={(e) =>
                            setEditingField({ ...editingField, rows: parseInt(e.target.value) || 4 })
                          }
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        >
                          <option value="3">3 Linhas (Pequeno)</option>
                          <option value="4">4 Linhas (Médio)</option>
                          <option value="6">6 Linhas (Dissertação)</option>
                          <option value="8">8 Linhas (Extenso)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Meta Mínima de Caracteres:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={editingField.minChars ?? 100}
                          onChange={(e) =>
                            setEditingField({ ...editingField, minChars: parseInt(e.target.value) || 0 })
                          }
                          placeholder="Ex: 100 caracteres"
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Placeholder Orientativo da Dissertação:
                      </label>
                      <input
                        type="text"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: Explique detalhadamente sua motivação vocacional para participar do Projeto Escritores..."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Critérios da Banca / Instruções da Redação:
                      </label>
                      <textarea
                        rows={2}
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: A dissertação será avaliada quanto à clareza bíblica, coesão doutrinária e compromisso institucional."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl p-2.5 text-xs text-[#191c19]"
                      />
                    </div>
                  </div>
                )}

                {/* --- TIPO: FILE (UPLOAD DE ARQUIVO) --- */}
                {editingField.type === 'file' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Formatos Aceitos:
                        </label>
                        <select
                          value={editingField.fileAccept || '.pdf,.jpg,.jpeg,.png'}
                          onChange={(e) => setEditingField({ ...editingField, fileAccept: e.target.value })}
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        >
                          <option value=".pdf">Apenas Documento PDF (.pdf)</option>
                          <option value=".pdf,.jpg,.jpeg,.png">PDF e Imagens (.pdf, .jpg, .png)</option>
                          <option value=".pdf,.doc,.docx,.jpg,.png">Todos os Documentos (.pdf, .docx, .jpg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[#191c19] block mb-1">
                          Limite Máximo de Tamanho:
                        </label>
                        <select
                          value={editingField.maxFileSizeMb || 10}
                          onChange={(e) =>
                            setEditingField({ ...editingField, maxFileSizeMb: parseInt(e.target.value) || 10 })
                          }
                          className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                        >
                          <option value="5">5 Megabytes (MB)</option>
                          <option value="10">10 Megabytes (MB) - Padrão</option>
                          <option value="20">20 Megabytes (MB)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto de Chamada do Dropzone:
                      </label>
                      <input
                        type="text"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Ex: Clique ou arraste a Carta de Recomendação Pastoral assinada"
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Instruções Oficiais do Anexo:
                      </label>
                      <input
                        type="text"
                        value={editingField.helpText || ''}
                        onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                        placeholder="Ex: O documento deve conter assinatura e carimbo do pastor presidente do campo."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                      />
                    </div>
                  </div>
                )}

                {/* --- TIPO: CHECKBOX (TERMO / CONFIRMAÇÃO) --- */}
                {editingField.type === 'checkbox' && (
                  <div className="space-y-3 text-xs bg-[#fbfcf9] border border-[#c2c9b9]/80 rounded-2xl p-4">
                    <div>
                      <label className="font-bold text-[#191c19] block mb-1">
                        Texto Oficial da Declaração / Compromisso:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingField.checkboxTerms || editingField.helpText || ''}
                        onChange={(e) =>
                          setEditingField({
                            ...editingField,
                            checkboxTerms: e.target.value,
                            helpText: e.target.value,
                          })
                        }
                        placeholder="Ex: Declaro sob as penas eclesiásticas e civis que sou membro da COMIEADEPA em plena comunhão..."
                        className="w-full bg-white border border-[#c2c9b9] rounded-xl p-3 text-xs text-[#191c19]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        O candidato deverá marcar afirmativamente esta caixa de seleção para conseguir enviar sua inscrição.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. PRÉ-VISUALIZAÇÃO EM TEMPO REAL DESTE CAMPO */}
              <div className="bg-[#f0f2eb]/70 border border-[#c2c9b9] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#123d00] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Prévia em Tempo Real deste Campo no Formulário</span>
                  </span>
                  <span className="text-[10px] text-[#73796c] italic">
                    Como o candidato verá na rota /candidato
                  </span>
                </div>

                <div className="bg-white border border-[#c2c9b9] rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                  {/* Label */}
                  <label className="text-xs font-bold text-[#191c19] uppercase tracking-wider flex items-center gap-1.5">
                    {editingField.type === 'tel' ? (
                      <Phone className="w-3.5 h-3.5 text-[#15803d]" />
                    ) : editingField.type === 'email' ? (
                      <Mail className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : editingField.type === 'date' ? (
                      <Calendar className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : editingField.type === 'select' ? (
                      <ListFilter className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : editingField.type === 'file' ? (
                      <FileUp className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : editingField.type === 'textarea' ? (
                      <AlignLeft className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : editingField.type === 'checkbox' ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#123d00]" />
                    ) : (
                      <Type className="w-3.5 h-3.5 text-[#123d00]" />
                    )}
                    <span>
                      {editingField.label || 'Título do Campo'}{' '}
                      {editingField.required && <span className="text-[#b91c1c]">*</span>}
                    </span>
                  </label>

                  {/* Dynamic Render in preview */}
                  {editingField.type === 'select' ? (
                    <select
                      disabled
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                    >
                      <option value="">{editingField.placeholder || 'Selecione uma opção...'}</option>
                      {editingField.options?.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : editingField.type === 'file' ? (
                    <div className="border-2 border-dashed border-[#c2c9b9] rounded-xl p-3 bg-[#f8faf4] text-center space-y-1">
                      <FileUp className="w-5 h-5 text-[#123d00] mx-auto" />
                      <p className="text-xs font-semibold text-[#082500]">
                        {editingField.placeholder || 'Clique ou arraste documento'}
                      </p>
                      <p className="text-[10px] text-[#73796c]">
                        Formatos aceitos: {editingField.fileAccept || 'PDF, JPG, PNG'} (máx. {editingField.maxFileSizeMb || 10}MB)
                      </p>
                    </div>
                  ) : editingField.type === 'textarea' ? (
                    <textarea
                      disabled
                      rows={editingField.rows || 4}
                      placeholder={editingField.placeholder || 'Informe sua resposta detalhada...'}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-2.5 text-xs text-[#191c19] resize-none"
                    />
                  ) : editingField.type === 'checkbox' ? (
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="mt-0.5 rounded border-[#c2c9b9] text-[#123d00]"
                      />
                      <span className="text-xs text-[#191c19] font-medium leading-relaxed">
                        {editingField.checkboxTerms || editingField.helpText || editingField.label}
                      </span>
                    </div>
                  ) : (
                    <input
                      disabled
                      type={editingField.type}
                      placeholder={editingField.placeholder || 'Texto de exemplo'}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                    />
                  )}

                  {/* Help text */}
                  {editingField.helpText && editingField.type !== 'checkbox' && (
                    <p className="text-[10px] text-[#73796c]">{editingField.helpText}</p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#f0f2eb]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingField(null);
                    setEditingOptionInput('');
                  }}
                  className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold text-[#42493d] hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações do Campo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showNewQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveNewQuestion}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div>
                <h4 className="font-display font-bold text-base text-[#082500]">
                  Nova Questão Objetiva
                </h4>
                <p className="text-[11px] text-[#73796c]">
                  Textos concisos e exatamente três alternativas: A, B e C.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewQuestionModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Eixo / Tópico Teológico:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pneumatologia"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                />
              </div>

              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Enunciado da Questão (Texto Conciso):
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Digite a pergunta de forma clara e objetiva..."
                  value={qQuestion}
                  onChange={(e) => setQQuestion(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-2.5 text-xs text-[#191c19]"
                />
              </div>

              {/* 3 Opções A, B, C */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-[#646029] uppercase tracking-wider text-[11px] block">
                  Alternativas (Exatamente 3 Opções):
                </span>

                <div className="space-y-2">
                  {/* Opção A */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      A
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção A..."
                      value={qOptionA}
                      onChange={(e) => setQOptionA(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctKeyRadio"
                        checked={qCorrect === 'A'}
                        onChange={() => setQCorrect('A')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>

                  {/* Opção B */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      B
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção B..."
                      value={qOptionB}
                      onChange={(e) => setQOptionB(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctKeyRadio"
                        checked={qCorrect === 'B'}
                        onChange={() => setQCorrect('B')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>

                  {/* Opção C */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      C
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção C..."
                      value={qOptionC}
                      onChange={(e) => setQOptionC(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctKeyRadio"
                        checked={qCorrect === 'C'}
                        onChange={() => setQCorrect('C')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => setShowNewQuestionModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Questão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição de Questão Objetiva */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveEditQuestion}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div>
                <h4 className="font-display font-bold text-base text-[#082500]">
                  Editar Questão #{editingQuestion.id}
                </h4>
                <p className="text-[11px] text-[#73796c]">
                  Edite o enunciado, alternativas e gabarito com sincronização imediata na rota /prova.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Eixo / Tópico Teológico:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bibliologia"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-2 text-xs text-[#191c19]"
                />
              </div>

              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Enunciado da Questão:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Digite o enunciado da questão..."
                  value={qQuestion}
                  onChange={(e) => setQQuestion(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-2.5 text-xs text-[#191c19] leading-relaxed"
                />
              </div>

              {/* 3 Opções A, B, C */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-[#646029] uppercase tracking-wider text-[11px] block">
                  Alternativas (Exatamente 3 Opções):
                </span>

                <div className="space-y-2">
                  {/* Opção A */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      A
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção A..."
                      value={qOptionA}
                      onChange={(e) => setQOptionA(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="editCorrectKeyRadio"
                        checked={qCorrect === 'A'}
                        onChange={() => setQCorrect('A')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>

                  {/* Opção B */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      B
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção B..."
                      value={qOptionB}
                      onChange={(e) => setQOptionB(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="editCorrectKeyRadio"
                        checked={qCorrect === 'B'}
                        onChange={() => setQCorrect('B')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>

                  {/* Opção C */}
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#123d00] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      C
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Texto da Opção C..."
                      value={qOptionC}
                      onChange={(e) => setQOptionC(e.target.value)}
                      className="flex-1 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-3 py-1.5 text-xs text-[#191c19]"
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="editCorrectKeyRadio"
                        checked={qCorrect === 'C'}
                        onChange={() => setQCorrect('C')}
                      />
                      <span>Correta</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edição da Redação Discursiva */}
      {showDiscursiveEditModal && editingDiscursivePrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveDiscursivePrompt}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c9b9] space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div>
                <h4 className="font-display font-bold text-base text-[#082500]">
                  Editar Tema da Redação Discursiva
                </h4>
                <p className="text-[11px] text-[#73796c]">
                  Modifique a proposta avaliada pela Coordenação na rota /prova.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDiscursiveEditModal(false);
                  setEditingDiscursivePrompt(null);
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Título do Tema:
                </label>
                <input
                  type="text"
                  disabled
                  value={editingDiscursivePrompt.title}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[#191c19] block mb-1">
                  Enunciado da Proposta Dissertativa:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Digite a pergunta ou orientação da redação..."
                  value={editPromptText}
                  onChange={(e) => setEditPromptText(e.target.value)}
                  className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-2.5 text-xs text-[#191c19] leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => {
                  setShowDiscursiveEditModal(false);
                  setEditingDiscursivePrompt(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Salvar Tema
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Confirmação para Exclusão de Campo do Formulário */}
      {fieldToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3dd] space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#191c19]">
                  Excluir Campo do Formulário?
                </h3>
                <p className="text-xs text-[#52594d] mt-1 leading-relaxed">
                  Você está prestes a remover o campo{' '}
                  <strong className="text-[#191c19]">"{fieldToDelete.label}"</strong> ({fieldToDelete.name}) da ficha de inscrição pública.
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-normal flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Caso precise recuperar os campos originais recomendados pelo Seminário, você poderá clicar no botão de restauração a qualquer momento.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                id="btn-cancel-delete-field"
                onClick={() => setFieldToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-xs font-semibold text-[#52594d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-field"
                onClick={handleConfirmDeleteField}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Campo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Restaurar Campos Canônicos */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3dd] space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#191c19]">
                  Restaurar Campos Canônicos Oficiais?
                </h3>
                <p className="text-xs text-[#52594d] mt-1 leading-relaxed">
                  Esta ação redefinirá a lista de campos do formulário para o padrão oficial canônico da Ficha Cadastral (dados pessoais, eclesiásticos, acadêmicos e comprobatórios).
                </p>
                <p className="text-[11px] text-[#73796c] mt-2 bg-[#f8faf4] p-2.5 rounded-xl border border-[#e1e3dd]">
                  Campos customizados que não pertençam ao padrão canônico serão substituídos pela estrutura padrão.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                id="btn-cancel-reset-fields"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-xs font-semibold text-[#52594d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-reset-fields"
                onClick={handleConfirmResetDefaultFields}
                className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#a2d486]" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Exclusão de Questão de Prova */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3dd] space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#191c19]">
                  Excluir Questão #{questionToDelete.id}?
                </h3>
                <p className="text-xs text-[#52594d] mt-1 leading-relaxed line-clamp-3">
                  "{questionToDelete.prompt}"
                </p>
                <div className="mt-2 text-[11px] text-[#73796c]">
                  Eixo: <strong>{questionToDelete.subject}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2eb]">
              <button
                type="button"
                id="btn-cancel-delete-question"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] hover:bg-[#f4f6f0] text-xs font-semibold text-[#52594d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-question"
                onClick={handleConfirmDeleteQuestion}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Questão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Processo Seletivo */}
      {editingProcesso && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#c2c9b9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#123d00]" />
                <h4 className="font-bold text-sm text-[#082500]">
                  Editar Processo Seletivo
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingProcesso(null)}
                className="p-1 rounded-lg text-[#73796c] hover:bg-[#f4f6f0] cursor-pointer"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedProcesso} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#42493d] mb-1.5">
                  ID do Processo Seletivo
                </label>
                <input
                  type="text"
                  value={editProcessoId}
                  onChange={(e) => setEditProcessoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                  placeholder="Ex: #PS-2026-1"
                  required
                />
                <p className="text-[11px] text-[#73796c] mt-1">
                  Identificador canônico único do processo seletivo.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#f0f2eb]">
                <button
                  type="button"
                  onClick={() => {
                    const cleanId = normalizeProcessoId(editingProcesso.id);
                    const existingConfig = getProcessoConfig(cleanId);
                    if (existingConfig) {
                      setEditingJourneyConfig(existingConfig);
                    } else {
                      const newConfig = createDefaultJourneyConfig(editingProcesso.id);
                      newConfig.nome = editingProcesso.nome;
                      setEditingJourneyConfig(newConfig);
                    }
                    setIsEditingNewJourney(false);
                    setEditingProcesso(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#f4f6f0] hover:bg-[#e7e9e3] text-[#123d00] border border-[#c2c9b9] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Editar apresentação, textos, aulas e módulos desta jornada"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Editar Definições</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProcesso(null)}
                    className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inserir ID para Novo Processo Seletivo */}
      {showNewProcessoIdModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#c2c9b9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2eb]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#123d00] text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#082500]">
                  Criar Novo Processo Seletivo
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewProcessoIdModal(false);
                  setNewProcessoRawId('');
                  setNewProcessoIdError(null);
                }}
                className="p-1.5 text-[#73796c] hover:text-[#191c19] rounded-lg cursor-pointer"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleProceedWithNewProcessoId} className="space-y-4">
              <div>
                <label
                  htmlFor="input-novo-processo-id"
                  className="block text-xs font-bold text-[#191c19] mb-1"
                >
                  ID do Processo Seletivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-novo-processo-id"
                  value={newProcessoRawId}
                  onChange={(e) => {
                    setNewProcessoRawId(e.target.value);
                    if (newProcessoIdError) setNewProcessoIdError(null);
                  }}
                  placeholder="Ex: #PS-2026-2 ou PS-2026-2"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f8faf4] border border-[#c2c9b9] rounded-xl text-xs font-mono font-bold text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00]"
                />
                <p className="text-[11px] text-[#73796c] mt-1.5">
                  O ID é obrigatório e deverá ser único. As rotas da jornada serão vinculadas a ele.
                </p>
                {newProcessoIdError && (
                  <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{newProcessoIdError}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f2eb]">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProcessoIdModal(false);
                    setNewProcessoRawId('');
                    setNewProcessoIdError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirmar-novo-processo-id"
                  className="px-4 py-2 rounded-xl bg-[#123d00] hover:bg-[#082500] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Criar e Abrir Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Processo Seletivo */}
      {processoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#c2c9b9] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#b91c1c]">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#191c19]">
                  Excluir processo seletivo?
                </h4>
                <p className="text-xs text-[#73796c] mt-1 leading-relaxed">
                  Esta ação excluirá definitivamente o processo seletivo <strong className="font-mono text-[#191c19]">{processoToDelete.id}</strong> e todas as inscrições associadas a ele. Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f2eb]">
              <button
                type="button"
                onClick={() => setProcessoToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#c2c9b9] text-xs font-semibold text-[#52594d] hover:bg-[#f4f6f0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-exclusao-definitiva"
                onClick={handleConfirmDeleteProcesso}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div
          id="processo-seletivo-toast"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${
            toastNotification.type === 'success'
              ? 'bg-[#123d00] text-white border-[#2b591b]'
              : toastNotification.type === 'warning'
              ? 'bg-amber-800 text-white border-amber-900'
              : 'bg-[#191c19] text-white border-[#31372d]'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#a2d486] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          )}
          <span>{toastNotification.text}</span>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
