import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function ScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedSlotForDuration, setSelectedSlotForDuration] = useState<any>(null);
  const [duration, setDuration] = useState(60);

  const availableSlots = useQuery(api.availableSlots.getAvailableSlots, { dayOfWeek: new Date(selectedDate).getDay() });
  const createSlot = useMutation(api.availableSlots.createAvailableSlot);
  // const updateSlotDuration = useMutation(api.availableSlots.updateSlotDuration);
  const deleteSlot = useMutation(api.availableSlots.deleteAvailableSlot);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30"
  ];

  const handleTimeClick = (time: string) => {
    const existingSlot = availableSlots?.find(slot => slot.startTime === time);
    
    if (existingSlot) {
      if (!existingSlot.isActive) {
        toast.error("Este horário já está agendado e não pode ser removido");
        return;
      }
      // Remove existing slot
      handleDeleteSlot(existingSlot._id);
    } else {
      // Add to selected times
      setSelectedTimes(prev => 
        prev.includes(time) 
          ? prev.filter(t => t !== time)
          : [...prev, time]
      );
    }
  };

  const handleCreateSlots = async () => {
    try {
      for (const time of selectedTimes) {
        await createSlot({
          dayOfWeek: new Date(selectedDate).getDay(),
          startTime: time,
          endTime: time, // This should be calculated based on duration
        });
      }
      setSelectedTimes([]);
      toast.success("Horários criados com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar horários");
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

  const handleSetDuration = (slot: any) => {
    setSelectedSlotForDuration(slot);
    setDuration(slot.duration || 60);
    setShowDurationModal(true);
  };

  const handleUpdateDuration = async () => {
    if (!selectedSlotForDuration) return;
    
    try {
      await updateSlotDuration({
        slotId: selectedSlotForDuration._id,
        duration,
      });
      setShowDurationModal(false);
      setSelectedSlotForDuration(null);
      toast.success("Duração atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar duração");
    }
  };

  const isSlotAvailable = (time: string) => {
    return !availableSlots?.some(slot => slot.startTime === time);
  };

  const getSlotByTime = (time: string) => {
    return availableSlots?.find(slot => slot.startTime === time);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Gerenciar Horários</h2>
        
        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Data
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Horários para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </h3>
          
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {timeSlots.map((time) => {
              const slot = getSlotByTime(time);
              const isSelected = selectedTimes.includes(time);
              
              return (
                <button
                  key={time}
                  onClick={() => handleTimeClick(time)}
                  className={`p-2 text-sm rounded-md border transition-colors ${
                    slot
                      ? !slot.isActive
                        ? 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed'
                        : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                      : isSelected
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  disabled={!slot?.isActive}
                >
                  <div>{time}</div>
                  {slot && (
                    <div className="text-xs mt-1">
                      60min
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Criado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Agendado</span>
            </div>
          </div>
        </div>

        {selectedTimes.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Horários Selecionados ({selectedTimes.length})
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTimes.map((time) => (
                <span key={time} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  {time}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateSlots}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Horários
              </button>
              <button
                onClick={() => setSelectedTimes([])}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Limpar Seleção
              </button>
            </div>
          </div>
        )}

        {availableSlots && availableSlots.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Horários Criados</h4>
            <div className="space-y-2">
              {availableSlots.map((slot) => (
                <div key={slot._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{slot.startTime}</span>
                    <span className="text-sm text-gray-600">
                      60 minutos
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      !slot.isActive 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {!slot.isActive ? 'Inativo' : 'Disponível'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetDuration(slot)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Definir Duração
                    </button>
                    {slot.isActive && (
                      <button
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Duration Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Definir Duração - {selectedSlotForDuration?.time}
                </h3>
                <button
                  onClick={() => setShowDurationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (minutos)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDurationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateDuration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
