import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function FinancePage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const report = useQuery(api.finance.getMonthlyReport, { month, year });

  if (!report) return <div style={{ padding: "20px" }}>Carregando...</div>;

  const totalIncome = report.incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpense = report.expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", margin: "20px 0" }}>
  <button
    style={btnStyle}
    onClick={() => {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    }}
  >
    ← Mês Anterior
  </button>

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <input
      type="number"
      value={month}
      onChange={(e) => setMonth(parseInt(e.target.value))}
      min={1}
      max={12}
      style={{ width: "60px", textAlign: "center", padding: "5px" }}
    />
    /
    <input
      type="number"
      value={year}
      onChange={(e) => setYear(parseInt(e.target.value))}
      min={2020}
      max={2100}
      style={{ width: "80px", textAlign: "center", padding: "5px" }}
    />
  </div>

  <button
    style={btnStyle}
    onClick={() => {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    }}
  >
    Próximo Mês →
  </button>
</div>

      <h2>
        Resumo de {month}/{year}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", margin: "20px 0" }}>
        <div style={cardStyle}>
          <h3>Entradas</h3>
          <p style={{ fontSize: "20px", color: "green" }}>
            R$ {totalIncome.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div style={cardStyle}>
          <h3>Saídas</h3>
          <p style={{ fontSize: "20px", color: "red" }}>
            R$ {totalExpense.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div style={cardStyle}>
          <h3>Saldo</h3>
          <p style={{ fontSize: "20px", color: balance >= 0 ? "green" : "red" }}>
            R$ {balance.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      {/* Listagem */}
      <div style={{ marginTop: "30px" }}>
        <h3>📥 Receitas</h3>
        {report.incomes.length === 0 ? <p>Nenhuma receita registrada</p> : (
          <ul>
            {report.incomes.map((i) => (
              <li key={i._id}>{i.description} - R$ {i.amount.toFixed(2).replace(".", ",")}</li>
            ))}
          </ul>
        )}

        <h3 style={{ marginTop: "20px" }}>📤 Despesas</h3>
        {report.expenses.length === 0 ? <p>Nenhuma despesa registrada</p> : (
          <ul>
            {report.expenses.map((e) => (
              <li key={e._id}>
                {e.description} - R$ {e.amount.toFixed(2).replace(".", ",")} {e.paid ? "✅ Pago" : "⏳ Em aberto"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "15px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  backgroundColor: "#fff",

  const btnStyle = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
};
};
