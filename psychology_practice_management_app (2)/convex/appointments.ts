import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createAppointment = mutation({
  args: {
    patientId: v.id("patients"),
    date: v.string(),
    time: v.string(),
    duration: v.optional(v.number()),
    treatmentType: v.string(),
    sessionType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    return await ctx.db.insert("appointments", {
      therapistId,
      ...args,
      status: "scheduled",
      createdAt: Date.now(),
    });
  },
});

export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    duration: v.optional(v.number()),
    treatmentType: v.optional(v.string()),
    sessionType: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("missed")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const { appointmentId, ...updateData } = args;
    const appointment = await ctx.db.get(appointmentId);
    
    if (!appointment || appointment.therapistId !== therapistId) {
      throw new Error("Agendamento não encontrado");
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(appointmentId, cleanUpdateData);
    return appointmentId;
  },
});

export const deleteAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      throw new Error("Usuário não autenticado");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.therapistId !== therapistId) {
      throw new Error("Agendamento não encontrado");
    }

    await ctx.db.delete(args.appointmentId);
    return args.appointmentId;
  },
});

export const listAppointments = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .order("desc")
      .collect();

    // Get patient names
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        return {
          ...appointment,
          patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
        };
      })
    );

    return appointmentsWithPatients;
  },
});

export const getTodayAppointments = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.eq("therapistId", therapistId).eq("date", today))
      .collect();

    // Get patient names
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        return {
          ...appointment,
          patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
        };
      })
    );

    return appointmentsWithPatients.sort((a, b) => a.time.localeCompare(b.time));
  },
});

export const getWeekAppointments = query({
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    // Get patient names
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        return {
          ...appointment,
          patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
        };
      })
    );

    return appointmentsWithPatients;
  },
});

export const getAppointmentsByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.eq("therapistId", therapistId).eq("date", args.date))
      .collect();

    // Get patient names
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        return {
          ...appointment,
          patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
        };
      })
    );

    return appointmentsWithPatients.sort((a, b) => a.time.localeCompare(b.time));
  },
});

export const getAppointmentsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .filter((q) => q.eq(q.field("therapistId"), therapistId))
      .order("desc")
      .collect();

    return appointments;
  },
});

export const getAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return null;
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.therapistId !== therapistId) {
      return null;
    }

    const patient = await ctx.db.get(appointment.patientId);
    
    return {
      ...appointment,
      patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
    };
  },
});

export const getAppointmentsByTherapist = query({
  args: {},
  handler: async (ctx) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) {
      return [];
    }

    return await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .order("desc")
      .collect();
  },
});
