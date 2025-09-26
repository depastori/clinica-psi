import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ReceiptsPage() {
  const receipts = useQuery(api.receipts.getReceiptsByTherapist, {});
  const generateReceiptHTML = useMutation(api.receipts.generateReceiptHTML);

  if (!receipts) return <p>Carregando...</p>;
  if (receipts.length === 0) return <p>Nenhum recibo encontrado.</p>;

  const handleViewReceipt = async (receiptId: string) => {
    try {
      const result = await generateReceiptHTML({ receiptId });
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(result.html); // abre preview HTML
      }
    } catch (err: any) {
      alert("Erro ao gerar recibo: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📄 Recibos Emitidos</h1>
      <ul>
        {receipts.map((r) => (
          <li key={r._id} style={{ marginBottom: "15px" }}>
            <b>{r.receiptNumber}</b> - {r.description} <br />
            Valor: {r.currency === "EUR" ? "€" : "R$"} {r.amount.toFixed(2)} <br />
            Pagamento em {new Date(r.paymentDate).toLocaleDateString("pt-BR")} <br />
            <button onClick={() => handleViewReceipt(r._id)}>Ver Recibo</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
