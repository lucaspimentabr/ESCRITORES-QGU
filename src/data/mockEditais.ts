import { EditalItem, ProcessoSeletivoEtapa } from '../types';

export const DEFAULT_ETAPAS_2026: ProcessoSeletivoEtapa[] = [
  {
    id: 'etapa-2026-1',
    nome: 'Inscrições Abertas & Submissão do Memorial',
    descricao: 'Período oficial de submissão do formulário, memorial descritivo e carta pastoral.',
    dataInicio: '01/01/2026',
    dataFim: '15/02/2026',
    status: 'Concluída',
    ordem: 1,
    responsavel: 'Coordenação Geral',
  },
  {
    id: 'etapa-2026-2',
    nome: 'Análise Documental & Homologação Preliminar',
    descricao: 'Verificação da carta de recomendação e conformidade eclesiástica dos vocacionados.',
    dataInicio: '16/02/2026',
    dataFim: '28/02/2026',
    status: 'Em Andamento',
    ordem: 2,
    responsavel: 'Banca Examinadora',
  },
  {
    id: 'etapa-2026-3',
    nome: 'Prova Teológica Objetiva',
    descricao: 'Aplicação da prova teológica de 10 questões com foco bíblico e doutrinário.',
    dataInicio: '01/03/2026',
    dataFim: '10/03/2026',
    status: 'Pendente',
    ordem: 3,
    responsavel: 'Banca Avaliadora',
  },
  {
    id: 'etapa-2026-4',
    nome: 'Avaliação da Redação Dissertativa',
    descricao: 'Correção cega dos textos dissertativos e parecer crítico dos docentes avaliadores.',
    dataInicio: '11/03/2026',
    dataFim: '20/03/2026',
    status: 'Pendente',
    ordem: 4,
    responsavel: 'Docentes da Banca',
  },
  {
    id: 'etapa-2026-5',
    nome: 'Homologação Final & Publicação dos Aprovados',
    descricao: 'Publicação oficial da lista de aprovados no diário da convenção e início das matrículas.',
    dataInicio: '21/03/2026',
    dataFim: '31/03/2026',
    status: 'Pendente',
    ordem: 5,
    responsavel: 'Coordenação Geral',
  },
];

export const DEFAULT_ETAPAS_2025: ProcessoSeletivoEtapa[] = [
  {
    id: 'etapa-2025-1',
    nome: 'Inscrições & Submissão do Memorial',
    descricao: 'Inscrições da 1ª Turma de Escritores Pentecostais.',
    dataInicio: '10/02/2025',
    dataFim: '15/03/2025',
    status: 'Concluída',
    ordem: 1,
    responsavel: 'Coordenação Geral',
  },
  {
    id: 'etapa-2025-2',
    nome: 'Análise de Cartas de Recomendação',
    descricao: 'Homologação eclesiástica dos membros da COMIEADEPA.',
    dataInicio: '16/03/2025',
    dataFim: '30/03/2025',
    status: 'Concluída',
    ordem: 2,
    responsavel: 'Banca Examinadora',
  },
  {
    id: 'etapa-2025-3',
    nome: 'Prova de Conhecimentos Bíblicos',
    descricao: 'Aplicação da prova teológica piloto.',
    dataInicio: '01/04/2025',
    dataFim: '15/04/2025',
    status: 'Concluída',
    ordem: 3,
    responsavel: 'Banca Avaliadora',
  },
  {
    id: 'etapa-2025-4',
    nome: 'Homologação e Matrículas da 1ª Turma',
    descricao: 'Resultado final e matrícula dos 35 vocacionados aprovados.',
    dataInicio: '16/04/2025',
    dataFim: '28/04/2025',
    status: 'Concluída',
    ordem: 4,
    responsavel: 'Secretaria Acadêmica',
  },
];

export const DEFAULT_EDITAIS: EditalItem[] = [
  {
    id: 'edital-2026-1',
    code: '01/2026',
    title: 'Edital Canônico Nº 01/2026 • Formação de Escritores QGU',
    description: 'Processo seletivo público estadual para a 2ª Turma Regular de Formação Teológica e Redação Editorial.',
    turmaId: 'turma-2026',
    registrationUrl: 'https://escritoresqgu.comieadepa.org/turma2026',
    startDate: '15/01/2026',
    endDate: '31/03/2026',
    status: 'Aberto',
    vagas: 40,
    pdfUrl: '#edital-pdf',
    etapas: DEFAULT_ETAPAS_2026,
  },
  {
    id: 'edital-2025-1',
    code: '01/2025',
    title: 'Edital Pioneiro Nº 01/2025 • Formação de Escritores QGU',
    description: 'Processo seletivo inaugural para a 1ª Turma de Escritores Pentecostais da COMIEADEPA.',
    turmaId: 'turma-2025',
    registrationUrl: 'https://escritoresqgu.comieadepa.org/turma2025',
    startDate: '10/02/2025',
    endDate: '28/04/2025',
    status: 'Encerrado',
    vagas: 35,
    pdfUrl: '#edital-pdf-2025',
    etapas: DEFAULT_ETAPAS_2025,
  },
];

const LOCAL_STORAGE_EDITAIS_KEY = 'escritores_qgu_editais_list';

export function getStoredEditais(): EditalItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EDITAIS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every edital has etapas
        return parsed.map((ed: EditalItem) => {
          if (!ed.etapas || ed.etapas.length === 0) {
            return {
              ...ed,
              etapas: ed.id === 'edital-2025-1' ? DEFAULT_ETAPAS_2025 : DEFAULT_ETAPAS_2026,
            };
          }
          return ed;
        });
      }
    }
  } catch (err) {
    console.error('Error loading stored editais:', err);
  }
  return DEFAULT_EDITAIS;
}

export function saveStoredEditais(editais: EditalItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_EDITAIS_KEY, JSON.stringify(editais));
  } catch (err) {
    console.error('Error saving editais:', err);
  }
}
