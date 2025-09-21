import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ClinicalSessionFormProps {
  appointment: any;
  onClose: () => void;
}

export default function ClinicalSessionForm({ appointment, onClose }: ClinicalSessionFormProps) {
  const [formData, setFormData] = useState({
    attendance: "present" as "present" | "absent",
    clinicalObservations: "",
    freeNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClinicalSession = useMutation(api.clinicalSessions.createClinicalSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createClinicalSession({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        sessionDate: appointment.date,
        ...formData,
      });

      toast.success("Sessão clínica registrada com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao registrar sessão clínica");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Ficha Clínica</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Informações da Sessão</h3>
            <p className="text-sm text-gray-600">Paciente: {appointment.patient?.fullName}</p>
            <p className="text-sm text-gray-600">
              Data: {new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {appointment.time}
            </p>
            <p className="text-sm text-gray-600">Tipo: {appointment.type}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="attendance" className="block text-sm font-medium text-gray-700 mb-2">
                Presença *
              </label>
              <select
                id="attendance"
                name="attendance"
                value={formData.attendance}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="present">Presente</option>
                <option value="absent">Ausente</option>
              </select>
            </div>

            <div>
              <label htmlFor="clinicalObservations" className="block text-sm font-medium text-gray-700 mb-2">
                Observações Clínicas *
              </label>
              <textarea
                id="clinicalObservations"
                name="clinicalObservations"
                required
                rows={6}
                value={formData.clinicalObservations}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva as observações clínicas da sessão..."
              />
            </div>

            <div>
              <label htmlFor="freeNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Anotações Livres
              </label>
              <textarea
                id="freeNotes"
                name="freeNotes"
                rows={4}
                value={formData.freeNotes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Anotações adicionais, lembretes, etc..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Salvando..." : "Salvar Sessão"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
