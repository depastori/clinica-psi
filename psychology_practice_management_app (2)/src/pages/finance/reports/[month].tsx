import { useRouter } from "next/router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function MonthlyReportPage() {
  const router = useRouter();
  const { month: monthParam } = router.query;

  const [month, year] = monthParam ? (monthParam as string).split('-').map(Number) : [0, 0];

  const report = useQuery(api.finance.getMonthlyReport, month && year ? { month, year } : "skip");
  const dailySummary = useQuery(api.finance.getDailySummary, { date: new Date().setHours(0,0,0,0) });

  if (!report || !dailySummary) return <div style={{ padding: "20px" }}>Carregando relatório...</div>;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = monthNames[month - 1];

  const totalIncome = report.incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpense = report.expenses.reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const todayIncomes = dailySummary.incomes.reduce((acc, i) => acc + i.amount, 0);
  const todayExpenses = dailySummary.expenses.filter(e => !e.paid).reduce((acc, e) => acc + e.amount, 0);

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>📊 Relatório Financeiro de {currentMonthName} de {year}</h1>

      {/* Resumo do Mês */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", margin: "20px 0" }}>
        <div style={cardStyle}>
          <h3>Total de Receitas</h3>
          <p style={{ fontSize: "20px", color: "green" }}>
            R$ {totalIncome.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div style={cardStyle}>
          <h3>Total de Despesas</h3>
          <p style={{ fontSize: "20px", color: "red" }}>
            R$ {totalExpense.toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div style={cardStyle}>
          <h3>Saldo Final</h3>
          <p style={{ fontSize: "20px", color: balance >= 0 ? "green" : "red" }}>
            R$ {balance.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      {/* Resumo do Dia */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "30px", backgroundColor: "white" }}>
        <h2>Resumo de Hoje ({new Date().toLocaleDateString("pt-BR")})</h2>
        <p><strong>Recebimentos do dia:</strong> R$ {todayIncomes.toFixed(2).replace(".", ",")}</p>
        <p><strong>Despesas a vencer hoje:</strong> R$ {todayExpenses.toFixed(2).replace(".", ",")}</p>
      </div>

      {/* Detalhes de Receitas */}
      <div style={{ marginTop: "30px" }}>
        <h3>📥 Detalhes das Receitas</h3>
        {report.incomes.length === 0 ? <p>Nenhuma receita registrada para este mês.</p> : (
          <ul>
            {report.incomes.map((i) => (
              <li key={i._id}>
                {new Date(i.date).toLocaleDateString("pt-BR")} - {i.description} ({i.source}) - {i.currency === "EUR" ? "€" : "R$"} {i.amount.toFixed(2).replace(".", ",")}
              </li>
            ))}
          </ul>
        )}

        <h3 style={{ marginTop: "20px" }}>📤 Detalhes das Despesas</h3>
        {report.expenses.length === 0 ? <p>Nenhuma despesa registrada para este mês.</p> : (
          <ul>
            {report.expenses.map((e) => (
              <li key={e._id}>
                {new Date(e.dueDate).toLocaleDateString("pt-BR")} - {e.description} ({e.category}) - {e.currency === "EUR" ? "€" : "R$"} {e.amount.toFixed(2).replace(".", ",")} {e.paid ? "✅ Pago" : "⏳ Em aberto"}
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
  textAlign: "center" as "center",
};
