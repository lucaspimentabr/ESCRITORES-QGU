import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus } from '../types';
import { X, User, Mail, Phone, Church, Award, FileText, Check, Sparkles } from 'lucide-react';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  candidateToEdit?: Candidate | null;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  candidateToEdit,
}) => {
  const isEditing = Boolean(candidateToEdit);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [polo, setPolo] = useState('Belém Central');
  const [church, setChurch] = useState('');
  const [pastor, setPastor] = useState('');
  const [communionStatus, setCommunionStatus] = useState('Membro em plena comunhão e graduado em Teologia Básica.');
  const [status, setStatus] = useState<CandidateStatus>('EM_ANALISE');
  const [objectiveCorrect, setObjectiveCorrect] = useState<number>(8);
  const [memorial, setMemorial] = useState('');
  const [evaluatorScore, setEvaluatorScore] = useState<number>(8.5);
  const [theologicalNotes, setTheologicalNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (candidateToEdit) {
      setFullName(candidateToEdit.fullName || '');
      setEmail(candidateToEdit.email || '');
      setPhone(candidateToEdit.phone || '');
      setBirthDate(candidateToEdit.birthDate || '');
      setPolo(candidateToEdit.polo || 'Belém Central');
      setChurch(candidateToEdit.church || '');
      setPastor(candidateToEdit.pastor || '');
      setCommunionStatus(candidateToEdit.communionStatus || 'Membro em plena comunhão.');
      setStatus(candidateToEdit.status || 'EM_ANALISE');
      setObjectiveCorrect(candidateToEdit.objectiveScore?.correct ?? 8);
      setMemorial(candidateToEdit.memorial || '');
      setEvaluatorScore(candidateToEdit.discursive?.evaluatorScore ?? 8.5);
      setTheologicalNotes(candidateToEdit.discursive?.theologicalNotes || '');
      setErrors({});
    } else {
      // Reset for New Candidate
      setFullName('');
      setEmail('');
      setPhone('');
      setBirthDate('1998-05-15');
      setPolo('Belém Central');
      setChurch('');
      setPastor('');
      setCommunionStatus('Membro em plena comunhão e graduado em Teologia Básica.');
      setStatus('EM_ANALISE');
      setObjectiveCorrect(8);
      setMemorial('Desejo consagrar minha escrita literária para a edificação do corpo de Cristo na convenção COMIEADEPA.');
      setEvaluatorScore(8.5);
      setTheologicalNotes('Apresenta coerência bíblica alinhada aos preceitos da COMIEADEPA.');
      setErrors({});
    }
  }, [candidateToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nome completo é obrigatório';
    if (!email.trim()) newErrors.email = 'E-mail é obrigatório';
    if (!phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!church.trim()) newErrors.church = 'Igreja local é obrigatória';
    if (!pastor.trim()) newErrors.pastor = 'Pastor titular é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Initials
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    // Age calculation
    let age = 26;
    if (birthDate) {
      const birthYear = new Date(birthDate).getFullYear();
      if (!isNaN(birthYear)) {
        age = new Date().getFullYear() - birthYear;
      }
    }

    const totalQuestions = 9;
    const percentage = parseFloat(((objectiveCorrect / totalQuestions) * 100).toFixed(1));

    const statusLabel =
      status === 'APROVADO'
        ? 'APROVADO PELA COMISSÃO'
        : status === 'REPROVADO'
        ? 'REPROVADO (PARECER FINAL)'
        : 'STATUS: EM ANÁLISE (AGUARDANDO PARECER)';

    const colors = ['#123d00', '#2563eb', '#7c3aed', '#d97706', '#059669', '#b91c1c'];
    const avatarColor = candidateToEdit?.avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const id = candidateToEdit?.id || `#QGU-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const candidatePayload: Candidate = {
      id,
      fullName,
      initials: initials || 'EX',
      avatarColor,
      birthDate: birthDate
        ? (birthDate.includes('-') ? new Date(birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : birthDate)
        : 'Não informada',
      age: age > 0 ? age : 0,
      email,
      phone,
      polo,
      church,
      jurisdiction: `COMIEADEPA – ${polo}`,
      pastor,
      communionStatus,
      registrationDate:
        candidateToEdit?.registrationDate ||
        new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) + ` às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      objectiveScore: {
        correct: objectiveCorrect,
        total: totalQuestions,
        percentage,
      },
      status,
      statusLabel,
      memorial,
      characterCount: memorial.length,
      parecerId: candidateToEdit?.parecerId || `#${Math.floor(100 + Math.random() * 900)}`,
      objectiveQuestions: candidateToEdit?.objectiveQuestions || [
        { id: 1, topic: 'Bibliologia', isCorrect: true, candidateAnswer: 'Opção B • Inspiração verbal e plenária das Escrituras' },
        { id: 2, topic: 'Teologia Própria', isCorrect: true, candidateAnswer: 'Opção B • Atributos comunicáveis e incomunicáveis' },
        { id: 3, topic: 'Cristologia', isCorrect: true, candidateAnswer: 'Opção C • União hipostática conforme a Definição de Calcedônia' },
        { id: 4, topic: 'Pneumatologia', isCorrect: true, candidateAnswer: 'Opção B • Batismo com o Espírito Santo (Glossolalia)' },
        { id: 5, topic: 'Antropologia Bíblica', isCorrect: true, candidateAnswer: 'Opção B • Imago Dei e constituição bíblica' },
        { id: 6, topic: 'Soteriologia', isCorrect: true, candidateAnswer: 'Opção C • Justificação pela graça mediante a fé' },
        { id: 7, topic: 'Eclesiologia', isCorrect: true, candidateAnswer: 'Opção A • Missão sacerdotal e comunhão da Igreja' },
        { id: 8, topic: 'Escatologia', isCorrect: objectiveCorrect >= 8, candidateAnswer: 'Opção B • Pré-tribulacionismo e retorno glorioso' },
        { id: 9, topic: 'Hermenêutica Sagrada', isCorrect: objectiveCorrect >= 9, candidateAnswer: 'Opção B • Exegese contextual' },
      ],
      discursive: {
        prompt: candidateToEdit?.discursive?.prompt || '“O que significa, para você, ser um escritor cristão comprometido com a fidelidade bíblica?”',
        candidateAnswer: candidateToEdit?.discursive?.candidateAnswer || memorial || 'Compromisso irrestrito com as Escrituras e edificação da igreja.',
        evaluatorScore,
        maxScore: 10,
        preliminaryVerdict:
          status === 'APROVADO'
            ? 'Aprovado pelo plenário da comissão avaliadora.'
            : status === 'REPROVADO'
            ? 'Requer amadurecimento e aprofundamento teológico.'
            : 'Em análise pelo colegiado.',
        theologicalNotes: theologicalNotes || 'Em conformidade com a declaração de fé da COMIEADEPA.',
      },
    };

    onSave(candidatePayload);
    onClose();
  };

  return (
    <div
      id="candidate-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="candidate-form-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-[#c2c9b9]/60 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#123d00] text-white px-6 py-5 flex items-center justify-between border-b border-[#082500]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#b9b474]">
              {isEditing ? <FileText className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                {isEditing ? 'Editar Ficha de Inscrição do Candidato' : 'Cadastrar Novo Candidato'}
              </h2>
              <p className="text-xs text-[#a2d486] font-medium">
                {isEditing ? `Alterando dados do protocolo ${candidateToEdit?.id}` : 'Inclusão manual no Painel da Comissão • 2026'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-candidate-form"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Section 1: Personal & Contact */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#123d00] uppercase tracking-wider border-b border-[#e7e9e3] pb-2 mb-4">
              <User className="w-4 h-4" />
              <span>1. Dados Pessoais & Contato</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Nome Completo <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Pr. João Silva de Oliveira"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00] ${
                    errors.fullName ? 'border-[#b91c1c] bg-[#fef2f2]' : 'border-[#c2c9b9] bg-white'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  E-mail <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidato@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00] ${
                    errors.email ? 'border-[#b91c1c] bg-[#fef2f2]' : 'border-[#c2c9b9] bg-white'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Telefone / WhatsApp <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(91) 98765-4321"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00] ${
                    errors.phone ? 'border-[#b91c1c] bg-[#fef2f2]' : 'border-[#c2c9b9] bg-white'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Polo / Região COMIEADEPA
                </label>
                <select
                  value={polo}
                  onChange={(e) => setPolo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                >
                  <option value="Belém Central">Polo Belém Central</option>
                  <option value="Ananindeua / Marituba">Polo Ananindeua / Marituba</option>
                  <option value="Castanhal / Região do Salgado">Polo Castanhal / Salgado</option>
                  <option value="Santarém / Baixo Amazonas">Polo Santarém / Baixo Amazonas</option>
                  <option value="Marabá / Carajás">Polo Marabá / Carajás</option>
                  <option value="Altamira / Xingu">Polo Altamira / Xingu</option>
                  <option value="Paragominas / Rio Capim">Polo Paragominas / Rio Capim</option>
                  <option value="Abaetetuba / Baixo Tocantins">Polo Abaetetuba / Baixo Tocantins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Church & Pastoral */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#123d00] uppercase tracking-wider border-b border-[#e7e9e3] pb-2 mb-4">
              <Church className="w-4 h-4" />
              <span>2. Vínculo Ministerial & Eclesiástico</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Congregação / Igreja Local <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="text"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                  placeholder="Ex: Assembleia de Deus - São Brás"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00] ${
                    errors.church ? 'border-[#b91c1c] bg-[#fef2f2]' : 'border-[#c2c9b9] bg-white'
                  }`}
                />
                {errors.church && <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.church}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Pastor Titular / Presidente <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="text"
                  value={pastor}
                  onChange={(e) => setPastor(e.target.value)}
                  placeholder="Ex: Pr. Gilberto Marques de Souza"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00] ${
                    errors.pastor ? 'border-[#b91c1c] bg-[#fef2f2]' : 'border-[#c2c9b9] bg-white'
                  }`}
                />
                {errors.pastor && <p className="text-[11px] text-[#b91c1c] mt-1 font-semibold">{errors.pastor}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Condição Canônica / Vínculo
                </label>
                <input
                  type="text"
                  value={communionStatus}
                  onChange={(e) => setCommunionStatus(e.target.value)}
                  placeholder="Ex: Membro em plena comunhão e graduado em Teologia Básica."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Exam, Status & Verdict */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#123d00] uppercase tracking-wider border-b border-[#e7e9e3] pb-2 mb-4">
              <Award className="w-4 h-4" />
              <span>3. Desempenho Teológico & Status Canônico</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Status no Processo Seletivo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                >
                  <option value="EM_ANALISE">EM ANÁLISE</option>
                  <option value="APROVADO">APROVADO</option>
                  <option value="REPROVADO">REPROVADO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Prova Objetiva (Acertos / 9)
                </label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={objectiveCorrect}
                  onChange={(e) => setObjectiveCorrect(Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
                <span className="text-[11px] text-[#73796c] mt-1 block">
                  Aproveitamento: {((objectiveCorrect / 9) * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Nota Dissertativa (0 a 10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={evaluatorScore}
                  onChange={(e) => setEvaluatorScore(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Memorial Vocacional / Motivação do Escritor
                </label>
                <textarea
                  rows={3}
                  value={memorial}
                  onChange={(e) => setMemorial(e.target.value)}
                  placeholder="Descreva a motivação ministerial e os dons literários..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-[#191c19] mb-1">
                  Anotações Teológicas da Banca Avaliadora
                </label>
                <textarea
                  rows={2}
                  value={theologicalNotes}
                  onChange={(e) => setTheologicalNotes(e.target.value)}
                  placeholder="Parecer técnico da comissão de avaliação..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c2c9b9] bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#123d00]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#e7e9e3] flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancel-candidate-form"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#42493d] hover:bg-[#f2f4ee] border border-[#c2c9b9] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-candidate-form"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#123d00] hover:bg-[#082500] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Candidato'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
