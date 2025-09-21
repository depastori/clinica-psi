import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import PatientBillingHistory from "./PatientBillingHistory";

interface PatientProfileProps {
  patientId: Id<"patients">;
  onClose: () => void;
}

export default function PatientProfile({ patientId, onClose }: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'payments' | 'notes'>('info');
  
  const patient = useQuery(api.patients.getPatient, { patientId });
  const appointments = useQuery(api.appointments.getAppointmentsByPatient, { patientId });
  const clinicalSessions = useQuery(api.clinicalSessions.getSessionsByPatient, { patientId });

  const generateInvoiceHTML = useMutation(api.invoices.generateInvoiceHTML);
  const generateReceiptHTML = useMutation(api.receipts.generateReceiptHTML);

  const handleGenerateInvoiceHTML = async (invoiceId: Id<"invoices">) => {
    try {
      const result = await generateInvoiceHTML({ invoiceId });
      // Create and download the PDF
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF da cobrança gerado!");
    } catch (error) {
      toast.error("Erro ao gerar PDF da cobrança");
    }
  };

  const handleGenerateReceiptHTML = async (receiptId: Id<"receipts">) => {
    try {
      const result = await generateReceiptHTML({ receiptId });
      // Create and download the PDF
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF do recibo gerado!");
    } catch (error) {
      toast.error("Erro ao gerar PDF do recibo");
    }
  };

  if (!patient) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
              <p className="text-gray-600">{patient.email} • {patient.phone}</p>
              {patient.isActive === false && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  Paciente Inativo
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Informações Pessoais
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sessões e Anotações
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pagamentos
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <PatientInfoTab patient={patient} />
          )}

          {activeTab === 'sessions' && (
            <SessionsTab 
              appointments={appointments || []} 
              clinicalSessions={clinicalSessions || []} 
            />
          )}

          {activeTab === 'payments' && (
            <PatientBillingHistory 
              patientId={patientId}
              onGenerateInvoicePDF={handleGenerateInvoiceHTML}
              onGenerateReceiptPDF={handleGenerateReceiptHTML}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PatientInfoTab({ patient }: { patient: any }) {
  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <p className="mt-1 text-sm text-gray-900">{patient.fullName}</p>
          </div>
          {patient.socialName && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Social</label>
              <p className="mt-1 text-sm text-gray-900">{patient.socialName}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <p className="mt-1 text-sm text-gray-900">{patient.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <p className="mt-1 text-sm text-gray-900">{patient.phone}</p>
          </div>
          {patient.birthDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {patient.age && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Idade</label>
              <p className="mt-1 text-sm text-gray-900">{patient.age} anos</p>
            </div>
          )}
          {patient.gender && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Gênero</label>
              <p className="mt-1 text-sm text-gray-900">{patient.gender}</p>
            </div>
          )}
          {patient.maritalStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
              <p className="mt-1 text-sm text-gray-900">{patient.maritalStatus}</p>
            </div>
          )}
          {patient.nationality && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nacionalidade</label>
              <p className="mt-1 text-sm text-gray-900">{patient.nationality}</p>
            </div>
          )}
          {patient.cpfOrId && (
            <div>
              <label className="block text-sm font-medium text-gray-700">CPF/ID</label>
              <p className="mt-1 text-sm text-gray-900">{patient.cpfOrId}</p>
            </div>
          )}
          {patient.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Endereço</label>
              <p className="mt-1 text-sm text-gray-900">{patient.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Informações de Saúde */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Saúde</h3>
        <div className="space-y-4">
          {patient.mainComplaint && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Queixa Principal</label>
              <p className="mt-1 text-sm text-gray-900">{patient.mainComplaint}</p>
            </div>
          )}
          {patient.symptomDuration && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Duração dos Sintomas</label>
              <p className="mt-1 text-sm text-gray-900">{patient.symptomDuration}</p>
            </div>
          )}
          {patient.mentalHealthHistory && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Histórico de Saúde Mental</label>
              <p className="mt-1 text-sm text-gray-900">{patient.mentalHealthHistory}</p>
            </div>
          )}
          {patient.medicationUse && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Uso de Medicamentos</label>
              <p className="mt-1 text-sm text-gray-900">{patient.medicationUse}</p>
            </div>
          )}
          {patient.medicalHistory && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Histórico Médico</label>
              <p className="mt-1 text-sm text-gray-900">{patient.medicalHistory}</p>
            </div>
          )}
          {patient.familyHistory && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Histórico Familiar</label>
              <p className="mt-1 text-sm text-gray-900">{patient.familyHistory}</p>
            </div>
          )}
          {patient.hasDiagnosis && patient.diagnosisDetails && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
              <p className="mt-1 text-sm text-gray-900">{patient.diagnosisDetails}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dados de Atendimento */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados de Atendimento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient.treatmentType && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Tratamento</label>
              <p className="mt-1 text-sm text-gray-900">{patient.treatmentType}</p>
            </div>
          )}
          {patient.sessionType && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Modalidade</label>
              <p className="mt-1 text-sm text-gray-900">{patient.sessionType}</p>
            </div>
          )}
          {patient.sessionDuration && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Duração da Sessão</label>
              <p className="mt-1 text-sm text-gray-900">{patient.sessionDuration} minutos</p>
            </div>
          )}
          {patient.agreedFrequency && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequência Acordada</label>
              <p className="mt-1 text-sm text-gray-900">{patient.agreedFrequency}</p>
            </div>
          )}
          {patient.firstSessionDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Data da Primeira Sessão</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(patient.firstSessionDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {patient.sessionPrice && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor da Sessão</label>
              <p className="mt-1 text-sm text-gray-900">
                {patient.currency === 'EUR' ? '€' : 'R$'} {patient.sessionPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionsTab({ appointments, clinicalSessions }: { appointments: any[], clinicalSessions: any[] }) {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const getSessionNotes = (appointmentId: string) => {
    return clinicalSessions.find(session => session.appointmentId === appointmentId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Sessões</h3>
        </div>
        <div className="divide-y">
          {appointments.map((appointment) => {
            const sessionNotes = getSessionNotes(appointment._id);
            return (
              <div key={appointment._id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {appointment.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.duration || 60}min • {appointment.treatmentType} • {appointment.sessionType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : appointment.status === 'missed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status === 'completed' ? 'Realizada' : 
                       appointment.status === 'scheduled' ? 'Agendada' :
                       appointment.status === 'missed' ? 'Faltou' : 'Cancelada'}
                    </span>
                    {sessionNotes && (
                      <button
                        onClick={() => setSelectedAppointment(selectedAppointment === appointment._id ? null : appointment._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {selectedAppointment === appointment._id ? 'Ocultar' : 'Ver'} Anotações
                      </button>
                    )}
                  </div>
                </div>
                
                {selectedAppointment === appointment._id && sessionNotes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Presença</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {sessionNotes.attendance === 'present' ? 'Presente' : 'Ausente'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Observações Clínicas</label>
                        <p className="mt-1 text-sm text-gray-900">{sessionNotes.clinicalObservations}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Anotações Livres</label>
                        <p className="mt-1 text-sm text-gray-900">{sessionNotes.freeNotes}</p>
                      </div>
                      {sessionNotes.interventions && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Intervenções</label>
                          <p className="mt-1 text-sm text-gray-900">{sessionNotes.interventions}</p>
                        </div>
                      )}
                      {sessionNotes.strategies && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estratégias</label>
                          <p className="mt-1 text-sm text-gray-900">{sessionNotes.strategies}</p>
                        </div>
                      )}
                      {sessionNotes.referrals && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Encaminhamentos</label>
                          <p className="mt-1 text-sm text-gray-900">{sessionNotes.referrals}</p>
                        </div>
                      )}
                      {sessionNotes.evolution && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Evolução</label>
                          <p className="mt-1 text-sm text-gray-900">{sessionNotes.evolution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {appointments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhuma sessão registrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
