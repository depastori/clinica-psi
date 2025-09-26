import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ChargesPage() {
  const charges = useQuery(api.charges.listCharges, {});

  if (!charges) return <p>Carregando...</p>;
  if (charges.length === 0) return <p>Nenhuma cobrança encontrada.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>💳 Cobranças</h1>
      <ul>
        {charges.map((c) => (
          <li key={c._id}>
            <b>{c.chargeNumber}</b> - {c.description} <br />
            Valor: {c.currency === "EUR" ? "€" : "R$"} {c.amount.toFixed(2)} <br />
            Status: {c.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
