import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ExpensesPage() {
  const addExpense = useMutation(api.finance.addExpense);
  const payExpense = useMutation(api.finance.payExpense);
  const allExpenses = useQuery(api.finance.getMonthlyReport, { // Usando getMonthlyReport para listar todas as despesas
    month: new Date().getMonth() + 1, // Mês atual
    year: new Date().getFullYear(), // Ano atual
  });

  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "BRL",
    dueDate: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.description || !form.amount || !form.dueDate) {
      alert("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      await addExpense({
        description: form.description,
        amount: parseFloat(form.amount),
        currency: form.currency as "BRL" | "EUR",
        dueDate: new Date(form.dueDate).getTime(),
        category: form.category || undefined,
      });
      alert("Despesa adicionada com sucesso!");
      setForm({ description: "", amount: "", currency: "BRL", dueDate: "", category: "" }); // Limpa o formulário
      // Recarregar a lista de despesas (o useQuery já faz isso automaticamente)
    } catch (err: any) {
      alert("Erro ao adicionar despesa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayExpense = async (expenseId: string) => {
    if (!confirm("Tem certeza que deseja marcar esta despesa como paga?")) return;
    try {
      await payExpense({ expenseId });
      alert("Despesa marcada como paga!");
      // Recarregar a lista de despesas
    } catch (err: any) {
      alert("Erro ao marcar como paga: " + err.message);
    }
  };

  const getStatusColor = (paid: boolean) => (paid ? "#10b981" : "#f59e0b");

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>💸 Controle de Despesas</h1>

      {/* Formulário de Nova Despesa */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "30px", backgroundColor: "white" }}>
        <h2>+ Nova Despesa</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label>Descrição *</label>
            <input type="text" name="description" value={form.description} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
          </div>
          <div>
            <label>Valor *</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <select name="currency" value={form.currency} onChange={handleChange} style={{ padding: "8px" }}>
                <option value="BRL">R$</option>
                <option value="EUR">€</option>
              </select>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} required step="0.01" style={{ flex: 1, padding: "8px" }} />
            </div>
          </div>
          <div>
            <label>Data de Vencimento *</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
          </div>
          <div>
            <label>Categoria</label>
            <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="Ex: Aluguel, Luz, Internet" style={{ width: "100%", padding: "8px" }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: "12px", backgroundColor: loading ? "#9ca3af" : "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Adicionando..." : "Adicionar Despesa"}
          </button>
        </form>
      </div>

      {/* Lista de Despesas */}
      <div style={{ marginTop: "30px" }}>
        <h2>Despesas do Mês</h2>
        {allExpenses?.expenses.length === 0 ? (
          <p>Nenhuma despesa registrada para este mês.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {allExpenses?.expenses.map((expense) => (
              <div key={expense._id} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "15px", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ margin: "0", color: "#1f2937" }}>{expense.description}</h3>
                  <span style={{ padding: "4px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "600", backgroundColor: getStatusColor(expense.paid) + "20", color: getStatusColor(expense.paid) }}>
                    {expense.paid ? "✅ Pago" : "⏳ Em Aberto"}
                  </span>
                </div>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Valor:</strong> {expense.currency === "EUR" ? "€" : "R$"} {expense.amount.toFixed(2).replace(".", ",")}
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Vencimento:</strong> {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                </p>
                {expense.category && (
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Categoria:</strong> {expense.category}
                  </p>
                )}
                {!expense.paid && (
                  <button onClick={() => handlePayExpense(expense._id)} style={{ marginTop: "10px", padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px" }}>
                    Marcar como Pago
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
