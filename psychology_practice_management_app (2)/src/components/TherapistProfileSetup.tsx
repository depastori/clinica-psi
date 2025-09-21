import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function TherapistProfileSetup() {
  const profile = useQuery(api.therapistProfiles.getTherapistProfile);
  const [isEditing, setIsEditing] = useState(!profile);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    profession: profile?.profession || "Psicóloga",
    crpNumber: profile?.crpNumber || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    // specialties: profile?.specialties || [],
    // bio: profile?.bio || "",
  });

  const createOrUpdateProfile = useMutation(api.therapistProfiles.createOrUpdateTherapistProfile);
  const generateUploadUrl = useMutation(api.therapistProfiles.generateUploadUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let logoStorageId = profile?.logoStorageId;

      // Upload logo if a new file was selected
      if (logoFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        
        if (!result.ok) {
          throw new Error("Falha no upload da logo");
        }
        
        const { storageId } = await result.json();
        logoStorageId = storageId;
      }

      await createOrUpdateProfile({
        ...formData,
        logoStorageId,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
      });

      toast.success("Perfil salvo com sucesso!");
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      toast.error("Erro ao salvar perfil");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialtyAdd = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  // const handleSpecialtyRemove = (specialty: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     specialties: prev.specialties.filter(s => s !== specialty)
  //   }));
  // };

  if (!isEditing && profile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Perfil Profissional</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Editar Perfil
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <p className="mt-1 text-sm text-gray-900">{profile.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profissão</label>
              <p className="mt-1 text-sm text-gray-900">{profile.profession}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CRP</label>
              <p className="mt-1 text-sm text-gray-900">{profile.crpNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
            </div>
            {profile.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {profile.logoStorageId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <img 
                  src="#" 
                  alt="Logo" 
                  className="w-32 h-32 object-contain border rounded-lg"
                />
              </div>
            )}
            {/* profile.specialties && profile.specialties.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidades</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {/* profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  )) */}
                </div>
              </div>
            )}
            {profile.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Biografia</label>
                <p className="mt-1 text-sm text-gray-900">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {profile ? 'Editar Perfil Profissional' : 'Configurar Perfil Profissional'}
        </h2>
        {profile && (
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
              Profissão *
            </label>
            <input
              type="text"
              id="profession"
              required
              value={formData.profession}
              onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="crpNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número do CRP *
            </label>
            <input
              type="text"
              id="crpNumber"
              required
              value={formData.crpNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, crpNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 06/123456"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
              Logo
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Escolher Arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              {logoPreview && (
                <img 
                  src={logoPreview} 
                  alt="Preview" 
                  className="w-16 h-16 object-contain border rounded"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <textarea
            id="address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialidades
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => handleSpecialtyRemove(specialty)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite uma especialidade"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSpecialtyAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleSpecialtyAdd(input.value);
                input.value = '';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Biografia
          </label>
          <textarea
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Conte um pouco sobre sua formação e experiência..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Perfil
          </button>
        </div>
      </form>
    </div>
  );
}
