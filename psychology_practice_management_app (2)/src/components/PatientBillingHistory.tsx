import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PatientBillingHistoryProps {
  patientId: Id<"patients">;
  onGenerateInvoicePDF?: (invoiceId: Id<"invoices">) => void;
  onGenerateReceiptPDF?: (receiptId: Id<"receipts">) => void;
}

export default function PatientBillingHistory({ 
  patientId, 
  onGenerateInvoicePDF, 
  onGenerateReceiptPDF 
}: PatientBillingHistoryProps) {
  const invoices = useQuery(api.invoices.getInvoicesByPatient, { patientId });
  const receipts = useQuery(api.receipts.getReceiptsByPatient, { patientId });
  
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const deleteReceipt = useMutation(api.receipts.deleteReceipt);

  const handleDeleteInvoice = async (invoiceId: Id<"invoices">) => {
    if (!confirm("Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deleteInvoice({ invoiceId });
      toast.success("Cobrança excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir cobrança");
    }
  };

  const handleDeleteReceipt = async (receiptId: Id<"receipts">) => {
    if (!confirm("Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deleteReceipt({ receiptId });
      toast.success("Recibo excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir recibo");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cobranças */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Cobranças</h3>
        </div>
        <div className="divide-y">
          {invoices && invoices.length > 0 ? (
            invoices.map((invoice) => (
              <div key={invoice._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.description}</p>
                    <p className="text-sm text-gray-600">
                      Vencimento: {new Date(invoice.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {invoice.currency === 'EUR' ? '€' : 'R$'} {invoice.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Pago' : 
                       invoice.status === 'pending' ? 'Pendente' :
                       invoice.status === 'overdue' ? 'Vencido' : 'Cancelado'}
                    </span>
                    {onGenerateInvoicePDF && (
                      <button
                        onClick={() => onGenerateInvoicePDF(invoice._id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        PDF Cobrança
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInvoice(invoice._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nenhuma cobrança registrada
            </div>
          )}
        </div>
      </div>

      {/* Recibos */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recibos</h3>
        </div>
        <div className="divide-y">
          {receipts && receipts.length > 0 ? (
            receipts.map((receipt) => (
              <div key={receipt._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Recibo #{receipt.receiptNumber}</p>
                    <p className="text-sm text-gray-600">
                      Gerado em: {new Date(receipt.generatedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {receipt.currency === 'EUR' ? '€' : 'R$'} {receipt.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onGenerateReceiptPDF && (
                      <button
                        onClick={() => onGenerateReceiptPDF(receipt._id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        PDF Recibo
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReceipt(receipt._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              Nenhum recibo gerado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
