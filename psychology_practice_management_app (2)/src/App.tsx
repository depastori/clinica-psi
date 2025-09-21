import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";

// Components
import TherapistDashboard from "./components/TherapistDashboard";
import PatientRegistration from "./components/PatientRegistration";
import PatientManagement from "./components/PatientManagement";
import TherapistProfileSetup from "./components/TherapistProfileSetup";
import ScheduleManagement from "./components/ScheduleManagement";
import AppointmentBooking from "./components/AppointmentBooking";
import PaymentManagement from "./components/PaymentManagement";
import BillingManagement from "./components/BillingManagement";
import PatientHistory from "./components/PatientHistory";

type ActiveView = 'dashboard' | 'patients' | 'patient-management' | 'profile' | 'schedule' | 'appointments' | 'payments' | 'billing' | 'history';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const user = useQuery(api.auth.loggedInUser);
  const therapistProfile = useQuery(api.therapistProfiles.getTherapistProfile);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <TherapistDashboard />;
      case 'patients':
        return <PatientRegistration />;
      case 'patient-management':
        return <PatientManagement />;
      case 'profile':
        return <TherapistProfileSetup />;
      case 'schedule':
        return <ScheduleManagement />;
      case 'appointments':
        return <AppointmentBooking />;
      case 'payments':
        return <PaymentManagement />;
      case 'billing':
        return <BillingManagement />;
      case 'history':
        return <PatientHistory />;
      default:
        return <TherapistDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sistema de Gestão Psicológica
              </h1>
              <p className="text-gray-600">
                Faça login para acessar sua conta
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                {therapistProfile?.logoStorageId && (
                  <img 
                    src="#" 
                    alt="Logo" 
                    className="w-10 h-10 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {therapistProfile?.fullName || user?.name || 'Psicóloga'}
                  </h2>
                  {therapistProfile?.crpNumber && (
                    <p className="text-sm text-gray-600">CRP: {therapistProfile.crpNumber}</p>
                  )}
                </div>
              </div>
            </div>

            <nav className="mt-6">
              <div className="px-3 space-y-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  Dashboard
                </button>

                <button
                  onClick={() => setActiveView('profile')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil Profissional
                </button>

                <button
                  onClick={() => setActiveView('patients')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'patients'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Cadastrar Paciente
                </button>

                <button
                  onClick={() => setActiveView('patient-management')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'patient-management'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Gerenciar Pacientes
                </button>

                <button
                  onClick={() => setActiveView('schedule')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'schedule'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gerenciar Horários
                </button>

                <button
                  onClick={() => setActiveView('appointments')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'appointments'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Agendamentos
                </button>

                <button
                  onClick={() => setActiveView('payments')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'payments'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Configurações de Pagamento
                </button>

                <button
                  onClick={() => setActiveView('billing')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'billing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  💰 Cobranças e Recibos
                </button>

                <button
                  onClick={() => setActiveView('history')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Histórico
                </button>
              </div>
            </nav>

            <div className="absolute bottom-0 w-64 p-4 border-t">
              <SignOutButton />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </Authenticated>
    </div>
  );
}
