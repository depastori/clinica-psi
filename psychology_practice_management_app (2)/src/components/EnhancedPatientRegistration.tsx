import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import PatientList from "./PatientList";
import PatientRegistration from "./PatientRegistration";
import { Id } from "../../convex/_generated/dataModel";

export default function EnhancedPatientRegistration() {
  const [activeTab, setActiveTab] = useState<'list' | 'register'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<Id<"patients"> | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lista de Pacientes
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'register'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cadastrar Paciente
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <PatientList 
              onSelectPatient={setSelectedPatientId}
              selectedPatientId={selectedPatientId}
            />
          )}
          {activeTab === 'register' && (
            <PatientRegistration />
          )}
        </div>
      </div>
    </div>
  );
}
