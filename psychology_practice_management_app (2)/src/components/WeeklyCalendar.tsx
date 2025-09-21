import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface WeeklyCalendarProps {
  onSelectAppointment?: (appointmentId: Id<"appointments">) => void;
}

export default function WeeklyCalendar({ onSelectAppointment }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Get start of week (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // Get appointments for the week
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const appointments = useQuery(api.appointments.getAppointmentsByTherapist, {}) || [];
  const availableSlots = useQuery(api.availableSlots.getAllAvailableSlots) || [];

  // Filter appointments for current week
  const weekAppointments = appointments.filter(apt => 
    apt.date >= weekStartStr && apt.date <= weekEndStr
  );

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return weekAppointments.filter(apt => apt.date === dateStr);
  };

  // Get available slots for a specific date
  const getAvailableSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = new Date(dateStr).getDay();
    return availableSlots.filter(slot => slot.dayOfWeek === dayOfWeek && slot.isActive);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'appointment-scheduled';
      case 'completed':
        return 'appointment-completed';
      case 'cancelled':
        return 'appointment-cancelled';
      case 'missed':
        return 'appointment-cancelled';
      default:
        return 'appointment-scheduled';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Agenda Semanal</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Hoje
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center text-gray-600">
          {weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="calendar-grid">
        {/* Header */}
        {weekDays.map((date, index) => (
          <div key={index} className={`calendar-header ${isToday(date) ? 'bg-blue-100 text-blue-900' : ''}`}>
            <div className="font-semibold">{formatDayName(date)}</div>
            <div className="text-sm">{formatDate(date)}</div>
          </div>
        ))}

        {/* Calendar cells */}
        {weekDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const dayAvailableSlots = getAvailableSlotsForDate(date);
          
          return (
            <div key={index} className={`calendar-cell ${isToday(date) ? 'bg-blue-50' : ''}`}>
              {/* Appointments */}
              {dayAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  onClick={() => onSelectAppointment?.(appointment._id)}
                  className={`appointment-slot ${getStatusColor(appointment.status)}`}
                  title={`${appointment.time} - ${appointment.patientName} (${appointment.status})`}
                >
                  <div className="font-medium">{appointment.time}</div>
                  <div className="truncate">{appointment.patientName}</div>
                  <div className="text-xs opacity-75">
                    {appointment.treatmentType || appointment.sessionType}
                  </div>
                </div>
              ))}

              {/* Available slots */}
              {dayAvailableSlots.map((slot) => (
                <div
                  key={slot._id}
                  className="appointment-slot appointment-available"
                  title={`${slot.startTime} - Disponível (60min)`}
                >
                  <div className="font-medium">{slot.startTime}</div>
                  <div className="text-xs">Disponível</div>
                  <div className="text-xs opacity-75">60min</div>
                </div>
              ))}

              {/* Empty state */}
              {dayAppointments.length === 0 && dayAvailableSlots.length === 0 && (
                <div className="text-xs text-gray-400 text-center mt-4">
                  Sem horários
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 appointment-scheduled rounded"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 appointment-completed rounded"></div>
            <span>Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 appointment-cancelled rounded"></div>
            <span>Cancelado/Faltou</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 appointment-available rounded"></div>
            <span>Disponível</span>
          </div>
        </div>
      </div>
    </div>
  );
}
