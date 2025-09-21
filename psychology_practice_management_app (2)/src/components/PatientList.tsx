import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PatientListProps {
  onSelectPatient: (patientId: Id<"patients">) => void;
  selectedPatientId?: Id<"patients"> | null;
}

export default function PatientList({ onSelectPatient, selectedPatientId }: PatientListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'nextAppointment'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const patients = useQuery(api.patients.getAllPatients) || [];
  const appointments = useQuery(api.appointments.getAppointmentsByTherapist, {}) || [];

  // Get next appointment for each patient
  const getNextAppointment = (patientId: Id<"patients">) => {
    const today = new Date().toISOString().split('T')[0];
    const patientAppointments = appointments
      .filter(apt => apt.patientId === patientId && apt.date >= today && apt.status === 'scheduled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
      });
    
    return patientAppointments[0] || null;
  };

  // Filter and sort patients
  const filteredAndSortedPatients = patients
    .filter(patient => 
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'nextAppointment':
          const nextA = getNextAppointment(a._id);
          const nextB = getNextAppointment(b._id);
          
          if (!nextA && !nextB) comparison = 0;
          else if (!nextA) comparison = 1;
          else if (!nextB) comparison = -1;
          else {
            const dateCompare = nextA.date.localeCompare(nextB.date);
            comparison = dateCompare !== 0 ? dateCompare : nextA.time.localeCompare(nextB.time);
          }
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Pacientes</h2>
          <span className="text-sm text-gray-500">
            {filteredAndSortedPatients.length} paciente{filteredAndSortedPatients.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort controls */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'nextAppointment')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Nome</option>
              <option value="date">Data de Cadastro</option>
              <option value="nextAppointment">Próximo Agendamento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordem:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredAndSortedPatients.map((patient) => {
              const nextAppointment = getNextAppointment(patient._id);
              const isSelected = selectedPatientId === patient._id;
              
              return (
                <div
                  key={patient._id}
                  onClick={() => onSelectPatient(patient._id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Cadastrado: {formatDate(new Date(patient.createdAt).toISOString().split('T')[0])}</span>
                        {patient.treatmentType && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            {patient.treatmentType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {nextAppointment ? (
                        <div className="text-sm">
                          <div className="font-medium text-green-600">Próxima sessão:</div>
                          <div className="text-gray-600">
                            {formatDate(nextAppointment.date)} às {formatTime(nextAppointment.time)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Sem agendamentos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
