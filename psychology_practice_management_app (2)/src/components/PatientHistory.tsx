import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import PatientBillingHistory from "./PatientBillingHistory";

interface PatientHistoryProps {
  patientId: Id<"patients"> | null;
  onClose: () => void;
}

export default function PatientHistory({ patientId, onClose }: PatientHistoryProps) {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const patient = useQuery(api.patients.getPatient, patientId ? { patientId } : "skip");
  const sessions = useQuery(api.clinicalSessions.getSessionsByPatient, patientId ? { patientId } : "skip");

  if (!patientId || !patient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico do Paciente</h2>
        <p className="text-gray-500 text-center py-8">Selecione um paciente para ver o histórico</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Histórico do Paciente</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Informações do Paciente</h3>
              <button
                onClick={() => setShowCompleteForm(!showCompleteForm)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                {showCompleteForm ? 'Ocultar Ficha Completa' : 'Ver Ficha Completa'}
              </button>
            </div>
            
            {!showCompleteForm ? (
              // Summary view
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Nome:</span> {patient.fullName}</p>
                    <p><span className="font-medium">E-mail:</span> {patient.email}</p>
                    <p><span className="font-medium">Telefone:</span> {patient.phone}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Idade:</span> {patient.age} anos</p>
                    <p><span className="font-medium">Nacionalidade:</span> {patient.nationality}</p>
                    <p><span className="font-medium">Tipo de Tratamento:</span> {patient.treatmentType}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p><span className="font-medium">Queixa principal:</span> {patient.mainComplaint}</p>
                </div>
              </div>
            ) : (
              // Complete form view
              <div className="space-y-6">
                {/* 1. Informações Pessoais */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">1. Informações Pessoais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Nome Completo:</span> {patient.fullName}</p>
                      {patient.socialName && (
                        <p><span className="font-medium">Nome Social:</span> {patient.socialName}</p>
                      )}
                      <p><span className="font-medium">Data de Nascimento:</span> {patient.birthDate ? new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}</p>
                      <p><span className="font-medium">Idade:</span> {patient.age} anos</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Gênero:</span> {patient.gender || 'Não informado'}</p>
                      <p><span className="font-medium">Estado Civil:</span> {patient.maritalStatus || 'Não informado'}</p>
                      <p><span className="font-medium">Nacionalidade:</span> {patient.nationality}</p>
                      {patient.cpfOrId && (
                        <p><span className="font-medium">CPF/ID:</span> {patient.cpfOrId}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Contato */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">2. Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Telefone:</span> {patient.phone}</p>
                      <p><span className="font-medium">E-mail:</span> {patient.email}</p>
                    </div>
                    <div>
                      {patient.address && (
                        <p><span className="font-medium">Endereço:</span> {patient.address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Informações de Saúde */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">3. Informações de Saúde / Queixa Principal</h4>
                  <div className="space-y-3 text-sm">
                    {patient.mainComplaint && (
                      <div>
                        <p className="font-medium">Queixa Principal:</p>
                        <p className="bg-white p-3 rounded border">{patient.mainComplaint}</p>
                      </div>
                    )}
                    {patient.symptomDuration && (
                      <p><span className="font-medium">Tempo de Sintomas:</span> {patient.symptomDuration}</p>
                    )}
                    {patient.mentalHealthHistory && (
                      <div>
                        <p className="font-medium">Histórico de Saúde Mental:</p>
                        <p className="bg-white p-3 rounded border">{patient.mentalHealthHistory}</p>
                      </div>
                    )}
                    {patient.medicationUse && (
                      <div>
                        <p className="font-medium">Uso de Medicação:</p>
                        <p className="bg-white p-3 rounded border">{patient.medicationUse}</p>
                      </div>
                    )}
                    {patient.medicalHistory && (
                      <div>
                        <p className="font-medium">Histórico Médico:</p>
                        <p className="bg-white p-3 rounded border">{patient.medicalHistory}</p>
                      </div>
                    )}
                    {patient.familyHistory && (
                      <div>
                        <p className="font-medium">Histórico Familiar:</p>
                        <p className="bg-white p-3 rounded border">{patient.familyHistory}</p>
                      </div>
                    )}
                    {patient.hasDiagnosis && patient.diagnosisDetails && (
                      <div>
                        <p className="font-medium">Diagnóstico:</p>
                        <p className="bg-white p-3 rounded border">{patient.diagnosisDetails}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Dados de Atendimento */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">4. Dados de Atendimento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Tipo de Tratamento:</span> {patient.treatmentType}</p>
                      <p><span className="font-medium">Modalidade:</span> {patient.sessionType}</p>
                      <p><span className="font-medium">Duração da Sessão:</span> {patient.sessionDuration} minutos</p>
                      {patient.agreedFrequency && (
                        <p><span className="font-medium">Frequência:</span> {patient.agreedFrequency}</p>
                      )}
                    </div>
                    <div>
                      {patient.firstSessionDate && (
                        <p><span className="font-medium">Primeira Sessão:</span> {new Date(patient.firstSessionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      )}
                      {patient.sessionPrice && (
                        <p><span className="font-medium">Valor por Sessão:</span> {patient.currency === 'BRL' ? 'R$' : '€'} {patient.sessionPrice.toFixed(2)}</p>
                      )}
                      {/* Payment method not in schema */}
                    </div>
                  </div>
                  {/* Payment data not in schema */}
                </div>

                {/* 5. Consentimentos */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">5. Consentimentos e Termos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span>Termo de Consentimento Informado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span>Autorização para Atendimento Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span>Aceite de Política de Privacidade</span>
                    </div>
                  </div>
                </div>

                {/* Data de Cadastro */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações do Cadastro</h4>
                  <p className="text-sm">
                    <span className="font-medium">Data de Cadastro:</span> {new Date(patient.createdAt).toLocaleDateString('pt-BR')} às {new Date(patient.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sessions History */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-4">Histórico de Sessões</h3>
            
            {sessions && sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-gray-900">
                          {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          session.attendance === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.attendance === 'present' ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Observações Clínicas:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {session.clinicalObservations}
                        </p>
                      </div>
                      
                      {session.freeNotes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Anotações Livres:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.freeNotes}
                          </p>
                        </div>
                      )}

                      {session.interventions && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Intervenções:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.interventions}
                          </p>
                        </div>
                      )}

                      {session.strategies && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Estratégias:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.strategies}
                          </p>
                        </div>
                      )}

                      {session.referrals && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Encaminhamentos:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.referrals}
                          </p>
                        </div>
                      )}

                      {session.evolution && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Evolução:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.evolution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhuma sessão registrada ainda</p>
            )}
          </div>

          {/* Billing History */}
          <div>
            <PatientBillingHistory patientId={patientId} />
          </div>
        </div>
      </div>
    </div>
  );
}
