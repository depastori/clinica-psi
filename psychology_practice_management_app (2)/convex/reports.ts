import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateSessionsReport = mutation({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    // Get appointments in date range
    let appointments = await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // Filter by patient if specified
    if (args.patientId) {
      appointments = appointments.filter(apt => apt.patientId === args.patientId);
    }

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

    const reportData = {
      totalSessions: appointments.length,
      completedSessions: appointments.filter(apt => apt.status === "completed").length,
      cancelledSessions: appointments.filter(apt => apt.status === "cancelled").length,
      missedSessions: appointments.filter(apt => apt.status === "missed").length,
      appointments: appointmentsWithPatients,
      dateRange: { startDate: args.startDate, endDate: args.endDate },
    };

    const reportId = await ctx.db.insert("reports", {
      therapistId: userId,
      type: "sessions",
      title: `Relatório de Sessões - ${args.startDate} a ${args.endDate}`,
      data: JSON.stringify(reportData),
      generatedAt: Date.now(),
    });

    return reportId;
  },
});

export const generatePaymentsReport = mutation({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    // Get invoices in date range
    let invoices = await ctx.db
      .query("invoices")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("paymentDate"), args.startDate),
          q.lte(q.field("paymentDate"), args.endDate)
        )
      )
      .collect();

    // Filter by patient if specified
    if (args.patientId) {
      invoices = invoices.filter(inv => inv.patientId === args.patientId);
    }

    // Get patient names
    const invoicesWithPatients = await Promise.all(
      invoices.map(async (invoice) => {
        const patient = await ctx.db.get(invoice.patientId);
        return {
          ...invoice,
          patientName: patient ? (patient.socialName || patient.fullName) : "Paciente não encontrado",
        };
      })
    );

    const totalRevenue = invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const reportData = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === "paid").length,
      pendingInvoices: invoices.filter(inv => inv.status === "pending").length,
      overdueInvoices: invoices.filter(inv => inv.status === "overdue").length,
      totalRevenue,
      invoices: invoicesWithPatients,
      dateRange: { startDate: args.startDate, endDate: args.endDate },
    };

    const reportId = await ctx.db.insert("reports", {
      therapistId: userId,
      type: "payments",
      title: `Relatório de Pagamentos - ${args.startDate} a ${args.endDate}`,
      data: JSON.stringify(reportData),
      generatedAt: Date.now(),
    });

    return reportId;
  },
});

export const generatePatientSummary = mutation({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== userId) {
      throw new Error("Paciente não encontrado");
    }

    // Get appointments
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    // Get clinical sessions
    const sessions = await ctx.db
      .query("clinicalSessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    // Get invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();

    const reportData = {
      patient: {
        name: patient.socialName || patient.fullName,
        email: patient.email,
        phone: patient.phone,
        createdAt: patient.createdAt,
      },
      appointments: {
        total: appointments.length,
        completed: appointments.filter(apt => apt.status === "completed").length,
        cancelled: appointments.filter(apt => apt.status === "cancelled").length,
        missed: appointments.filter(apt => apt.status === "missed").length,
      },
      sessions: sessions.map(session => ({
        date: new Date(session.createdAt).toISOString().split('T')[0],
        attendance: session.attendance,
        observations: session.clinicalObservations,
      })),
      financial: {
        totalInvoiced: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        totalPaid: invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0),
        pendingAmount: invoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.amount, 0),
      },
    };

    const reportId = await ctx.db.insert("reports", {
      therapistId: userId,
      type: "patient_summary",
      title: `Resumo do Paciente - ${patient.socialName || patient.fullName}`,
      data: JSON.stringify(reportData),
      generatedAt: Date.now(),
    });

    return reportId;
  },
});

export const getReports = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .order("desc")
      .collect();

    return reports.map(report => ({
      _id: report._id,
      type: report.type,
      title: report.title,
      generatedAt: report.generatedAt,
      data: report.data ? JSON.parse(report.data) : null,
    }));
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const report = await ctx.db.get(args.reportId);
    if (!report || report.therapistId !== userId) {
      return null;
    }

    return {
      ...report,
      data: report.data ? JSON.parse(report.data) : null,
    };
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report || report.therapistId !== userId) {
      throw new Error("Relatório não encontrado");
    }

    await ctx.db.delete(args.reportId);
    return args.reportId;
  },
});

export const generateSessionReport = generateSessionsReport;
export const generatePaymentReport = generatePaymentsReport;
