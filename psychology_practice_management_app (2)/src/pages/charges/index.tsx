import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function ChargesPage() {
  const charges = useQuery(api.charges.listCharges, {});
  const markChargeAsPaid = useMutation(api.charges.markChargeAsPaid);
  const cancelCharge = useMutation(api.charges.cancelCharge);
  const generateReceiptFromCharge = useMutation(api.receipts.generateReceiptFromCharge);
  const generateChargeHTML = useMutation(api.charges.generateChargeHTML);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{[key: string]: string}>({});

  if (!charges) return <div style={{ padding: "20px" }}>Carregando cobranças...</div>;

  const handleMarkAsPaid = async (chargeId: string) => {
    const paymentMethod = selectedPaymentMethod[chargeId];
    if (!paymentMethod) {
      alert("Selecione um método de pagamento");
      return;
    }

    try {
      const result = await markChargeAsPaid({ 
        chargeId, 
        paymentMethod 
      });
      alert(`Cobrança marcada como paga! Recibo ${result.receiptNumber} gerado automaticamente.`);
      // Limpar seleção
      setSelectedPaymentMethod(prev => ({ ...prev, [chargeId]: "" }));
    } catch (err: any) {
      alert("Erro ao marcar como paga: " + err.message);
    }
  };

  const handleCancelCharge = async (chargeId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta cobrança?")) return;

    try {
      await cancelCharge({ chargeId });
      alert("Cobrança cancelada com sucesso!");
    } catch (err: any) {
      alert("Erro ao cancelar: " + err.message);
    }
  };

  const handleViewCharge = async (chargeId: string) => {
    try {
      const result = await generateChargeHTML({ chargeId });
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(result.html);
      }
    } catch (err: any) {
      alert("Erro ao gerar visualização: " + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#10b981"; // verde
      case "pending": return "#f59e0b"; // amarelo
      case "overdue": return "#ef4444"; // vermelho
      case "cancelled": return "#6b7280"; // cinza
      default: return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "✅ Pago";
      case "pending": return "⏳ Pendente";
      case "overdue": return "🚨 Vencido";
      case "cancelled": return "❌ Cancelado";
      default: return status;
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>💳 Cobranças</h1>
        <div>
          <button 
            style={{ 
              padding: "10px 20px", 
              backgroundColor: "#2563eb", 
              color: "white", 
              border: "none", 
              borderRadius: "5px",
              marginRight: "10px",
              cursor: "pointer"
            }}
            onClick={() => window.location.href = "/charges/create"}
          >
            + Nova Cobrança
          </button>
          <button 
            style={{ 
              padding: "10px 20px", 
              backgroundColor: "#059669", 
              color: "white", 
              border: "none", 
              borderRadius: "5px",
              cursor: "pointer"
            }}
            onClick={() => window.location.href = "/receipts"}
          >
            📄 Ver Recibos
          </button>
        </div>
      </div>

      {charges.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Nenhuma cobrança encontrada.</p>
          <button 
            style={{ 
              padding: "10px 20px", 
              backgroundColor: "#2563eb", 
              color: "white", 
              border: "none", 
              borderRadius: "5px",
              cursor: "pointer"
            }}
            onClick={() => window.location.href = "/charges/create"}
          >
            Criar primeira cobrança
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {charges.map((charge) => (
            <div 
              key={charge._id} 
              style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: "10px", 
                padding: "20px",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#1f2937" }}>
                    {charge.chargeNumber}
                  </h3>
                  <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                    {charge.patientName}
                  </p>
                </div>
                <span 
                  style={{ 
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    fontSize: "12px", 
                    fontWeight: "600",
                    backgroundColor: getStatusColor(charge.status) + "20",
                    color: getStatusColor(charge.status)
                  }}
                >
                  {getStatusText(charge.status)}
                </span>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Descrição:</strong> {charge.description}
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Valor:</strong> {charge.currency === "EUR" ? "€" : "R$"} {charge.amount.toFixed(2).replace(".", ",")}
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Vencimento:</strong> {new Date(charge.dueDate).toLocaleDateString("pt-BR")}
                </p>
                {charge.appointmentDates && charge.appointmentDates.length > 0 && (
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Consultas:</strong> {charge.appointmentDates.join(", ")}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <button 
                  onClick={() => handleViewCharge(charge._id)}
                  style={{ 
                    padding: "8px 16px", 
                    backgroundColor: "#6b7280", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  👁️ Visualizar
                </button>

                {charge.status === "pending" && (
                  <>
                    <select 
                      value={selectedPaymentMethod[charge._id] || ""}
                      onChange={(e) => setSelectedPaymentMethod(prev => ({ 
                        ...prev, 
                        [charge._id]: e.target.value 
                      }))}
                      style={{ 
                        padding: "8px", 
                        border: "1px solid #d1d5db", 
                        borderRadius: "5px",
                        fontSize: "14px"
                      }}
                    >
                      <option value="">Método de pagamento</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="transferencia">Transferência</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="mbway">MBWay</option>
                      <option value="paypal">PayPal</option>
                    </select>

                    <button 
                      onClick={() => handleMarkAsPaid(charge._id)}
                      style={{ 
                        padding: "8px 16px", 
                        backgroundColor: "#10b981", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ✅ Marcar como Pago
                    </button>

                    <button 
                      onClick={() => handleCancelCharge(charge._id)}
                      style={{ 
                        padding: "8px 16px", 
                        backgroundColor: "#ef4444", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      ❌ Cancelar
                    </button>
                  </>
                )}

                {charge.status === "overdue" && (
                  <>
                    <select 
                      value={selectedPaymentMethod[charge._id] || ""}
                      onChange={(e) => setSelectedPaymentMethod(prev => ({ 
                        ...prev, 
                        [charge._id]: e.target.value 
                      }))}
                      style={{ 
                        padding: "8px", 
                        border: "1px solid #d1d5db", 
                        borderRadius: "5px",
                        fontSize: "14px"
                      }}
                    >
                      <option value="">Método de pagamento</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="transferencia">Transferência</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="mbway">MBWay</option>
                      <option value="paypal">PayPal</option>
                    </select>

                    <button 
                      onClick={() => handleMarkAsPaid(charge._id)}
                      style={{ 
                        padding: "8px 16px", 
                        backgroundColor: "#10b981", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      💰 Receber Pagamento
                    </button>
                  </>
                )}

                {charge.status === "paid" && (
                  <span style={{ 
                    padding: "8px 16px", 
                    backgroundColor: "#d1fae5", 
                    color: "#065f46",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    💚 Pago - Recibo gerado automaticamente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
