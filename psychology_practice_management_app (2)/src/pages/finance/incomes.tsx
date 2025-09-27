import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function IncomesPage() {
  const addIncome = useMutation(api.finance.addIncome);
  const today = new Date();
  const currentMonth = useQuery(api.finance.getMonthlyReport, { month: today.getMonth() + 1, year: today.getFullYear() });

  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "BRL",
    date: "",
    source: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.description || !form.amount || !form.date) {
      alert("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      await addIncome({
        description: form.description,
        amount: parseFloat(form.amount),
        currency: form.currency as "BRL" | "EUR",
        date: new Date(form.date).getTime(),
        source: form.source || undefined,
      });
      alert("Receita adicionada com sucesso!");
      setForm({ description: "", amount: "", currency: "BRL", date: "", source: "" });
    } catch (err: any) {
      alert("Erro ao adicionar receita: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>📥 Receitas Avulsas</h1>

      {/* Formulário */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "30px", backgroundColor: "white" }}>
        <h2>+ Nova Receita</h2>
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
            <label>Data *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
          </div>
          <div>
            <label>Origem (opcional)</label>
            <input type="text" name="source" value={form.source} onChange={handleChange} placeholder="Ex: Workshop, pagamento extra..." style={{ width: "100%", padding: "8px" }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: "12px", backgroundColor: loading ? "#9ca3af" : "#2563eb", color: "white", border: "none", borderRadius: "5px", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Adicionando..." : "Adicionar Receita"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <h2>Receitas deste mês</h2>
      {currentMonth?.incomes.length === 0 ? (
        <p>Nenhuma receita registrada ainda.</p>
      ) : (
        <ul>
          {currentMonth?.incomes.map((i) => (
            <li key={i._id}>
              {new Date(i.date).toLocaleDateString("pt-BR")} - {i.description} ({i.source || "Avulsa"}) - {i.currency === "EUR" ? "€" : "R$"} {i.amount.toFixed(2).replace(".", ",")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
