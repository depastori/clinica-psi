import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function PackageManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sessionCount: 1,
    priceBRL: 0,
    priceEUR: 0,
    validityDays: 30,
    treatmentTypes: [] as ("Psicanálise" | "TALT" | "Regressão de Memória")[],
    sessionDuration: 60,
    isActive: true,
  });

  const packages = useQuery(api.packages.getPackages, {}) || [];
  const createPackage = useMutation(api.packages.createPackage);
  const updatePackage = useMutation(api.packages.updatePackage);
  const deletePackage = useMutation(api.packages.deletePackage);

  const treatmentOptions: ("Psicanálise" | "TALT" | "Regressão de Memória")[] = ["Psicanálise", "TALT", "Regressão de Memória"];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sessionCount: 1,
      priceBRL: 0,
      priceEUR: 0,
      validityDays: 30,
      treatmentTypes: [] as ("Psicanálise" | "TALT" | "Regressão de Memória")[],
      sessionDuration: 60,
      isActive: true,
    });
    setEditingPackage(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.treatmentTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de tratamento");
      return;
    }

    try {
      if (editingPackage) {
        await updatePackage({
          packageId: editingPackage._id,
          ...formData,
        });
        toast.success("Pacote atualizado com sucesso!");
      } else {
        await createPackage(formData);
        toast.success("Pacote criado com sucesso!");
      }
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar pacote");
    }
  };

  const handleEdit = (pkg: any) => {
    setFormData({
      name: pkg.name,
      description: pkg.description,
      sessionCount: pkg.sessionCount,
      priceBRL: pkg.priceBRL || 0,
      priceEUR: pkg.priceEUR || 0,
      validityDays: pkg.validityDays,
      treatmentTypes: pkg.treatmentTypes,
      sessionDuration: pkg.sessionDuration,
      isActive: pkg.isActive,
    });
    setEditingPackage(pkg);
    setShowCreateForm(true);
  };

  const handleDelete = async (packageId: Id<"packages">) => {
    if (confirm("Tem certeza que deseja excluir este pacote?")) {
      try {
        await deletePackage({ packageId });
        toast.success("Pacote excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir pacote");
      }
    }
  };

  const handleTreatmentTypeChange = (type: "Psicanálise" | "TALT" | "Regressão de Memória", checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      treatmentTypes: checked
        ? [...prev.treatmentTypes, type]
        : prev.treatmentTypes.filter(t => t !== type)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Pacotes</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Criar Novo Pacote
          </button>
        </div>

        {/* Package List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg._id} className={`package-card ${!pkg.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {pkg.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sessões:</span>
                  <span className="font-medium">{pkg.sessionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duração:</span>
                  <span className="font-medium">{pkg.sessionDuration}min</span>
                </div>
                <div className="flex justify-between">
                  <span>Validade:</span>
                  <span className="font-medium">{pkg.validityDays} dias</span>
                </div>
                {pkg.priceBRL && (
                  <div className="flex justify-between">
                    <span>Preço (BRL):</span>
                    <span className="font-medium">R$ {pkg.priceBRL.toFixed(2)}</span>
                  </div>
                )}
                {pkg.priceEUR && (
                  <div className="flex justify-between">
                    <span>Preço (EUR):</span>
                    <span className="font-medium">€ {pkg.priceEUR.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">Tipos de tratamento:</div>
                <div className="flex flex-wrap gap-1">
                  {pkg.treatmentTypes.map((type, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(pkg._id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum pacote criado ainda
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPackage ? 'Editar Pacote' : 'Criar Novo Pacote'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Pacote *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Sessões *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.sessionCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, sessionCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração da Sessão (min) *
                    </label>
                    <select
                      value={formData.sessionDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={90}>90 minutos</option>
                      <option value={120}>120 minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (BRL)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceBRL}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceBRL: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (EUR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceEUR}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceEUR: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validade (dias) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.validityDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, validityDays: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Pacote Ativo</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Tratamento *
                  </label>
                  <div className="space-y-2">
                    {treatmentOptions.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.treatmentTypes.includes(type)}
                          onChange={(e) => handleTreatmentTypeChange(type, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingPackage ? 'Atualizar' : 'Criar'} Pacote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
