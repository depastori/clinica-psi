import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PatientsPage() {
  const allPatients = useQuery(api.patients.getAllPatients, {});
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [searchTerm, setSearchTerm] = useState("");

  if (!allPatients) {
    return <div style={{ padding: "20px" }}>Carregando pacientes...</div>;
  }

  // Filtrar pacientes
  const filteredPatients = allPatients.filter(patient => {
    // Filtro por status
    if (filter === "active" && !patient.isActive) return false;
    if (filter === "inactive" && patient.isActive) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        patient.fullName.toLowerCase().includes(search) ||
        (patient.socialName && patient.socialName.toLowerCase().includes(search)) ||
        patient.email.toLowerCase().includes(search) ||
        patient.phone.includes(search)
      );
    }
    
    return true;
  });

  const activeCount = allPatients.filter(p => p.isActive).length;
  const inactiveCount = allPatients.filter(p => !p.isActive).length;

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
          color: isActive ? "#065f46" : "#991b1b",
        }}
      >
        {isActive ? "✅ Ativo" : "❌ Inativo"}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>👥 Pacientes</h1>
        <button
          onClick={() => window.location.href = "/patients/create"}
          style={{
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          + Novo Paciente
        </button>
      </div>

      {/* Filtros e Busca */}
      <div style={{ 
        display: "flex", 
        gap: "20px", 
        alignItems: "center", 
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        {/* Filtros de Status */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "8px 16px",
              backgroundColor: filter === "all" ? "#2563eb" : "#f3f4f6",
              color: filter === "all" ? "white" : "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Todos ({allPatients.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "8px 16px",
              backgroundColor: filter === "active" ? "#10b981" : "#f3f4f6",
              color: filter === "active" ? "white" : "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            style={{
              padding: "8px 16px",
              backgroundColor: filter === "inactive" ? "#ef4444" : "#f3f4f6",
              color: filter === "inactive" ? "white" : "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Inativos ({inactiveCount})
          </button>
        </div>

        {/* Campo de Busca */}
        <div style={{ flex: 1, maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          />
        </div>
      </div>

      {/* Lista de Pacientes */}
      {filteredPatients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            {searchTerm 
              ? "Nenhum paciente encontrado com os critérios de busca."
              : filter === "active" 
                ? "Nenhum paciente ativo encontrado."
                : filter === "inactive"
                  ? "Nenhum paciente inativo encontrado."
                  : "Nenhum paciente cadastrado."
            }
          </p>
          {!searchTerm && filter !== "inactive" && (
            <button
              onClick={() => window.location.href = "/patients/create"}
              style={{
                padding: "12px 24px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cadastrar primeiro paciente
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {filteredPatients.map((patient) => (
            <div
              key={patient._id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#1f2937" }}>
                    {patient.socialName || patient.fullName}
                    {patient.socialName && (
                      <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "normal" }}>
                        {" "}({patient.fullName})
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                    {patient.email} • {patient.phone}
                  </p>
                </div>
                {getStatusBadge(patient.isActive)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
                {patient.birthDate && (
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    <strong>Idade:</strong> {calculateAge(patient.birthDate)} anos
                  </p>
                )}
                {patient.gender && (
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    <strong>Gênero:</strong> {patient.gender}
                  </p>
                )}
                {patient.sessionType && (
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    <strong>Modalidade:</strong> {patient.sessionType}
                  </p>
                )}
                {patient.sessionPrice && (
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    <strong>Valor:</strong> {patient.currency === "EUR" ? "€" : "R$"} {patient.sessionPrice.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>

              {patient.mainComplaint && (
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    <strong>Queixa Principal:</strong> {patient.mainComplaint.length > 100 
                      ? patient.mainComplaint.substring(0, 100) + "..." 
                      : patient.mainComplaint
                    }
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => window.location.href = `/patients/${patient._id}`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  📋 Ver Ficha
                </button>

                <button
                  onClick={() => window.location.href = `/charges/create?patient=${patient.fullName}`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  💳 Nova Cobrança
                </button>

                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  Cadastrado em {formatDate(new Date(patient.createdAt).toISOString().split('T')[0])}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
