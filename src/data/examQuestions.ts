export type CognitiveLevel = 'compreensao' | 'aplicacao' | 'analise';

export interface ExamOption {
  key: 'A' | 'B' | 'C';
  text: string;
}

export interface ExamQuestionDefinition {
  id: number;
  topic: string;
  cognitiveLevel: CognitiveLevel;
  question: string;
  options: ExamOption[];
  correctKey: 'A' | 'B' | 'C';
  theologicalNote: string;
  active?: boolean;
}

export interface DiscursivePromptDefinition {
  id: string;
  title: string;
  prompt: string;
  minimumChars: number;
  evaluationCriteria: {
    criterion: string;
    weight: number;
  }[];
  active: boolean;
}

// Canonical Question Repository - Exactly 3 Options (A, B, C) with Concise Texts
// Cognitive Distribution: 50% Compreensão, 30% Aplicação, 20% Interpretação/Análise
export const EXAM_QUESTIONS: ExamQuestionDefinition[] = [
  // --- 50% COMPREENSÃO (Conceituação direta e doutrinas confessionais fundamentais) ---
  {
    id: 1,
    topic: 'Bibliologia',
    cognitiveLevel: 'compreensao',
    question: 'Qual é a definição correta da inspiração verbal e plenária da Bíblia Sagrada?',
    options: [
      {
        key: 'A',
        text: 'Deus inspirou apenas conceitos gerais, cabendo aos autores humanos formular as palavras com possíveis falhas.',
      },
      {
        key: 'B',
        text: 'Toda a Escritura é divinamente inspirada (plenária) e cada vocábulo original foi guiado pelo Espírito Santo (verbal).',
      },
      {
        key: 'C',
        text: 'A inspiração plena aplica-se somente ao Novo Testamento, sendo o Antigo Testamento de valor meramente histórico.',
      },
    ],
    correctKey: 'B',
    theologicalNote:
      'A doutrina da inspiração verbal e plenária (2 Tm 3:16; 2 Pe 1:21) afirma que todas as partes e palavras originais foram orientadas pelo Espírito Santo, assegurando sua autoridade e inerrância.',
    active: true,
  },
  {
    id: 2,
    topic: 'Teologia Sistemática',
    cognitiveLevel: 'compreensao',
    question: 'Como são definidos os atributos comunicáveis de Deus na ortodoxia cristã?',
    options: [
      {
        key: 'A',
        text: 'Perfeições divinas exclusivas do Criador, tais como onisciência, onipotência e autoexistência.',
      },
      {
        key: 'B',
        text: 'Atributos morais como santidade, amor e justiça que Deus compartilha analogicamente com o ser humano.',
      },
      {
        key: 'C',
        text: 'Poderes sobrenaturais manifestados temporariamente apenas durante períodos de teofanias veterotestamentárias.',
      },
    ],
    correctKey: 'B',
    theologicalNote:
      'Atributos comunicáveis são qualidades morais que encontram reflexo nos homens criados à imagem e semelhança de Deus (Lv 11:44; 1 Jo 4:8).',
    active: true,
  },
  {
    id: 3,
    topic: 'Cristologia',
    cognitiveLevel: 'compreensao',
    question: 'Segundo o Concílio de Calcedônia (451 d.C.), como subsistem as naturezas de Cristo?',
    options: [
      {
        key: 'A',
        text: 'A divindade de Jesus absorveu sua carne humana, gerando uma única natureza híbrida.',
      },
      {
        key: 'B',
        text: 'Jesus tinha corpo humano comum, mas sua mente consciente era unicamente a do Logos celestial.',
      },
      {
        key: 'C',
        text: 'Verdadeiramente Deus e verdadeiramente homem, em duas naturezas perfeitas, sem confusão, mudança, divisão ou separação.',
      },
    ],
    correctKey: 'C',
    theologicalNote:
      'A união hipostática calcedoniana ensina que Cristo é pleno Deus e pleno homem reunidos em uma só Pessoa divina inseparável.',
    active: true,
  },
  {
    id: 4,
    topic: 'Pneumatologia',
    cognitiveLevel: 'compreensao',
    question: 'Na teologia pentecostal clássica, qual é a evidência física inicial do batismo no Espírito Santo?',
    options: [
      {
        key: 'A',
        text: 'O falar em outras línguas (glossolalia) conforme o Espírito Santo capacita o crente.',
      },
      {
        key: 'B',
        text: 'O sentimento instantâneo de serenidade interior e prosperidade financeira imediata.',
      },
      {
        key: 'C',
        text: 'A formalização do membro mediante ordenação eclesiástica expedida pela convenção.',
      },
    ],
    correctKey: 'A',
    theologicalNote:
      'Conforme a tradição pentecostal (At 2:4; 10:46; 19:6), a glossolalia é o sinal externo primário que atesta o revestimento de poder espiritual.',
    active: true,
  },
  {
    id: 5,
    topic: 'Antropologia Bíblica',
    cognitiveLevel: 'compreensao',
    question: 'Qual é a estrutura tricotômica do ser humano segundo 1 Tessalonicenses 5:23?',
    options: [
      {
        key: 'A',
        text: 'Mente, razão consciente e emoção subconsciente.',
      },
      {
        key: 'B',
        text: 'Espírito, alma e corpo físico integrados sob a graça de Deus.',
      },
      {
        key: 'C',
        text: 'Carne terrena, intelecto moral e consciência cívica.',
      },
    ],
    correctKey: 'B',
    theologicalNote:
      'A tricotomia bíblica bíblica distingue o espírito (comunhão com Deus), a alma (sede psicológica e afetiva) e o corpo (invólucro somático terreno).',
    active: true,
  },

  // --- 30% APLICAÇÃO (Cenários práticos pastorais e aplicação da sã doutrina) ---
  {
    id: 6,
    topic: 'Soteriologia Aplicada',
    cognitiveLevel: 'aplicacao',
    question: 'Diante de um cristão em crise de condenação, como a doutrina forense da Justificação deve ser aplicada?',
    options: [
      {
        key: 'A',
        text: 'Exigir penitências e obras meritórias contínuas para restaurar o estado judicial de graça diante de Deus.',
      },
      {
        key: 'B',
        text: 'Reafirmar que, pela fé em Cristo, ele foi legalmente absolvido e declarado justo, tendo paz com Deus (Rm 5:1).',
      },
      {
        key: 'C',
        text: 'Ensinar que a justificação final depende de aprovação prévia em concílio pastoral local.',
      },
    ],
    correctKey: 'B',
    theologicalNote:
      'A Justificação é uma declaração judicial imediata e imutável de Deus baseada na justiça imputada de Cristo, conferindo plena segurança ao crente arrependido.',
    active: true,
  },
  {
    id: 7,
    topic: 'Eclesiologia Prática',
    cognitiveLevel: 'aplicacao',
    question: 'Ao estruturar um projeto editorial na igreja local, quem deve permanecer como fundamento primordial da obra?',
    options: [
      {
        key: 'A',
        text: 'As preferências de marketing secular e tendências passageiras de redes sociais.',
      },
      {
        key: 'B',
        text: 'A autoridade central de Jesus Cristo como a principal pedra de esquina da Igreja (Ef 2:20).',
      },
      {
        key: 'C',
        text: 'A exaltação personalista dos escritores envolvidos na redação dos textos.',
      },
    ],
    correctKey: 'B',
    theologicalNote:
      'Ninguém pode pôr outro fundamento além do que já foi posto, o qual é Jesus Cristo (1 Co 3:11). Toda produção literária visa a glória de Deus e a edificação do rebanho.',
    active: true,
  },
  {
    id: 8,
    topic: 'Hermenêutica Aplicada',
    cognitiveLevel: 'aplicacao',
    question: 'Como um expositor bíblico deve agir ao se deparar com uma suposta "nova revelação" contrária ao texto bíblico?',
    options: [
      {
        key: 'A',
        text: 'Submeter toda revelação ou experiência subjetiva ao crivo soberano da Escritura Sagrada.',
      },
      {
        key: 'B',
        text: 'Adotar a nova revelação caso a pessoa que a proferiu detenha cargo ministerial de destaque.',
      },
      {
        key: 'C',
        text: 'Desconsiderar o contexto histórico-gramatical em favor da inspiração mística momentânea.',
      },
    ],
    correctKey: 'A',
    theologicalNote:
      'A hermenêutica pentecostal ortodoxa mantém o princípio do Sola Scriptura: nenhuma profecia ou visão contemporânea possui autoridade acima da Palavra canônica.',
    active: true,
  },

  // --- 20% INTERPRETAÇÃO & ANÁLISE (Exegese comparativa, escatologia e discernimento teológico) ---
  {
    id: 9,
    topic: 'Escatologia',
    cognitiveLevel: 'analise',
    question: 'Analise a cronologia bíblica: qual distinção sustenta o Pré-tribulacionismo adotado pela Convenção?',
    options: [
      {
        key: 'A',
        text: 'O Arrebatamento da Igreja ocorre nos ares antes da Grande Tribulação, distinguindo-se da Segunda Vinda visível em glória.',
      },
      {
        key: 'B',
        text: 'A Igreja passará obrigatoriamente por todos os juízos apocalípticos do Anticristo para alcançar purificação salvífica.',
      },
      {
        key: 'C',
        text: 'O arrebatamento é estritamente espiritual e alegórico, sem cumprimento literal na história da humanidade.',
      },
    ],
    correctKey: 'A',
    theologicalNote:
      'A COMIEADEPA professa o pré-tribulacionismo (1 Ts 1:10; 4:16-17; Ap 3:10): Jesus arrebata Sua noiva antes da ira vindoura, regressando com ela após a 70ª semana de Daniel.',
    active: true,
  },
  {
    id: 10,
    topic: 'Apologética Teológica',
    cognitiveLevel: 'analise',
    question: 'Ao analisar heresias contemporâneas, qual perigo o autor cristão deve discernir no sincretismo pós-moderno?',
    options: [
      {
        key: 'A',
        text: 'O risco de diluir a exclusividade salvífica de Cristo e relativizar a autoridade inerrante das Escrituras.',
      },
      {
        key: 'B',
        text: 'A exigência de utilizar citações bíblicas estritamente em língua hebraica e grega nos sermões.',
      },
      {
        key: 'C',
        text: 'A necessidade de publicar livros impressos em vez de materiais disponibilizados em plataformas digitais.',
      },
    ],
    correctKey: 'A',
    theologicalNote:
      'O vocacionado literário precisa combater o relativismo teológico, reafirmando o Evangelho eterno com rigor doutrinário e relevância comunicacional.',
    active: true,
  },
];

