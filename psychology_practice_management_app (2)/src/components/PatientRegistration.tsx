import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    // 1. Informações Pessoais
    fullName: "",
    socialName: "",
    birthDate: "",
    age: 0,
    gender: "",
    maritalStatus: "",
    nationality: "Brasileira",
    cpfOrId: "",
    
    // 2. Contato
    phone: "",
    email: "",
    address: "",
    timezone: "America/Sao_Paulo",
    
    // 3. Informações de Saúde / Queixa Principal
    mainComplaint: "",
    symptomDuration: "",
    mentalHealthHistory: "",
    medicationUse: "",
    medicalHistory: "",
    familyHistory: "",
    hasDiagnosis: false,
    diagnosisDetails: "",
    
    // 4. Dados de Atendimento
    treatmentType: "Psicanálise" as "Psicanálise" | "TALT" | "Regressão de Memória",
    sessionType: "online" as "online" | "presencial",
    sessionDuration: 60,
    agreedFrequency: "",
    firstSessionDate: "",
    sessionPrice: 150,
    currency: "BRL" as "BRL" | "EUR",
    paymentMethod: "",
    paymentData: "",
    
    // 6. Consentimento e Termos
    informedConsent: false,
    onlineSessionAuth: false,
    privacyPolicyAccept: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const createPatient = useMutation(api.patients.createPatient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createPatient(formData);
      toast.success("Paciente cadastrado com sucesso!");
      setFormData({
        fullName: "",
        socialName: "",
        birthDate: "",
        age: 0,
        gender: "",
        maritalStatus: "",
        nationality: "Brasileira",
        cpfOrId: "",
        phone: "",
        email: "",
        address: "",
        timezone: "America/Sao_Paulo",
        mainComplaint: "",
        symptomDuration: "",
        mentalHealthHistory: "",
        medicationUse: "",
        medicalHistory: "",
        familyHistory: "",
        hasDiagnosis: false,
        diagnosisDetails: "",
        treatmentType: "Psicanálise",
        sessionType: "online",
        sessionDuration: 60,
        agreedFrequency: "",
        firstSessionDate: "",
        sessionPrice: 150,
        currency: "BRL",
        paymentMethod: "",
        paymentData: "",
        informedConsent: false,
        onlineSessionAuth: false,
        privacyPolicyAccept: false,
      });
      setCurrentStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      birthDate,
      age: birthDate ? calculateAge(birthDate) : 0
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">1. Informações Pessoais</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="socialName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome Social (se houver)
          </label>
          <input
            type="text"
            id="socialName"
            name="socialName"
            value={formData.socialName}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Nascimento *
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            required
            value={formData.birthDate}
            onChange={handleBirthDateChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            Idade
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            readOnly
            className="form-input bg-gray-50"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gênero *
          </label>
          <select
            id="gender"
            name="gender"
            required
            value={formData.gender}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Selecione</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Não-binário">Não-binário</option>
            <option value="Prefiro não informar">Prefiro não informar</option>
          </select>
        </div>

        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
            Estado Civil *
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            required
            value={formData.maritalStatus}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Selecione</option>
            <option value="Solteiro(a)">Solteiro(a)</option>
            <option value="Casado(a)">Casado(a)</option>
            <option value="União Estável">União Estável</option>
            <option value="Divorciado(a)">Divorciado(a)</option>
            <option value="Viúvo(a)">Viúvo(a)</option>
          </select>
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
            Nacionalidade *
          </label>
          <input
            type="text"
            id="nationality"
            name="nationality"
            required
            value={formData.nationality}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="cpfOrId" className="block text-sm font-medium text-gray-700 mb-2">
            CPF ou Identificador (opcional)
          </label>
          <input
            type="text"
            id="cpfOrId"
            name="cpfOrId"
            value={formData.cpfOrId}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">2. Contato</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone / WhatsApp *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Endereço Atual *
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={3}
            value={formData.address}
            onChange={handleChange}
            className="form-textarea"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
            Fuso Horário *
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            value={formData.timezone}
            onChange={handleChange}
            className="form-select"
          >
            <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
            <option value="Europe/Lisbon">Lisboa (GMT+0/+1)</option>
            <option value="Europe/Madrid">Madrid (GMT+1/+2)</option>
            <option value="Europe/Paris">Paris (GMT+1/+2)</option>
            <option value="America/New_York">Nova York (GMT-5/-4)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">3. Informações de Saúde / Queixa Principal</h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="mainComplaint" className="block text-sm font-medium text-gray-700 mb-2">
            Queixa Principal *
          </label>
          <textarea
            id="mainComplaint"
            name="mainComplaint"
            required
            rows={4}
            value={formData.mainComplaint}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Descreva o motivo principal da busca por atendimento..."
          />
        </div>

        <div>
          <label htmlFor="symptomDuration" className="block text-sm font-medium text-gray-700 mb-2">
            Tempo de Sintomas *
          </label>
          <input
            type="text"
            id="symptomDuration"
            name="symptomDuration"
            required
            value={formData.symptomDuration}
            onChange={handleChange}
            className="form-input"
            placeholder="Ex: 6 meses, 2 anos..."
          />
        </div>

        <div>
          <label htmlFor="mentalHealthHistory" className="block text-sm font-medium text-gray-700 mb-2">
            Histórico de Saúde Mental *
          </label>
          <textarea
            id="mentalHealthHistory"
            name="mentalHealthHistory"
            required
            rows={3}
            value={formData.mentalHealthHistory}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Tratamentos anteriores, internações, etc."
          />
        </div>

        <div>
          <label htmlFor="medicationUse" className="block text-sm font-medium text-gray-700 mb-2">
            Uso de Medicação *
          </label>
          <textarea
            id="medicationUse"
            name="medicationUse"
            required
            rows={3}
            value={formData.medicationUse}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Medicamentos atuais, dosagens, prescritor..."
          />
        </div>

        <div>
          <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
            Histórico Médico Relevante *
          </label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            required
            rows={3}
            value={formData.medicalHistory}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Doenças, cirurgias, condições médicas..."
          />
        </div>

        <div>
          <label htmlFor="familyHistory" className="block text-sm font-medium text-gray-700 mb-2">
            Histórico Familiar (opcional)
          </label>
          <textarea
            id="familyHistory"
            name="familyHistory"
            rows={3}
            value={formData.familyHistory}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Histórico familiar de saúde mental..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDiagnosis"
              name="hasDiagnosis"
              checked={formData.hasDiagnosis}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasDiagnosis" className="ml-2 block text-sm text-gray-900">
              Possui diagnóstico?
            </label>
          </div>
        </div>

        {formData.hasDiagnosis && (
          <div>
            <label htmlFor="diagnosisDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Detalhes do Diagnóstico
            </label>
            <textarea
              id="diagnosisDetails"
              name="diagnosisDetails"
              rows={3}
              value={formData.diagnosisDetails}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Quem diagnosticou? Quando? Qual diagnóstico?"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">4. Dados de Atendimento</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="treatmentType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Atendimento *
          </label>
          <select
            id="treatmentType"
            name="treatmentType"
            required
            value={formData.treatmentType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="Psicanálise">Psicanálise</option>
            <option value="TALT">TALT</option>
            <option value="Regressão de Memória">Regressão de Memória</option>
          </select>
        </div>

        <div>
          <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-2">
            Modalidade *
          </label>
          <select
            id="sessionType"
            name="sessionType"
            required
            value={formData.sessionType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        <div>
          <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-2">
            Duração da Sessão (minutos) *
          </label>
          <select
            id="sessionDuration"
            name="sessionDuration"
            required
            value={formData.sessionDuration}
            onChange={handleChange}
            className="form-select"
          >
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
            <option value={120}>120 minutos</option>
            <option value={150}>150 minutos</option>
            <option value={180}>180 minutos</option>
          </select>
        </div>

        <div>
          <label htmlFor="agreedFrequency" className="block text-sm font-medium text-gray-700 mb-2">
            Frequência Combinada *
          </label>
          <input
            type="text"
            id="agreedFrequency"
            name="agreedFrequency"
            required
            value={formData.agreedFrequency}
            onChange={handleChange}
            className="form-input"
            placeholder="Ex: Semanal, Quinzenal..."
          />
        </div>

        <div>
          <label htmlFor="firstSessionDate" className="block text-sm font-medium text-gray-700 mb-2">
            Data da Primeira Sessão
          </label>
          <input
            type="date"
            id="firstSessionDate"
            name="firstSessionDate"
            value={formData.firstSessionDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
            Moeda *
          </label>
          <select
            id="currency"
            name="currency"
            required
            value={formData.currency}
            onChange={handleChange}
            className="form-select"
          >
            <option value="BRL">Real (BRL)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div>
          <label htmlFor="sessionPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Valor por Sessão *
          </label>
          <input
            type="number"
            id="sessionPrice"
            name="sessionPrice"
            required
            step="0.01"
            min="0"
            value={formData.sessionPrice}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
            Forma de Pagamento
          </label>
          <input
            type="text"
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="form-input"
            placeholder="PIX, Cartão, MBWAY, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="paymentData" className="block text-sm font-medium text-gray-700 mb-2">
            Dados do Pagamento
          </label>
          <textarea
            id="paymentData"
            name="paymentData"
            rows={3}
            value={formData.paymentData}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Informações adicionais sobre pagamento..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">6. Consentimento e Termos</h3>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="informedConsent"
            name="informedConsent"
            checked={formData.informedConsent}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="informedConsent" className="ml-2 block text-sm text-gray-900">
            <strong>Termo de Consentimento Informado *</strong><br />
            Autorizo a coleta e uso dos meus dados pessoais e clínicos para fins de atendimento psicológico, 
            conforme explicado pela profissional.
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="onlineSessionAuth"
            name="onlineSessionAuth"
            checked={formData.onlineSessionAuth}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="onlineSessionAuth" className="ml-2 block text-sm text-gray-900">
            <strong>Autorização para Atendimento Online *</strong><br />
            Autorizo a realização de sessões online e estou ciente das especificidades desta modalidade, 
            especialmente em atendimentos internacionais.
          </label>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="privacyPolicyAccept"
            name="privacyPolicyAccept"
            checked={formData.privacyPolicyAccept}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="privacyPolicyAccept" className="ml-2 block text-sm text-gray-900">
            <strong>Aceite de Política de Privacidade *</strong><br />
            Aceito a política de privacidade de acordo com LGPD (Brasil) ou GDPR (Europa), 
            conforme aplicável.
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Ficha de Cadastro de Pacientes / Clientes – Débora Pastori
      </h2>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Anterior
            </button>
          )}
          
          <div className="ml-auto">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.informedConsent || !formData.onlineSessionAuth || !formData.privacyPolicyAccept}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Cadastrando..." : "Finalizar Cadastro"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
