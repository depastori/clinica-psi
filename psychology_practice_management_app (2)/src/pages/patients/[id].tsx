import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PatientDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // pega o id do paciente da URL

  const patient = useQuery(api.patients.getPatient, id ? { patientId: id as string } : "skip");
  const updatePatient = useMutation(api.patients.updatePatient);
  const inactivatePatient = useMutation(api.patients.inactivatePatient);
  const reactivatePatient = useMutation(api.patients.reactivatePatient);
  const deletePatient = useMutation(api.patients.deletePatient);

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm(patient);
    }
  }, [patient]);

  if (!patient) {
    return <div style={{ padding: "20px" }}>Carregando paciente...</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updatePatient({
        patientId: patient._id,
        ...form,
        age: form.age ? parseInt(form.age) : undefined,
        sessionPrice: form.sessionPrice ? parseFloat(form.sessionPrice) : undefined,
      });
      alert("Ficha atualizada com sucesso!");
      router.push("/patients");
    } catch (error: any) {
      alert("Erro ao atualizar paciente: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleInactivate = async () => {
    if (!confirm("Tem certeza que deseja inativar este paciente?")) return;
    await inactivatePatient({ patientId: patient._id });
    alert("Paciente inativado.");
    router.reload();
  };

  const handleReactivate = async () => {
    await reactivatePatient({ patientId: patient._id });
    alert("Paciente reativado.");
    router.reload();
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este paciente? Essa ação não pode ser desfeita.")) return;
    try {
      await deletePatient({ patientId: patient._id });
      alert("Paciente excluído com sucesso!");
      router.push("/patients");
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>👤 Ficha do Paciente</h1>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
        {/* Nome, email, telefone */}
        <div>
          <label>Nome Completo *</label>
          <input type="text" name="fullName" value={form.fullName || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Nome Social</label>
          <input type="text" name="socialName" value={form.socialName || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Email *</label>
          <input type="email" name="email" value={form.email || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Telefone *</label>
          <input type="tel" name="phone" value={form.phone || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Endereço</label>
          <textarea name="address" value={form.address || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>

        {/* Diagnóstico */}
        <div>
          <label>
            <input type="checkbox" name="hasDiagnosis" checked={form.hasDiagnosis || false} onChange={handleChange} />
            Possui diagnóstico
          </label>
        </div>
        {form.hasDiagnosis && (
          <div>
            <label>Detalhes do Diagnóstico</label>
            <textarea name="diagnosisDetails" value={form.diagnosisDetails || ""} onChange={handleChange} style={{ width: "100%" }} />
          </div>
        )}

        {/* Tratamento */}
        <div>
          <label>Tipo de Tratamento</label>
          <input type="text" name="treatmentType" value={form.treatmentType || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div>
          <label>Modalidade</label>
          <select name="sessionType" value={form.sessionType || ""} onChange={handleChange} style={{ width: "100%" }}>
            <option value="">Selecione</option>
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
        <div>
          <label>Valor da Sessão</label>
          <input type="number" name="sessionPrice" value={form.sessionPrice || ""} onChange={handleChange} style={{ width: "100%" }} />
        </div>

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
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>

      <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
        {patient.isActive ? (
          <button
            onClick={handleInactivate}
            style={{ backgroundColor: "#f59e0b", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px" }}
          >
            ❌ Inativar Paciente
          </button>
        ) : (
          <button
            onClick={handleReactivate}
            style={{ backgroundColor: "#10b981", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px" }}
          >
            ✅ Reativar Paciente
          </button>
        )}

        <button
          onClick={handleDelete}
          style={{ backgroundColor: "#ef4444", color: "white", padding: "10px 20px", border: "none", borderRadius: "5px" }}
        >
          🗑️ Excluir Paciente
        </button>
      </div>
    </div>
  );
}