export const DISCURSIVE_PROMPT =
  'O que significa, para você, ser um cristão cheio do Espírito Santo?';

export const DISCURSIVE_PROMPTS_REPOSITORY: DiscursivePromptDefinition[] = [
  {
    id: 'disc-2026-1',
    title: 'Tema Vigente • Edital 2026/1',
    prompt: 'O que significa, para você, ser um cristão cheio do Espírito Santo?',
    minimumChars: 50,
    evaluationCriteria: [
      { criterion: 'Ortodoxia Pneumatológica e Fidelidade Bíblica', weight: 40 },
      { criterion: 'Clareza Vernácula, Coerência e Vocação Literária', weight: 30 },
      { criterion: 'Profundidade Reflexiva e Aplicação Prática', weight: 30 },
    ],
    active: true,
  },
  {
    id: 'disc-2026-2',
    title: 'Banco Suplente • Ministério e Hermenêutica',
    prompt: 'Como a vocação literária contribui para a preservação da sã doutrina e expansão do Reino no contexto paraense?',
    minimumChars: 50,
    evaluationCriteria: [
      { criterion: 'Visão Missionária e Contextualização Regional', weight: 40 },
      { criterion: 'Solidez Teológica e Argumentação Eclesiástica', weight: 35 },
      { criterion: 'Domínio da Norma Culta da Língua Portuguesa', weight: 25 },
    ],
    active: false,
  },
];

const LOCAL_STORAGE_QUESTIONS_KEY = 'escritores_qgu_exam_questions';
const LOCAL_STORAGE_DISCURSIVE_KEY = 'escritores_qgu_exam_discursive';

export function getStoredExamQuestions(): ExamQuestionDefinition[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored exam questions:', err);
  }
  return EXAM_QUESTIONS;
}

export function saveStoredExamQuestions(questions: ExamQuestionDefinition[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (err) {
    console.error('Error saving exam questions:', err);
  }
}

export function getStoredDiscursivePrompts(): DiscursivePromptDefinition[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DISCURSIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored discursive prompts:', err);
  }
  return DISCURSIVE_PROMPTS_REPOSITORY;
}

export function saveStoredDiscursivePrompts(prompts: DiscursivePromptDefinition[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DISCURSIVE_KEY, JSON.stringify(prompts));
  } catch (err) {
    console.error('Error saving discursive prompts:', err);
  }
}
