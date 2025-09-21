import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface EnhancedInvoiceModalProps {
  allPatients: any[];
  onClose: () => void;
}

export default function EnhancedInvoiceModal({ allPatients, onClose }: EnhancedInvoiceModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [currency, setCurrency] = useState<"BRL" | "EUR">("BRL");
  const [description, setDescription] = useState("Sessões de terapia");
  const [paymentDate, setPaymentDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const [useManualAmount, setUseManualAmount] = useState(false);

  // Get patient's completed appointments
  const patientAppointments = useQuery(
    api.appointments.getAppointmentsByTherapist,
    selectedPatientId ? {} : "skip"
  );

  const calculateInvoiceAmount = useMutation(api.invoices.calculateInvoiceAmount);
  const createInvoice = useMutation(api.invoices.createInvoice);

  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Filter appointments for selected patient and completed status
  const availableAppointments = patientAppointments?.filter(
    (apt: any) => apt.patientId === selectedPatientId && apt.status === "completed"
  ) || [];

  // Calculate amount when appointments are selected
  useEffect(() => {
    if (selectedPatientId && selectedAppointments.length > 0 && !useManualAmount) {
      handleCalculateAmount();
    }
  }, [selectedPatientId, selectedAppointments, currency, useManualAmount]);

  const handleCalculateAmount = async () => {
    if (!selectedPatientId || selectedAppointments.length === 0) return;

    try {
      const result = await calculateInvoiceAmount({
        patientId: selectedPatientId as Id<"patients">,
        appointmentIds: selectedAppointments as Id<"appointments">[],
        currency,
      });
      setCalculationResult(result);
    } catch (error) {
      toast.error("Erro ao calcular valor");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId) {
      toast.error("Selecione um paciente");
      return;
    }

    const finalAmount = useManualAmount ? (manualAmount || 0) : (calculationResult?.totalAmount || 0);
    
    if (finalAmount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    try {
      await createInvoice({
        patientId: selectedPatientId as Id<"patients">,
        amount: finalAmount,
        currency,
        description,
        paymentDate,
        appointmentIds: selectedAppointments.length > 0 ? selectedAppointments as Id<"appointments">[] : undefined,
        sessionDetails: calculationResult?.sessionDetails || undefined,
      });
      
      toast.success("Cobrança criada com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao criar cobrança");
    }
  };

  const toggleAppointment = (appointmentId: string) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Nova Cobrança com Cálculo Automático</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient and Currency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  id="patientId"
                  required
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setSelectedAppointments([]);
                    setCalculationResult(null);
                  }}
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

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Moeda *
                </label>
                <select
                  id="currency"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "BRL" | "EUR")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>

            {/* Available Appointments */}
            {selectedPatientId && availableAppointments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sessões Realizadas (selecione para incluir na cobrança)
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {availableAppointments.map((appointment: any) => (
                    <div key={appointment._id} className="flex items-center space-x-3 py-2">
                      <input
                        type="checkbox"
                        id={appointment._id}
                        checked={selectedAppointments.includes(appointment._id)}
                        onChange={() => toggleAppointment(appointment._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={appointment._id} className="flex-1 text-sm">
                        <span className="font-medium">
                          {new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {appointment.time}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({appointment.duration || 60}min - {appointment.treatmentType} - {appointment.sessionType})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculation Result */}
            {calculationResult && !useManualAmount && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Cálculo Automático</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Sessões selecionadas:</strong> {calculationResult.sessionsCount}</p>
                  <p><strong>Total de horas:</strong> {calculationResult.totalHours.toFixed(2)}h</p>
                  <p><strong>Valor por hora:</strong> {currency === 'EUR' ? '€' : 'R$'} {calculationResult.hourlyRate.toFixed(2)}</p>
                  <p><strong>Valor total:</strong> {currency === 'EUR' ? '€' : 'R$'} {calculationResult.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Manual Amount Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useManualAmount"
                checked={useManualAmount}
                onChange={(e) => setUseManualAmount(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useManualAmount" className="text-sm text-gray-700">
                Usar valor manual (ignorar cálculo automático)
              </label>
            </div>

            {useManualAmount && (
              <div>
                <label htmlFor="manualAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Manual *
                </label>
                <input
                  type="number"
                  id="manualAmount"
                  step="0.01"
                  min="0"
                  required={useManualAmount}
                  value={manualAmount || ''}
                  onChange={(e) => setManualAmount(parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Description and Payment Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  id="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
