import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPatient = mutation({
  args: {
    fullName: v.string(),
    socialName: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    birthDate: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    nationality: v.optional(v.string()),
    cpfOrId: v.optional(v.string()),
    address: v.optional(v.string()),
    mainComplaint: v.optional(v.string()),
    symptomDuration: v.optional(v.string()),
    mentalHealthHistory: v.optional(v.string()),
    medicationUse: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    familyHistory: v.optional(v.string()),
    hasDiagnosis: v.optional(v.boolean()),
    diagnosisDetails: v.optional(v.string()),
    treatmentType: v.optional(v.string()),
    sessionType: v.optional(v.string()),
    sessionDuration: v.optional(v.number()),
    agreedFrequency: v.optional(v.string()),
    firstSessionDate: v.optional(v.string()),
    sessionPrice: v.optional(v.number()),
    currency: v.optional(v.union(v.literal("BRL"), v.literal("EUR"))),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    return await ctx.db.insert("patients", {
      therapistId,
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updatePatient = mutation({
  args: {
    patientId: v.id("patients"),
    fullName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    nationality: v.optional(v.string()),
    cpfOrId: v.optional(v.string()),
    address: v.optional(v.string()),
    mainComplaint: v.optional(v.string()),
    symptomDuration: v.optional(v.string()),
    mentalHealthHistory: v.optional(v.string()),
    medicationUse: v.optional(v.string()),
    medicalHistory: v.optional(v.string()),
    familyHistory: v.optional(v.string()),
    hasDiagnosis: v.optional(v.boolean()),
    diagnosisDetails: v.optional(v.string()),
    treatmentType: v.optional(v.string()),
    sessionType: v.optional(v.string()),
    sessionDuration: v.optional(v.number()),
    agreedFrequency: v.optional(v.string()),
    firstSessionDate: v.optional(v.string()),
    sessionPrice: v.optional(v.number()),
    currency: v.optional(v.union(v.literal("BRL"), v.literal("EUR"))),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const { patientId, ...updateData } = args;
    const patient = await ctx.db.get(patientId);
    
    if (!patient || patient.therapistId !== therapistId) {
      throw new Error("Paciente não encontrado");
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(patientId, cleanUpdateData);
    return patientId;
  },
});

export const inactivatePatient = mutation({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== therapistId) {
      throw new Error("Paciente não encontrado");
    }

    await ctx.db.patch(args.patientId, {
      isActive: false,
      inactivatedAt: Date.now(),
    });

    return args.patientId;
  },
});

export const reactivatePatient = mutation({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== therapistId) {
      throw new Error("Paciente não encontrado");
    }

    await ctx.db.patch(args.patientId, {
      isActive: true,
      inactivatedAt: undefined,
    });

    return args.patientId;
  },
});

export const deletePatient = mutation({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== therapistId) {
      throw new Error("Paciente não encontrado");
    }

    // Check if patient has appointments or sessions
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    const sessions = await ctx.db
      .query("clinicalSessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    if (appointments.length > 0 || sessions.length > 0) {
      throw new Error("Não é possível excluir paciente com agendamentos ou sessões registradas. Considere inativar o paciente.");
    }

    await ctx.db.delete(args.patientId);
    return args.patientId;
  },
});

export const listActivePatients = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_active", (q) => q.eq("therapistId", therapistId).eq("isActive", true))
      .order("desc")
      .collect();
  },
});

export const listInactivePatients = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_active", (q) => q.eq("therapistId", therapistId).eq("isActive", false))
      .order("desc")
      .collect();
  },
});

export const listAllPatients = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .order("desc")
      .collect();
  },
});

export const getPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return null;
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== therapistId) {
      return null;
    }

    return patient;
  },
});

export const getUpcomingBirthdays = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_active", (q) => q.eq("therapistId", therapistId).eq("isActive", true))
      .collect();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const birthdays = patients
      .filter(patient => patient.birthDate)
      .map(patient => {
        const birthDate = new Date(patient.birthDate!);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        // Calculate next birthday
        let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
        if (nextBirthday < now) {
          nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
        }

        const daysUntil = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          patientId: patient._id,
          name: patient.socialName || patient.fullName,
          birthDate: patient.birthDate,
          nextBirthday: nextBirthday.toISOString().split('T')[0],
          daysUntil,
          isThisMonth: birthMonth === currentMonth,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return birthdays;
  },
});

export const searchPatients = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .collect();

    const searchTerm = args.searchTerm.toLowerCase();
    
    return patients.filter(patient => 
      patient.fullName.toLowerCase().includes(searchTerm) ||
      (patient.socialName && patient.socialName.toLowerCase().includes(searchTerm)) ||
      patient.email.toLowerCase().includes(searchTerm) ||
      patient.phone.includes(searchTerm)
    );
  },
});

export const getAllPatients = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .order("desc")
      .collect();
  },
});

export const getPatientByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return null;
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("therapistId"), therapistId))
      .first();
  },

  // Adicionar esta query no final do arquivo patients.ts
export const listPatients = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("patients")
      .withIndex("by_active", (q) => q.eq("therapistId", therapistId).eq("isActive", true))
      .order("desc")
      .collect();
  },
});
