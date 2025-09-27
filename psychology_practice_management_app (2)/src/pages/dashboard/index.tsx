import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/router";

const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Função auxiliar para obter início da semana
function getStartOfWeek(date: Date) {
  const day = date.getDay() || 7; // transforma domingo=0 em 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (day - 1));
}

export default function DashboardPage() {
  const router = useRouter();
  const now = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(now));

  // Proteção de rota: se não tem userId, manda para login
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
    }
  }, [router]);

  const appointments = useQuery(api.appointments.listAppointmentsByWeek, {
    weekStart: currentWeekStart.getTime(),
  });

  const createAppointment = useMutation(api.appointments.createAppointment);
  const updateAppointment = useMutation(api.appointments.updateAppointment);
  const deleteAppointment = useMutation(api.appointments.deleteAppointment);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  // Criar sessão
  const handleCreateAppointment = async (day: Date, hour: number) => {
    const patientName = prompt("Digite o nome do paciente:");
    if (!patientName) return;

    try {
      await createAppointment({
        date: new Date(day.setHours(hour, 0, 0, 0)).getTime(),
        patientName,
      });
      alert("Sessão criada!");
    } catch (err: any) {
      alert("Erro ao criar sessão: " + err.message);
    }
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <h2 style={{ color: "white", marginBottom: "30px" }}>Painel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button style={linkStyle} onClick={() => router.push("/patients")}>👥 Pacientes</button>
          <button style={linkStyle} onClick={() => router.push("/dashboard")}>📅 Agenda</button>
          <button style={linkStyle} onClick={() => router.push("/finance/reports/1-2025")}>💰 Financeiro</button>
          <button
            style={{ ...linkStyle, marginTop: "auto", background: "#dc2626" }}
            onClick={() => {
              localStorage.removeItem("userId"); // 🔹 Limpa login
              router.push("/login");
            }}
          >
            🚪 Sair
          </button>
        </nav>
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        <h1>📅 Agenda Semanal</h1>

        {/* Navegação de semanas */}
        <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 0" }}>
          <button onClick={() => changeWeek(-1)} style={btnStyle}>← Semana Anterior</button>
          <h2>
            {weekDays[0].toLocaleDateString("pt-BR")} - {weekDays[6].toLocaleDateString("pt-BR")}
          </h2>
          <button onClick={() => changeWeek(1)} style={btnStyle}>Próxima Semana →</button>
        </div>

        {/* Grade da semana */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "80px repeat(7, 1fr)",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          {/* Cabeçalho */}
          <div style={{ background: "#f9fafb" }}></div>
          {weekDays.map((day, i) => (
            <div key={i} style={{ padding: "10px", background: "#f9fafb", textAlign: "center", borderLeft: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: "600" }}>{daysOfWeek[i]}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </div>
            </div>
          ))}

          {/* Linhas de horas */}
          {hoursList.map((hour) => (
            <React.Fragment key={hour}>
              <div style={{ padding: "8px", fontSize: "12px", textAlign: "right", borderTop: "1px solid #e5e7eb" }}>
                {hour}:00
              </div>
              {weekDays.map((day, i) => {
                const slotDate = new Date(day);
                slotDate.setHours(hour, 0, 0, 0);
                const appointment = appointments?.find(a => {
                  const d = new Date(a.date);
                  return d.toDateString() === slotDate.toDateString() && d.getHours() === hour;
                });

                return (
                  <div
                    key={`${i}-${hour}`}
                    onClick={() => !appointment && handleCreateAppointment(new Date(slotDate), hour)}
                    style={{
                      padding: "8px",
                      minHeight: "60px",
                      borderTop: "1px solid #e5e7eb",
                      borderLeft: "1px solid #e5e7eb",
                      cursor: appointment ? "default" : "pointer",
                      background: appointment ? "#dbeafe" : "white",
                    }}
                  >
                    {appointment ? (
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a8a" }}>
                        {appointment.patientName}
                      </div>
                    ) : (
                      <div style={{ fontSize: "10px", color: "#9ca3af" }}>+ Disponível</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

const sidebarStyle = {
  width: "220px",
  background: "#1e3a8a",
  color: "white",
  display: "flex",
  flexDirection: "column" as "column",
  padding: "20px",
};

const linkStyle = {
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  textAlign: "left" as "left",
  cursor: "pointer",
  fontWeight: 500,
};

const btnStyle = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
};
