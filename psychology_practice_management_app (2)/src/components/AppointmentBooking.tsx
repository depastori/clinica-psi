import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentType, setAppointmentType] = useState<"online" | "presencial">("presencial");
  const [treatmentType, setTreatmentType] = useState<"Psicanálise" | "TALT" | "Regressão de Memória">("Psicanálise");
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionDuration, setSessionDuration] = useState(60);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState(60);

  const availableSlots = useQuery(api.availableSlots.getAvailableSlots, 
    selectedDate ? { dayOfWeek: new Date(selectedDate).getDay() } : "skip"
  );
  const patient = useQuery(api.patients.getPatientByEmail, 
    patientEmail ? { email: patientEmail } : "skip"
  );

  const bookAppointment = useMutation(api.appointments.createAppointment);
  const createSingleSlot = useMutation(api.availableSlots.createAvailableSlot);
  const deleteSlot = useMutation(api.availableSlots.deleteAvailableSlot);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient) {
      toast.error("Paciente não encontrado. Verifique o e-mail ou cadastre o paciente primeiro.");
      return;
    }

    if (!selectedTime) {
      toast.error("Selecione um horário disponível.");
      return;
    }

    try {
      await bookAppointment({
        patientId: patient._id,
        date: selectedDate,
        time: selectedTime,
        treatmentType,
        sessionType: appointmentType,
        duration: sessionDuration,
      });
      
      toast.success("Consulta agendada com sucesso!");
      setPatientEmail("");
      setSelectedTime("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao agendar consulta");
    }
  };

  const handleAddSlot = async () => {
    if (!selectedDate || !newSlotTime) {
      toast.error("Selecione uma data e horário.");
      return;
    }

    try {
      await createSingleSlot({
        date: selectedDate,
        times: [newSlotTime],
        duration: newSlotDuration,
      });
      toast.success("Horário adicionado com sucesso!");
      setNewSlotTime("");
    } catch (error) {
      toast.error("Erro ao adicionar horário");
    }
  };

  const handleDeleteSlot = async (slotId: Id<"availableSlots">) => {
    try {
      await deleteSlot({ slotId });
      toast.success("Horário removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover horário");
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 7; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Manage Available Slots */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciar Horários Disponíveis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div>
            <label htmlFor="slotDate" className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              id="slotDate"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Add New Slot */}
          {selectedDate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newSlotTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Horário
                  </label>
                  <select
                    id="newSlotTime"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {generateTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="newSlotDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (min)
                  </label>
                  <select
                    id="newSlotDuration"
                    value={newSlotDuration}
                    onChange={(e) => setNewSlotDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                    <option value={150}>150 min</option>
                    <option value={180}>180 min</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddSlot}
                disabled={!newSlotTime}
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar Horário
              </button>
            </div>
          )}
        </div>

        {/* Available Slots Display */}
        {selectedDate && availableSlots && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Horários para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </h3>
            
            {availableSlots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum horário disponível</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-green-800">{slot.time}</div>
                      <div className="text-green-600">{slot.duration || 60}min</div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remover horário"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Appointment */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Agendar Consulta</h2>
        
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail do Paciente *
              </label>
              <input
                type="email"
                id="patientEmail"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o e-mail do paciente"
              />
              {patient && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Paciente encontrado: {patient.fullName}
                </p>
              )}
              {patientEmail && !patient && (
                <p className="mt-1 text-sm text-red-600">
                  Paciente não encontrado. Cadastre primeiro.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="treatmentType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Tratamento *
              </label>
              <select
                id="treatmentType"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Psicanálise">Psicanálise</option>
                <option value="TALT">TALT</option>
                <option value="Regressão de Memória">Regressão de Memória</option>
              </select>
            </div>

            <div>
              <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade *
              </label>
              <select
                id="appointmentType"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as "online" | "presencial")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Duração Prevista (min) *
              </label>
              <select
                id="sessionDuration"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
                <option value={150}>150 minutos</option>
                <option value={180}>180 minutos</option>
              </select>
            </div>
          </div>

          {selectedDate && availableSlots && availableSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário Disponível *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>{slot.time}</div>
                    <div className="text-xs opacity-75">{slot.duration || 60}min</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!patient || !selectedTime}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Agendar Consulta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
