import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TherapistDashboard() {
  const activePatients = useQuery(api.patients.listActivePatients);
  const inactivePatients = useQuery(api.patients.listInactivePatients);
  const upcomingBirthdays = useQuery(api.patients.getUpcomingBirthdays);
  const todayAppointments = useQuery(api.appointments.getTodayAppointments);
  const weekAppointments = useQuery(api.appointments.getWeekAppointments);

  const totalPatients = (activePatients?.length || 0);
  const inactivePatientsCount = (inactivePatients?.length || 0);
  const todayCount = todayAppointments?.length || 0;
  const weekCount = weekAppointments?.length || 0;

  // Get birthdays for this month
  const thisMonthBirthdays = upcomingBirthdays?.filter(b => b.isThisMonth) || [];
  const upcomingBirthdaysNext30Days = upcomingBirthdays?.filter(b => b.daysUntil <= 30) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pacientes Ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pacientes Inativos</p>
              <p className="text-2xl font-semibold text-gray-900">{inactivePatientsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Consultas Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">{todayCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-2xl font-semibold text-gray-900">{weekCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Birthdays Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM3 10h18M7 15h1m4 0h1m4 0h1m1 0h1" />
              </svg>
              Aniversários
            </h2>
          </div>

          <div className="space-y-4">
            {/* This Month's Birthdays */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Este Mês ({new Date().toLocaleDateString('pt-BR', { month: 'long' })})
              </h3>
              {thisMonthBirthdays.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM3 10h18M7 15h1m4 0h1m4 0h1m1 0h1" />
                  </svg>
                  <p className="text-sm">Nenhum aniversário este mês</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {thisMonthBirthdays.map((birthday) => (
                    <div key={birthday.patientId} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div>
                        <p className="font-medium text-gray-900">{birthday.name}</p>
                        <p className="text-sm text-gray-600">
                          {birthday.birthDate && new Date(birthday.birthDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-pink-600">
                          {birthday.daysUntil === 0 ? 'Hoje!' : 
                           birthday.daysUntil === 1 ? 'Amanhã' : 
                           `${birthday.daysUntil} dias`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Birthdays (Next 30 days, excluding this month) */}
            {upcomingBirthdaysNext30Days.filter(b => !b.isThisMonth).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Próximos 30 dias</h3>
                <div className="space-y-2">
                  {upcomingBirthdaysNext30Days
                    .filter(b => !b.isThisMonth)
                    .slice(0, 3)
                    .map((birthday) => (
                      <div key={birthday.patientId} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{birthday.name}</p>
                          <p className="text-xs text-gray-600">
                            {birthday.birthDate && new Date(birthday.birthDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">{birthday.daysUntil} dias</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultas de Hoje</h2>
          
          {todayAppointments && todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patientName}</p>
                    <p className="text-sm text-gray-600">{appointment.treatmentType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{appointment.time}</p>
                    <p className="text-xs text-gray-500">{appointment.sessionType}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Nenhuma consulta agendada para hoje</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
        
        <div className="space-y-3">
          {activePatients && activePatients.slice(0, 5).map((patient) => (
            <div key={patient._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {(patient.socialName || patient.fullName).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {patient.socialName || patient.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Cadastrado em {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                Ativo
              </span>
            </div>
          ))}
          
          {(!activePatients || activePatients.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
