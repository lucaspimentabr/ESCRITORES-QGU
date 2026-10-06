import { FormFieldConfig } from '../types';

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  {
    id: 'field-1',
    name: 'fullName',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    active: true,
    placeholder: 'Ex: Lucas Alencar de Oliveira',
    helpText: 'Informe seu nome completo conforme documento oficial de identidade.',
    category: 'pessoal',
    order: 1,
  },
  {
    id: 'field-2',
    name: 'birthDate',
    label: 'Data de Nascimento',
    type: 'date',
    required: true,
    active: true,
    helpText: 'Data de nascimento do candidato.',
    category: 'pessoal',
    order: 2,
  },
  {
    id: 'field-3',
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    active: true,
    placeholder: 'Ex: lucas.oliveira@comieadepa.org',
    helpText: 'Email de contato para notificações e homologação.',
    category: 'pessoal',
    order: 3,
  },
  {
    id: 'field-4',
    name: 'phone',
    label: 'WhatsApp',
    type: 'tel',
    required: true,
    active: true,
    placeholder: 'Ex: (91) 98257-7589',
    helpText: 'Número com DDD habilitado para WhatsApp.',
    category: 'pessoal',
    order: 4,
  },
  {
    id: 'field-5',
    name: 'polo',
    label: 'Campo',
    type: 'text',
    required: true,
    active: true,
    placeholder: 'Ex: Campo Belém Central / Templo Central',
    helpText: 'Campo eclesiástico ou congregação sede da COMIEADEPA.',
    category: 'eclesiastico',
    order: 5,
  },
  {
    id: 'field-6',
    name: 'pastor',
    label: 'Nome do Pastor Presidente',
    type: 'text',
    required: true,
    active: true,
    placeholder: 'Ex: Pr. Océlio Nauar de Araújo',
    helpText: 'Nome do pastor presidente responsável pela supervisão.',
    category: 'eclesiastico',
    order: 6,
  },
  {
    id: 'field-7',
    name: 'meetsRequirements',
    label: 'Confirmação de Requisitos',
    type: 'checkbox',
    required: true,
    active: true,
    helpText: 'Você confirma que é membro da COMIEADEPA em perfeita comunhão, possui Ensino Médio completo e tem o curso básico em teologia completo (ou está cursando a EMIL)?',
    category: 'documentacao',
    order: 7,
  },
  {
    id: 'field-8',
    name: 'motivation',
    label: 'Escreva um pouco',
    type: 'textarea',
    required: true,
    active: true,
    placeholder: 'Ex: Desde o início do meu discipulado nas fileiras da COMIEADEPA, compreendi que a pena do escritor sagrado tem o poder de cristalizar a sã doutrina para as futuras gerações...',
    helpText: 'Explique a sua motivação para participar do projeto de escritores QGU e a sua convicção para atuar na área da escrita cristã.',
    category: 'documentacao',
    order: 8,
  },
];

const LOCAL_STORAGE_FORM_FIELDS_KEY = 'escritores_qgu_form_fields';

export function getStoredFormFields(): FormFieldConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FORM_FIELDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        // If legacy stored data contains obsolete fields like 'church' or old labels, migrate to official defaults
        const hasLegacyChurch = parsed.some((p: any) => p.name === 'church');
        const hasOldLabels = parsed.some((p: any) => p.label === 'E-mail Principal' || p.label === 'Polo Regional / Jurisdição');
        if (hasLegacyChurch || hasOldLabels) {
          saveStoredFormFields(DEFAULT_FORM_FIELDS);
          return DEFAULT_FORM_FIELDS;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored form fields:', err);
  }
  return DEFAULT_FORM_FIELDS;
}

export function saveStoredFormFields(fields: FormFieldConfig[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FORM_FIELDS_KEY, JSON.stringify(fields));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('formFieldsUpdated'));
    }
  } catch (err) {
    console.error('Error saving form fields:', err);
  }
}
