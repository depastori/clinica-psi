import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import EnhancedInvoiceModal from "./EnhancedInvoiceModal";

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'settings' | 'reports' | 'receipts'>('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<Id<"patients"> | null>(null);

  const invoices = useQuery(api.invoices.getInvoicesByTherapist, {});
  const paymentSettings = useQuery(api.invoices.getPaymentSettings);
  const allPatients = useQuery(api.patients.getAllPatients);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cobranças
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Configurações de Pagamento
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'receipts'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Recibos
          </button>
        </nav>
      </div>

      {activeTab === 'invoices' && (
        <InvoicesTab 
          invoices={invoices}
          allPatients={allPatients}
          showCreateInvoice={showCreateInvoice}
          setShowCreateInvoice={setShowCreateInvoice}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}

      {activeTab === 'settings' && (
        <PaymentSettingsTab paymentSettings={paymentSettings} />
      )}

      {activeTab === 'reports' && (
        <ReportsTab />
      )}

      {activeTab === 'receipts' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recibos</h2>
          <p className="text-gray-500 text-center py-8">Sistema de recibos em desenvolvimento</p>
        </div>
      )}
    </div>
  );
}

function InvoicesTab({ 
  invoices, 
  allPatients, 
  showCreateInvoice, 
  setShowCreateInvoice,
  selectedPatientId,
  setSelectedPatientId 
}: any) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  
  // const generatePixPayment = useMutation(api.invoices.generatePixPayment);
  const markInvoiceAsPaid = useMutation(api.invoices.markInvoiceAsPaid);
  const updateInvoiceStatus = useMutation(api.invoices.updateInvoiceStatus);

  const handleGeneratePixLink = async (invoiceId: Id<"invoices">) => {
    try {
      const result = await generatePixPayment({ invoiceId });
      navigator.clipboard.writeText(result.pixLink);
      toast.success("Link PIX gerado e copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao gerar link PIX");
    }
  };

  const handleMarkAsPaid = async (invoiceId: Id<"invoices">, paymentMethod: string) => {
    try {
      await markInvoiceAsPaid({ 
        invoiceId, 
        paymentMethod: paymentMethod as any
      });
      toast.success("Fatura marcada como paga!");
    } catch (error) {
      toast.error("Erro ao marcar fatura como paga");
    }
  };

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const statusMatch = filterStatus === 'all' || invoice.status === filterStatus;
    const currencyMatch = filterCurrency === 'all' || invoice.currency === filterCurrency;
    return statusMatch && currencyMatch;
  }) || [];

  return (
    <>
      {/* Header with Create Button */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Cobranças</h2>
          <button
            onClick={() => setShowCreateInvoice(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Nova Cobrança
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
            <option value="overdue">Vencidas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Moedas</option>
            <option value="BRL">Real (BRL)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cobranças</h3>
        
        {filteredInvoices.length > 0 ? (
          <div className="space-y-4">
            {filteredInvoices.map((invoice: any) => (
              <div key={invoice._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.patient?.fullName}</p>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                    <p className="text-sm text-gray-500">
                      Data de Pagamento: {new Date(invoice.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {invoice.currency === 'EUR' ? '€' : 'R$'} {invoice.amount.toFixed(2).replace('.', ',')}
                    </p>
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
                  </div>
                </div>
                
                {invoice.status === 'pending' && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {invoice.currency === 'BRL' && (
                      <button
                        onClick={() => handleGeneratePixLink(invoice._id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Gerar PIX
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkAsPaid(invoice._id, "cartao_credito")}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                    >
                      Cartão
                    </button>
                    {invoice.currency === 'EUR' && (
                      <>
                        <button
                          onClick={() => handleMarkAsPaid(invoice._id, "mbway")}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                        >
                          MBWAY
                        </button>
                        <button
                          onClick={() => handleMarkAsPaid(invoice._id, "revolut")}
                          className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        >
                          Revolut
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleMarkAsPaid(invoice._id, "paypal")}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      PayPal
                    </button>
                    <button
                      onClick={() => handleMarkAsPaid(invoice._id, "wise")}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Wise
                    </button>
                    <button
                      onClick={() => handleMarkAsPaid(invoice._id, "manual")}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Manual
                    </button>
                  </div>
                )}

                {invoice.paymentLink && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700 mb-2">Link de Pagamento:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={invoice.paymentLink}
                        readOnly
                        className="flex-1 px-2 py-1 text-sm border rounded bg-white"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(invoice.paymentLink);
                          toast.success("Link copiado!");
                        }}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhuma cobrança encontrada</p>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <EnhancedInvoiceModal
          allPatients={allPatients}
          onClose={() => setShowCreateInvoice(false)}
        />
      )}
    </>
  );
}

function PaymentSettingsTab({ paymentSettings }: any) {
  const [formData, setFormData] = useState({
    sessionPriceBRL: paymentSettings?.sessionPriceBRL || 150,
    sessionPriceEUR: paymentSettings?.sessionPriceEUR || 80,
    pixKey: paymentSettings?.pixKey || "",
    creditCardDetails: paymentSettings?.creditCardDetails || "",
    mbwayDetails: paymentSettings?.mbwayDetails || "",
    paypalDetails: paymentSettings?.paypalDetails || "",
    stripeDetails: paymentSettings?.stripeDetails || "",
    wiseDetails: paymentSettings?.wiseDetails || "",
    revolutDetails: paymentSettings?.revolutDetails || "",
    bankDetails: paymentSettings?.bankDetails || "",
    paymentInstructions: paymentSettings?.paymentInstructions || "",
    autoGenerateInvoices: paymentSettings?.autoGenerateInvoices || false,
    defaultPaymentDate: paymentSettings?.defaultPaymentDate || 1,
  });

  // const updatePaymentSettings = useMutation(api.invoices.updatePaymentSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePaymentSettings(formData);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações de Pagamento</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sessionPriceBRL" className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Sessão (R$) *
            </label>
            <input
              type="number"
              id="sessionPriceBRL"
              name="sessionPriceBRL"
              step="0.01"
              min="0"
              required
              value={formData.sessionPriceBRL}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sessionPriceEUR" className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Sessão (€) *
            </label>
            <input
              type="number"
              id="sessionPriceEUR"
              name="sessionPriceEUR"
              step="0.01"
              min="0"
              required
              value={formData.sessionPriceEUR}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="defaultPaymentDate" className="block text-sm font-medium text-gray-700 mb-2">
              Dia do Mês para Pagamento
            </label>
            <input
              type="number"
              id="defaultPaymentDate"
              name="defaultPaymentDate"
              min="1"
              max="31"
              value={formData.defaultPaymentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pixKey" className="block text-sm font-medium text-gray-700 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              id="pixKey"
              name="pixKey"
              value={formData.pixKey}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>

          <div>
            <label htmlFor="mbwayDetails" className="block text-sm font-medium text-gray-700 mb-2">
              MBWAY
            </label>
            <input
              type="text"
              id="mbwayDetails"
              name="mbwayDetails"
              value={formData.mbwayDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número de telefone MBWAY"
            />
          </div>

          <div>
            <label htmlFor="paypalDetails" className="block text-sm font-medium text-gray-700 mb-2">
              PayPal
            </label>
            <input
              type="text"
              id="paypalDetails"
              name="paypalDetails"
              value={formData.paypalDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E-mail PayPal"
            />
          </div>

          <div>
            <label htmlFor="revolutDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Revolut
            </label>
            <input
              type="text"
              id="revolutDetails"
              name="revolutDetails"
              value={formData.revolutDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes Revolut"
            />
          </div>

          <div>
            <label htmlFor="wiseDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Wise
            </label>
            <input
              type="text"
              id="wiseDetails"
              name="wiseDetails"
              value={formData.wiseDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes Wise"
            />
          </div>

          <div>
            <label htmlFor="stripeDetails" className="block text-sm font-medium text-gray-700 mb-2">
              Stripe
            </label>
            <input
              type="text"
              id="stripeDetails"
              name="stripeDetails"
              value={formData.stripeDetails}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes Stripe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-700 mb-2">
            Dados Bancários
          </label>
          <textarea
            id="bankDetails"
            name="bankDetails"
            rows={3}
            value={formData.bankDetails}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Banco, agência, conta corrente..."
          />
        </div>

        <div>
          <label htmlFor="paymentInstructions" className="block text-sm font-medium text-gray-700 mb-2">
            Instruções de Pagamento
          </label>
          <textarea
            id="paymentInstructions"
            name="paymentInstructions"
            rows={4}
            value={formData.paymentInstructions}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Instruções adicionais para o paciente sobre como pagar..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoGenerateInvoices"
            name="autoGenerateInvoices"
            checked={formData.autoGenerateInvoices}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoGenerateInvoices" className="ml-2 block text-sm text-gray-900">
            Gerar cobranças automaticamente após sessões
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}

function ReportsTab() {
  const [reportType, setReportType] = useState<'sessions' | 'payments' | 'patient_summary'>('sessions');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const allPatients = useQuery(api.patients.getAllPatients);
  const reports = useQuery(api.reports.getReports);
  
  const generateSessionReport = useMutation(api.reports.generateSessionReport);
  const generatePaymentReport = useMutation(api.reports.generatePaymentReport);
  const generatePatientSummary = useMutation(api.reports.generatePatientSummary);

  const handleGenerateReport = async () => {
    try {
      if (reportType === 'sessions') {
        await generateSessionReport({
          startDate,
          endDate,
          patientId: selectedPatientId ? selectedPatientId as Id<"patients"> : undefined,
        });
      } else if (reportType === 'payments') {
        await generatePaymentReport({
          startDate,
          endDate,
        });
      } else if (reportType === 'patient_summary' && selectedPatientId) {
        await generatePatientSummary({
          patientId: selectedPatientId as Id<"patients">,
        });
      }
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Gerar Relatórios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Relatório
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sessions">Relatório de Sessões</option>
              <option value="payments">Relatório de Pagamentos</option>
              <option value="patient_summary">Resumo do Paciente</option>
            </select>
          </div>

          {reportType !== 'patient_summary' && (
            <>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {(reportType === 'sessions' || reportType === 'patient_summary') && (
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                Paciente {reportType === 'patient_summary' ? '*' : '(opcional)'}
              </label>
              <select
                id="patientId"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={reportType === 'patient_summary'}
              >
                <option value="">Todos os pacientes</option>
                {allPatients?.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateReport}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Gerar Relatório
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Relatórios Gerados</h3>
        
        {reports && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{report.title}</p>
                  <p className="text-sm text-gray-600">
                    Gerado em: {new Date(report.generatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Aqui você pode implementar a visualização do relatório
                      toast.info("Funcionalidade de visualização em desenvolvimento");
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Visualizar
                  </button>
                  <button
                    onClick={() => {
                      // Aqui você pode implementar o download do relatório
                      toast.info("Funcionalidade de download em desenvolvimento");
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhum relatório gerado ainda</p>
        )}
      </div>
    </div>
  );
}

function CreateInvoiceModal({ allPatients, onClose }: any) {
  const [formData, setFormData] = useState({
    patientId: "",
    amount: 150,
    currency: "BRL" as "BRL" | "EUR",
    description: "Sessão de terapia",
    paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sessionDetails: "",
  });

  const createInvoice = useMutation(api.invoices.createInvoice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        patientId: formData.patientId as Id<"patients">,
        amount: formData.amount,
        currency: formData.currency,
        description: formData.description,
        paymentDate: formData.paymentDate,
        sessionDetails: formData.sessionDetails || undefined,
      });
      toast.success("Cobrança criada com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao criar cobrança");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Nova Cobrança</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                Paciente *
              </label>
              <select
                id="patientId"
                name="patientId"
                required
                value={formData.patientId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um paciente</option>
                {allPatients?.map((patient: any) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Moeda *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Pagamento *
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                required
                value={formData.paymentDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sessionDetails" className="block text-sm font-medium text-gray-700 mb-2">
                Detalhes das Sessões
              </label>
              <textarea
                id="sessionDetails"
                name="sessionDetails"
                rows={3}
                value={formData.sessionDetails}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 4 sessões de 60min realizadas em Janeiro/2024"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Cobrança
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
