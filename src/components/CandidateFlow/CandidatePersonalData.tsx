import React, { useState, useEffect } from 'react';
import { CandidateFormData, FormFieldConfig } from '../../types';
import { RequirementsModal } from './RequirementsModal';
import { getStoredFormFields } from '../../data/mockFormFields';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Quote,
  FileText,
} from 'lucide-react';

interface CandidatePersonalDataProps {
  formData: CandidateFormData;
  onUpdateFormData: (updates: Partial<CandidateFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CandidatePersonalData: React.FC<CandidatePersonalDataProps> = ({
  formData,
  onUpdateFormData,
  onNext,
  onBack,
}) => {
  const [formFields, setFormFields] = useState<FormFieldConfig[]>(() => getStoredFormFields());
  const [showReqModal, setShowReqModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronização em tempo real caso o administrador edite os campos no painel de controle
  useEffect(() => {
    const handleSync = () => {
      setFormFields(getStoredFormFields());
    };
    window.addEventListener('formFieldsUpdated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('formFieldsUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (fullNameField?.active && fullNameField?.required) {
      if (!formData.fullName?.trim()) {
        newErrors.fullName = `Informe seu ${fullNameField.label.toLowerCase()}`;
      }
    }

    if (birthDateField?.active && birthDateField?.required) {
      if (!formData.birthDate) {
        newErrors.birthDate = 'Informe a sua data de nascimento';
      }
    }

    if (emailField?.active && emailField?.required) {
      if (!formData.email?.trim() || !formData.email.includes('@')) {
        newErrors.email = 'Informe um e-mail válido';
      }
    }

    if (phoneField?.active && phoneField?.required) {
      if (!formData.phone?.trim()) {
        newErrors.phone = 'Informe seu número de WhatsApp';
      }
    }

    if (poloField?.active && poloField?.required) {
      if (!formData.polo?.trim()) {
        newErrors.polo = `Informe o seu ${poloField.label.toLowerCase()}`;
      }
    }

    if (pastorField?.active && pastorField?.required) {
      if (!formData.pastor?.trim()) {
        newErrors.pastor = `Informe o ${pastorField.label.toLowerCase()}`;
      }
    }

    if (reqField?.active && reqField?.required) {
      if (formData.meetsRequirements !== true) {
        newErrors.meetsRequirements =
          'A confirmação dos pré-requisitos canônicos é obrigatória';
      }
    }

    if (motivationField?.active && motivationField?.required) {
      if (!formData.motivation?.trim() || formData.motivation.length < 50) {
        newErrors.motivation =
          'Descreva sua motivação com no mínimo 50 caracteres para avaliação';
      }
    }

    // Validação de campos dinâmicos customizados adicionados pelo administrador
    for (const cf of customFields) {
      if (cf.required) {
        const val = formData[cf.name];
        if (!val || (typeof val === 'string' && !val.trim())) {
          newErrors[cf.name] = `Preencha o campo ${cf.label}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = () => {
    if (validate()) {
      onNext();
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleRadioChange = (value: boolean) => {
    onUpdateFormData({ meetsRequirements: value });
    if (!value) {
      setShowReqModal(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-16">
      {/* Step Header */}
      <div className="bg-white border border-[#c2c9b9]/60 rounded-3xl p-5 sm:px-8 sm:pb-8 sm:pt-6 shadow-xs space-y-6">
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
                    id="input-full-name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => onUpdateFormData({ fullName: e.target.value })}
                    placeholder={fullNameField.placeholder || 'Ex: Lucas Alencar de Oliveira'}
                    className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                      errors.fullName ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                    }`}
                  />
                  {fullNameField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{fullNameField.helpText}</p>
                  )}
                  {errors.fullName && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.fullName}</p>
                  )}
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
                    id="input-birth-date"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => onUpdateFormData({ birthDate: e.target.value })}
                    className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                      errors.birthDate ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                    }`}
                  />
                  {birthDateField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{birthDateField.helpText}</p>
                  )}
                  {errors.birthDate && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.birthDate}</p>
                  )}
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
                    id="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => onUpdateFormData({ email: e.target.value })}
                    placeholder={emailField.placeholder || 'Ex: lucas.oliveira@comieadepa.org'}
                    className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                      errors.email ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                    }`}
                  />
                  {emailField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{emailField.helpText}</p>
                  )}
                  {errors.email && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.email}</p>
                  )}
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
                    id="input-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => onUpdateFormData({ phone: e.target.value })}
                    placeholder={phoneField.placeholder || 'Ex: (91) 98257-7589'}
                    className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                      errors.phone ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                    }`}
                  />
                  {phoneField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{phoneField.helpText}</p>
                  )}
                  {errors.phone && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.phone}</p>
                  )}
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
                      id="input-polo"
                      value={formData.polo}
                      onChange={(e) => onUpdateFormData({ polo: e.target.value })}
                      className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                        errors.polo ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                      }`}
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
                      id="input-polo"
                      type="text"
                      value={formData.polo}
                      onChange={(e) => onUpdateFormData({ polo: e.target.value })}
                      placeholder={poloField.placeholder || 'Ex: Coqueiro/COMIEADEPA'}
                      className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                        errors.polo ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                      }`}
                    />
                  )}
                  {poloField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{poloField.helpText}</p>
                  )}
                  {errors.polo && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.polo}</p>
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
                    id="input-pastor"
                    type="text"
                    value={formData.pastor}
                    onChange={(e) => onUpdateFormData({ pastor: e.target.value })}
                    placeholder={pastorField.placeholder || 'Ex: Pr. Océlio Nauar de Araújo'}
                    className={`w-full bg-[#f8faf4] border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] ${
                      errors.pastor ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                    }`}
                  />
                  {pastorField.helpText && (
                    <p className="text-[10px] text-[#73796c]">{pastorField.helpText}</p>
                  )}
                  {errors.pastor && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.pastor}</p>
                  )}
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
                      value={formData[cf.name] || ''}
                      onChange={(e) => onUpdateFormData({ [cf.name]: e.target.value })}
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
                    <label className="border-2 border-dashed border-[#c2c9b9] rounded-2xl p-4 bg-[#f8faf4] text-center hover:bg-[#f2f5ec] transition-colors cursor-pointer block space-y-1">
                      <input
                        type="file"
                        accept={cf.fileAccept || '.pdf,.jpg,.jpeg,.png'}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onUpdateFormData({ [cf.name]: file.name });
                          }
                        }}
                      />
                      <FileText className="w-5 h-5 text-[#123d00] mx-auto" />
                      <p className="text-xs font-semibold text-[#082500]">
                        {formData[cf.name] ? `Selecionado: ${formData[cf.name]}` : (cf.placeholder || 'Clique ou arraste documento')}
                      </p>
                      <p className="text-[10px] text-[#73796c]">
                        Formatos aceitos: {cf.fileAccept || 'PDF, JPG, PNG'} (máx. {cf.maxFileSizeMb || 10}MB)
                      </p>
                    </label>
                  ) : cf.type === 'textarea' ? (
                    <textarea
                      rows={cf.rows || 4}
                      minLength={cf.minChars}
                      maxLength={cf.maxChars}
                      value={formData[cf.name] || ''}
                      onChange={(e) => onUpdateFormData({ [cf.name]: e.target.value })}
                      placeholder={cf.placeholder || `Informe ${cf.label.toLowerCase()}...`}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl p-3 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  ) : cf.type === 'checkbox' ? (
                    <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f8faf4] border border-[#c2c9b9] hover:bg-[#f2f5ec] transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[cf.name])}
                        onChange={(e) => onUpdateFormData({ [cf.name]: e.target.checked })}
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
                      minLength={cf.minChars}
                      maxLength={cf.maxChars}
                      value={formData[cf.name] ?? ''}
                      onChange={(e) => onUpdateFormData({ [cf.name]: e.target.value })}
                      placeholder={cf.placeholder || `Informe ${cf.label.toLowerCase()}...`}
                      className="w-full bg-[#f8faf4] border border-[#c2c9b9] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00]"
                    />
                  )}

                  {cf.helpText && (
                    <p className="text-[10px] text-[#73796c]">{cf.helpText}</p>
                  )}
                  {errors[cf.name] && (
                    <p className="text-[11px] text-[#b91c1c] font-semibold">{errors[cf.name]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Requisitos da COMIEADEPA (Radio Buttons) */}
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
                    id="radio-req-sim"
                    type="radio"
                    name="meetsRequirements"
                    checked={formData.meetsRequirements === true}
                    onChange={() => handleRadioChange(true)}
                    className="w-4 h-4 accent-[#123d00] cursor-pointer"
                  />
                  <span>Sim, confirmo plenamente todos os requisitos</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#b91c1c]">
                  <input
                    id="radio-req-nao"
                    type="radio"
                    name="meetsRequirements"
                    checked={formData.meetsRequirements === false}
                    onChange={() => handleRadioChange(false)}
                    className="w-4 h-4 accent-[#b91c1c] cursor-pointer"
                  />
                  <span>Não possuo os requisitos</span>
                </label>
              </div>

              {errors.meetsRequirements && (
                <p className="text-[11px] text-[#b91c1c] font-semibold pt-1">
                  {errors.meetsRequirements}
                </p>
              )}
            </div>
          )}

          {/* Campo de Parágrafo: Motivação */}
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
                  {formData.motivation.length} caracteres
                </span>
              </div>
              <p className="text-xs text-[#42493d]">
                {motivationField.helpText ||
                  'Explique a sua motivação para participar do projeto de escritores QGU e a sua convicção para atuar na área da escrita cristã.'}
              </p>

              <textarea
                id="textarea-motivation"
                rows={5}
                value={formData.motivation}
                onChange={(e) => onUpdateFormData({ motivation: e.target.value })}
                placeholder={
                  motivationField.placeholder ||
                  'Ex: Desde o início do meu discipulado nas fileiras da COMIEADEPA, compreendi que a pena do escritor sagrado tem o poder de cristalizar a sã doutrina para as futuras gerações...'
                }
                className={`w-full bg-[#f8faf4] border rounded-2xl p-4 text-xs sm:text-sm text-[#191c19] focus:outline-hidden focus:border-[#123d00] focus:ring-1 focus:ring-[#123d00] leading-relaxed ${
                  errors.motivation ? 'border-[#b91c1c]' : 'border-[#c2c9b9]'
                }`}
              />
              {errors.motivation && (
                <p className="text-[11px] text-[#b91c1c] font-semibold">{errors.motivation}</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#e7e9e3] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[#c2c9b9] text-[#42493d] hover:bg-[#f2f4ee] text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Instruções</span>
          </button>

          <button
            id="btn-avancar-prova"
            type="button"
            onClick={handleNextClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#123d00] hover:bg-[#0c2800] text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-100"
          >
            <span>Avançar para Conhecimentos Gerais em Teologia</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requirements Modal */}
      <RequirementsModal
        isOpen={showReqModal}
        onClose={() => setShowReqModal(false)}
        onReset={() => {
          onUpdateFormData({ meetsRequirements: null });
          setShowReqModal(false);
        }}
      />
    </div>
  );
};
