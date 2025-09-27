import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CreatePatientPage() {
  const createPatient = useMutation(api.patients.createPatient);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // Dados básicos
    fullName: "",
    socialName: "",
    email: "",
    phone: "",
    birthDate: "",
    age: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    cpfOrId: "",
    address: "",
    
    // Dados clínicos
    mainComplaint: "",
    symptomDuration: "",
    mentalHealthHistory: "",
    medicationUse: "",
    medicalHistory: "",
    familyHistory: "",
    hasDiagnosis: false,
    diagnosisDetails: "",
    
    // Dados de tratamento
    treatmentType: "",
    sessionType: "",
    sessionDuration: "60",
    agreedFrequency: "",
    firstSessionDate: "",
    sessionPrice: "",
    currency: "BRL",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validações básicas
    if (!form.fullName.trim()) {
      alert("Nome completo é obrigatório");
      setLoading(false);
      return;
    }

    if (!form.email.trim()) {
      alert("Email é obrigatório");
      setLoading(false);
      return;
    }

    if (!form.phone.trim()) {
      alert("Telefone é obrigatório");
      setLoading(false);
      return;
    }

    try {
      // Preparar dados para envio
      const patientData = {
        fullName: form.fullName.trim(),
        socialName: form.socialName.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        nationality: form.nationality || undefined,
        cpfOrId: form.cpfOrId || undefined,
        address: form.address || undefined,
        mainComplaint: form.mainComplaint || undefined,
        symptomDuration: form.symptomDuration || undefined,
        mentalHealthHistory: form.mentalHealthHistory || undefined,
        medicationUse: form.medicationUse || undefined,
        medicalHistory: form.medicalHistory || undefined,
        familyHistory: form.familyHistory || undefined,
        hasDiagnosis: form.hasDiagnosis,
        diagnosisDetails: form.diagnosisDetails || undefined,
        treatmentType: form.treatmentType || undefined,
        sessionType: form.sessionType || undefined,
        sessionDuration: form.sessionDuration ? parseInt(form.sessionDuration) : undefined,
        agreedFrequency: form.agreedFrequency || undefined,
        firstSessionDate: form.firstSessionDate || undefined,
        sessionPrice: form.sessionPrice ? parseFloat(form.sessionPrice) : undefined,
        currency: form.currency as "BRL" | "EUR",
      };

      const patientId = await createPatient(patientData);
      
      alert("Paciente cadastrado com sucesso!");
      window.location.href = `/patients/${patientId}`;
      
    } catch (error: any) {
      console.error("Erro ao cadastrar paciente:", error);
      alert("Erro ao cadastrar paciente: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>👤 Novo Paciente</h1>
        <button 
          onClick={() => window.location.href = "/patients"}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#6b7280", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ← Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Dados Pessoais */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <legend style={{ fontWeight: "bold", color: "#374151" }}>📋 Dados Pessoais</legend>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Nome Completo *</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Nome Social</label>
              <input
                type="text"
                name="socialName"
                value={form.socialName}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Telefone *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Data de Nascimento</label>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Idade</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Gênero</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Selecione</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="nao-binario">Não-binário</option>
                <option value="outro">Outro</option>
                <option value="prefiro-nao-informar">Prefiro não informar</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Estado Civil</label>
              <select
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Selecione</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="uniao-estavel">União Estável</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>CPF/RG/Documento</label>
            <input
              type="text"
              name="cpfOrId"
              value={form.cpfOrId}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
            />
          </div>
          
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Endereço</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
            />
          </div>
        </fieldset>

        {/* Dados Clínicos */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <legend style={{ fontWeight: "bold", color: "#374151" }}>🏥 Dados Clínicos</legend>
          
          <div style={{ display: "grid", gap: "15px", marginTop: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Queixa Principal</label>
              <textarea
                name="mainComplaint"
                value={form.mainComplaint}
                onChange={handleChange}
                rows={3}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Duração dos Sintomas</label>
              <input
                type="text"
                name="symptomDuration"
                value={form.symptomDuration}
                onChange={handleChange}
                placeholder="Ex: 6 meses, 2 anos..."
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Histórico de Saúde Mental</label>
              <textarea
                name="mentalHealthHistory"
                value={form.mentalHealthHistory}
                onChange={handleChange}
                rows={3}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Uso de Medicamentos</label>
              <textarea
                name="medicationUse"
                value={form.medicationUse}
                onChange={handleChange}
                rows={2}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Histórico Médico</label>
              <textarea
                name="medicalHistory"
                value={form.medicalHistory}
                onChange={handleChange}
                rows={2}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Histórico Familiar</label>
              <textarea
                name="familyHistory"
                value={form.familyHistory}
                onChange={handleChange}
                rows={2}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  name="hasDiagnosis"
                  checked={form.hasDiagnosis}
                  onChange={handleChange}
                />
                <span style={{ fontWeight: "500" }}>Possui diagnóstico prévio</span>
              </label>
            </div>
            
            {form.hasDiagnosis && (
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Detalhes do Diagnóstico</label>
                <textarea
                  name="diagnosisDetails"
                  value={form.diagnosisDetails}
                  onChange={handleChange}
                  rows={2}
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>
            )}
          </div>
        </fieldset>

        {/* Dados de Tratamento */}
        <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
          <legend style={{ fontWeight: "bold", color: "#374151" }}>💼 Dados de Tratamento</legend>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Tipo de Tratamento</label>
              <select
                name="treatmentType"
                value={form.treatmentType}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Selecione</option>
                <option value="psicoterapia">Psicoterapia</option>
                <option value="terapia-cognitiva">Terapia Cognitiva</option>
                <option value="terapia-comportamental">Terapia Comportamental</option>
                <option value="psicanalise">Psicanálise</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Modalidade</label>
              <select
                name="sessionType"
                value={form.sessionType}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Selecione</option>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Duração da Sessão (min)</label>
              <select
                name="sessionDuration"
                value={form.sessionDuration}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="45">45 minutos</option>
                <option value="50">50 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Frequência Acordada</label>
              <select
                name="agreedFrequency"
                value={form.agreedFrequency}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                <option value="">Selecione</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="conforme-necessidade">Conforme necessidade</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Data da Primeira Sessão</label>
              <input
                type="date"
                name="firstSessionDate"
                value={form.firstSessionDate}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Valor da Sessão</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                >
                  <option value="BRL">R$</option>
                  <option value="EUR">€</option>
                </select>
                <input
                  type="number"
                  name="sessionPrice"
                  value={form.sessionPrice}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  style={{ flex: 1, padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: "15px", justifyContent: "flex-end", marginTop: "30px" }}>
          <button
            type="button"
            onClick={() => window.location.href = "/patients"}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Cadastrando..." : "Cadastrar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
