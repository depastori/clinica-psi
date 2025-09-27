import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Função auxiliar para obter início da semana
function getStartOfWeek(date: Date) {
  const day = date.getDay() || 7; // transforma domingo=0 em 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (day - 1));
}

export default function DashboardPage() {
  const now = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(now));

  const appointments = useQuery(api.appointments.listAppointmentsByWeek, {
    weekStart: currentWeekStart.getTime(),
  });

  const createAppointment = useMutation(api.appointments.createAppointment);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  // Avançar/voltar semanas
  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  // Criar nova sessão
  const handleCreateAppointment = async (day: Date, hour: number) => {
    const patientName = prompt("Digite o nome do paciente:");
    if (!patientName) return;

    const periodicity = prompt("Periodicidade? (semanal, quinzenal, mensal ou número de dias):", "semanal");

    try {
      let result = await createAppointment({
        date: new Date(day.setHours(hour, 0, 0, 0)).getTime(),
        patientName,
      });

      // Agendamento recorrente
      if (periodicity) {
        let nextDate = new Date(day);
        for (let i = 0; i < 10; i++) { // gera até 10 sessões futuras
          if (periodicity === "semanal") nextDate.setDate(nextDate.getDate() + 7);
          else if (periodicity === "quinzenal") nextDate.setDate(nextDate.getDate() + 14);
          else if (periodicity === "mensal") nextDate.setMonth(nextDate.getMonth() + 1);
          else if (!isNaN(parseInt(periodicity))) nextDate.setDate(nextDate.getDate() + parseInt(periodicity));
          else break;

          await createAppointment({
            date: nextDate.getTime(),
            patientName,
          });
        }
      }

      alert("Sessão criada com sucesso!");
    } catch (err: any) {
      alert("Erro ao criar sessão: " + err.message);
    }
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 8); // agenda das 8h às 20h

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>📅 Agenda Semanal</h1>

      {/* Controles de navegação */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 0" }}>
        <button onClick={() => changeWeek(-1)} style={btnStyle}>← Semana Anterior</button>
        <h2>
          {weekDays[0].toLocaleDateString("pt-BR")} - {weekDays[6].toLocaleDateString("pt-BR")}
        </h2>
        <button onClick={() => changeWeek(1)} style={btnStyle}>Próxima Semana →</button>
      </div>

      {/* Grade da Semana */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px repeat(7, 1fr)",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {/* Cabeçalho dos dias */}
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
            {/* Coluna das horas */}
            <div style={{ padding: "8px", fontSize: "12px", textAlign: "right", borderTop: "1px solid #e5e7eb" }}>
              {hour}:00
            </div>

            {/* Slots da semana */}
            {weekDays.map((day, i) => {
              const slotDate = new Date(day);
              slotDate.setHours(hour, 0, 0, 0);
              const appointment = appointments?.find(a => {
                const d = new Date(a.date);
                return d.getDate() === slotDate.getDate() &&
                       d.getMonth() === slotDate.getMonth() &&
                       d.getFullYear() === slotDate.getFullYear() &&
                       d.getHours() === hour;
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
  );
}

const btnStyle = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
};
