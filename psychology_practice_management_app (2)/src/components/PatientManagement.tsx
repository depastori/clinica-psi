import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type ViewMode = 'active' | 'inactive' | 'all';

interface Patient {
  _id: Id<"patients">;
  fullName: string;
  socialName?: string;
  email: string;
  phone: string;
  birthDate?: string;
  isActive?: boolean;
  inactivatedAt?: number;
  createdAt: number;
}

export default function PatientManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activePatients = useQuery(api.patients.listActivePatients);
  const inactivePatients = useQuery(api.patients.listInactivePatients);
  const allPatients = useQuery(api.patients.listAllPatients);
  const searchResults = useQuery(api.patients.searchPatients, 
    searchTerm.length > 2 ? { searchTerm } : "skip"
  );

  const inactivatePatient = useMutation(api.patients.inactivatePatient);
  const reactivatePatient = useMutation(api.patients.reactivatePatient);
  const deletePatient = useMutation(api.patients.deletePatient);
  const updatePatient = useMutation(api.patients.updatePatient);

  const getCurrentPatients = () => {
    if (searchTerm.length > 2) return searchResults || [];
    
    switch (viewMode) {
      case 'active':
        return activePatients || [];
      case 'inactive':
        return inactivePatients || [];
      case 'all':
        return allPatients || [];
      default:
        return [];
    }
  };

  const handleInactivate = async (patientId: Id<"patients">) => {
    try {
      await inactivatePatient({ patientId });
      toast.success("Paciente inativado com sucesso");
      setSelectedPatient(null);
    } catch (error) {
      toast.error("Erro ao inativar paciente");
    }
  };

  const handleReactivate = async (patientId: Id<"patients">) => {
    try {
      await reactivatePatient({ patientId });
      toast.success("Paciente reativado com sucesso");
      setSelectedPatient(null);
    } catch (error) {
      toast.error("Erro ao reativar paciente");
    }
  };

  const handleDelete = async (patientId: Id<"patients">) => {
    if (!confirm("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deletePatient({ patientId });
      toast.success("Paciente excluído com sucesso");
      setSelectedPatient(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir paciente");
    }
  };

  const handleUpdatePatient = async (updatedData: any) => {
    if (!selectedPatient) return;

    try {
      await updatePatient({
        patientId: selectedPatient._id,
        ...updatedData,
      });
      toast.success("Dados do paciente atualizados com sucesso");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar dados do paciente");
    }
  };

  const patients = getCurrentPatients();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Pacientes</h1>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar pacientes por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'active'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ativos ({activePatients?.length || 0})
            </button>
            
            <button
              onClick={() => setViewMode('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'inactive'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inativos ({inactivePatients?.length || 0})
            </button>
            
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({allPatients?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchTerm.length > 2 ? 'Resultados da Busca' : 
               viewMode === 'active' ? 'Pacientes Ativos' :
               viewMode === 'inactive' ? 'Pacientes Inativos' : 'Todos os Pacientes'}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {patients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm.length > 2 ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPatient?._id === patient._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {patient.socialName || patient.fullName}
                        {patient.socialName && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({patient.fullName})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                      {patient.birthDate && (
                        <p className="text-sm text-gray-500">
                          Nascimento: {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        patient.isActive !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {patient.isActive !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white rounded-lg shadow-sm border">
          {selectedPatient ? (
            <PatientDetails
              patient={selectedPatient}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onCancelEdit={() => setIsEditing(false)}
              onSave={handleUpdatePatient}
              onInactivate={handleInactivate}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              Selecione um paciente para ver os detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PatientDetailsProps {
  patient: Patient;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: any) => void;
  onInactivate: (id: Id<"patients">) => void;
  onReactivate: (id: Id<"patients">) => void;
  onDelete: (id: Id<"patients">) => void;
}

function PatientDetails({
  patient,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onInactivate,
  onReactivate,
  onDelete,
}: PatientDetailsProps) {
  const fullPatient = useQuery(api.patients.getPatient, { patientId: patient._id });
  const [formData, setFormData] = useState<any>({});

  const handleSave = () => {
    onSave(formData);
  };

  if (!fullPatient) {
    return <div className="p-4">Carregando...</div>;
  }

  const basicFields = [
    { key: 'fullName', label: 'Nome Completo', type: 'text', required: true },
    { key: 'socialName', label: 'Nome Social', type: 'text' },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Telefone', type: 'tel', required: true },
    { key: 'birthDate', label: 'Data de Nascimento', type: 'date' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Detalhes do Paciente
        </h2>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
              
              {fullPatient.isActive !== false ? (
                <button
                  onClick={() => onInactivate(patient._id)}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Inativar
                </button>
              ) : (
                <button
                  onClick={() => onReactivate(patient._id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Reativar
                </button>
              )}
              
              <button
                onClick={() => onDelete(patient._id)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Salvar
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {basicFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {isEditing ? (
              <input
                type={field.type}
                value={formData[field.key] ?? fullPatient[field.key as keyof typeof fullPatient] ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  [field.key]: e.target.value 
                })}
                className="form-input"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded border min-h-[2.5rem] flex items-center">
                {field.type === 'date' && fullPatient[field.key as keyof typeof fullPatient] ? (
                  new Date(fullPatient[field.key as keyof typeof fullPatient] as string).toLocaleDateString('pt-BR')
                ) : (
                  fullPatient[field.key as keyof typeof fullPatient] || 
                  <span className="text-gray-400 italic">Não informado</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {fullPatient.inactivatedAt && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">
            Paciente inativado em: {new Date(fullPatient.inactivatedAt).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
