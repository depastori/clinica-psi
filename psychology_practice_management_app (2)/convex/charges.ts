import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ===== QUERIES =====

/**
 * Lista todas as cobranças do terapeuta com filtros
 */
export const listCharges = query({
  args: {
    patientId: v.optional(v.id("patients")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"), 
      v.literal("overdue"),
      v.literal("cancelled")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    // Busca cobranças do terapeuta
    let query = ctx.db.query("charges").withIndex("by_therapist", (q) => 
      q.eq("therapistId", userId)
    );

    const charges = await query
      .filter((q) => {
        let conditions = [];
        
        if (args.patientId) {
          conditions.push(q.eq(q.field("patientId"), args.patientId));
        }
        
        if (args.status) {
          conditions.push(q.eq(q.field("status"), args.status));
        }

        if (args.startDate) {
          conditions.push(q.gte(q.field("dueDate"), args.startDate));
        }
        
        if (args.endDate) {
          conditions.push(q.lte(q.field("dueDate"), args.endDate));
        }
        
        return conditions.length > 0 ? q.and(...conditions) : undefined;
      })
      .order("desc")
      .collect();

    // Enriquecer dados com informações do paciente e consultas
    const enrichedCharges = await Promise.all(
      charges.map(async (charge) => {
        const patient = await ctx.db.get(charge.patientId);
        
        // Buscar datas das consultas relacionadas
        const appointmentDates = await Promise.all(
          charge.appointmentIds.map(async (appointmentId) => {
            const appointment = await ctx.db.get(appointmentId);
            return appointment ? new Date(appointment.scheduledTime).toLocaleDateString('pt-BR') : '';
          })
        );

        // Verificar se está vencida
        const now = Date.now();
        let status = charge.status;
        if (status === "pending" && charge.dueDate < now) {
          status = "overdue";
          // Atualizar status no banco
          await ctx.db.patch(charge._id, { status: "overdue" });
        }

        return {
          ...charge,
          patientName: patient?.fullName || "Paciente não encontrado",
          appointmentDates: appointmentDates.filter(date => date !== ''),
          status,
        };
      })
    );

    return enrichedCharges;
  },
});

/**
 * Busca uma cobrança específica com todos os detalhes
 */
export const getCharge = query({
  args: { chargeId: v.id("charges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");
    
    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) return null;

    const patient = await ctx.db.get(charge.patientId);
    const therapistProfile = await ctx.db.query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    // Buscar detalhes das consultas
    const appointmentDetails = await Promise.all(
      charge.appointmentIds.map(async (appointmentId) => {
        const appointment = await ctx.db.get(appointmentId);
        if (!appointment) return null;
        
        const date = new Date(appointment.scheduledTime);
        return {
          date: date.toLocaleDateString('pt-BR'),
          time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: appointment.status,
          price: appointment.price || 0,
        };
      })
    );

    return {
      ...charge,
      patientName: patient?.fullName || "Paciente não encontrado",
      patientEmail: patient?.email,
      appointmentDetails: appointmentDetails.filter(detail => detail !== null),
      therapistProfile: {
        name: therapistProfile?.fullName || "Terapeuta",
        crp: therapistProfile?.crpNumber,
        logo: therapistProfile?.logoStorageId,
        address: therapistProfile?.address,
        phone: therapistProfile?.phone,
      },
    };
  },
});

/**
 * Busca pacientes por nome (para autocomplete na cobrança manual)
 */
export const searchPatientsByName = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const patients = await ctx.db.query("patients")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filtro manual por nome (Convex não tem busca parcial nativa)
    const filteredPatients = patients.filter(patient => 
      patient.fullName.toLowerCase().includes(args.searchTerm.toLowerCase())
    );

    return filteredPatients.slice(0, 10).map(patient => ({
      _id: patient._id,
      name: patient.fullName,
      email: patient.email,
    }));
  },
});

// ===== MUTATIONS =====

/**
 * Cria cobrança manual (associando pelo nome do paciente)
 */
export const createManualCharge = mutation({
  args: {
    patientName: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.optional(v.union(v.literal("BRL"), v.literal("EUR"))),
    dueDate: v.number(),
    paymentOptions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    // Buscar paciente pelo nome
    const patients = await ctx.db.query("patients")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.eq(q.field("fullName"), args.patientName))
      .collect();

    const patient = patients[0];
    if (!patient) {
      throw new Error(`Paciente "${args.patientName}" não encontrado`);
    }

    // Buscar métodos de pagamento disponíveis
    let paymentOptions = args.paymentOptions || [];
    if (paymentOptions.length === 0) {
      const paymentMethods = await ctx.db.query("paymentMethods")
        .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      paymentOptions = paymentMethods.map(pm => pm.name);
    }

    // Gerar número sequencial da cobrança
    const existingCharges = await ctx.db.query("charges")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();
    
    const chargeNumber = `COB-${String(existingCharges.length + 1).padStart(4, '0')}`;

    const chargeId = await ctx.db.insert("charges", {
      therapistId: userId,
      patientId: patient._id,
      appointmentIds: [], // Cobrança manual não tem consultas associadas
      description: args.description,
      amount: args.amount,
      currency: args.currency || "BRL",
      dueDate: args.dueDate,
      status: "pending",
      paymentOptions,
      chargeNumber,
      isManual: true,
      createdAt: Date.now(),
    });

    return { chargeId, chargeNumber };
  },
});

/**
 * Cria cobrança automática baseada em consultas
 */
export const createAutomaticCharge = mutation({
  args: {
    patientId: v.id("patients"),
    appointmentIds: v.array(v.id("appointments")),
    description: v.optional(v.string()),
    daysUntilDue: v.optional(v.number()), // Padrão: 7 dias
    currency: v.optional(v.union(v.literal("BRL"), v.literal("EUR"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    // Verificar se o paciente pertence ao terapeuta
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.therapistId !== userId) {
      throw new Error("Paciente não encontrado ou não pertence a este terapeuta");
    }

    // Buscar consultas e calcular valor total
    let totalAmount = 0;
    const appointmentDates: string[] = [];
    
    for (const appointmentId of args.appointmentIds) {
      const appointment = await ctx.db.get(appointmentId);
      if (appointment && appointment.therapistId === userId) {
        // Usar preço da consulta ou preço padrão do paciente
        const sessionPrice = appointment.price || patient.sessionPrice || 150;
        totalAmount += sessionPrice;
        appointmentDates.push(new Date(appointment.scheduledTime).toLocaleDateString('pt-BR'));
      }
    }

    if (totalAmount === 0) {
      throw new Error("Nenhuma consulta válida encontrada ou valores não definidos");
    }

    // Buscar formas de pagamento do terapeuta
    const paymentMethods = await ctx.db.query("paymentMethods")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const paymentOptions = paymentMethods.map(pm => pm.name);

    // Calcular data de vencimento
    const daysUntilDue = args.daysUntilDue || 7;
    const dueDate = Date.now() + (daysUntilDue * 24 * 60 * 60 * 1000);

    // Gerar número sequencial da cobrança
    const existingCharges = await ctx.db.query("charges")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();
    
    const chargeNumber = `COB-${String(existingCharges.length + 1).padStart(4, '0')}`;

    // Descrição automática
    const description = args.description || 
      `Cobrança referente às sessões dos dias: ${appointmentDates.join(', ')}`;

    const chargeId = await ctx.db.insert("charges", {
      therapistId: userId,
      patientId: args.patientId,
      appointmentIds: args.appointmentIds,
      description,
      amount: totalAmount,
      currency: args.currency || patient.currency || "BRL",
      dueDate,
      status: "pending",
      paymentOptions,
      chargeNumber,
      isManual: false,
      createdAt: Date.now(),
    });

    return { chargeId, chargeNumber };
  },
});

/**
 * Marca cobrança como paga e gera recibo automaticamente
 */
export const markChargeAsPaid = mutation({
  args: {
    chargeId: v.id("charges"),
    paymentMethod: v.string(),
    paymentDate: v.optional(v.number()), // Se não informado, usa data atual
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");
    
    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) {
      throw new Error("Cobrança não encontrada");
    }

    if (charge.status === "paid") {
      throw new Error("Esta cobrança já foi paga");
    }

    // Atualizar status da cobrança
    await ctx.db.patch(args.chargeId, {
      status: "paid",
      paidAt: args.paymentDate || Date.now(),
    });

    // Gerar recibo automaticamente
    const paymentDate = args.paymentDate || Date.now();
    
    // Buscar número sequencial para o recibo
    const existingReceipts = await ctx.db.query("receipts")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();
    
    const receiptNumber = `REC-${String(existingReceipts.length + 1).padStart(4, '0')}`;

    const receiptId = await ctx.db.insert("receipts", {
      therapistId: userId,
      patientId: charge.patientId,
      chargeId: args.chargeId,
      appointmentIds: charge.appointmentIds,
      receiptNumber,
      description: charge.description,
      amount: charge.amount,
      currency: charge.currency,
      paymentDate,
      paymentMethod: args.paymentMethod,
      createdAt: Date.now(),
    });

    return {
      chargeId: args.chargeId,
      receiptId,
      receiptNumber,
    };
  },
});

/**
 * Cancela uma cobrança
 */
export const cancelCharge = mutation({
  args: {
    chargeId: v.id("charges"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");
    
    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) {
      throw new Error("Cobrança não encontrada");
    }

    if (charge.status === "paid") {
      throw new Error("Não é possível cancelar uma cobrança já paga");
    }

    await ctx.db.patch(args.chargeId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

/**
 * Deleta uma cobrança (com confirmação)
 */
export const deleteCharge = mutation({
  args: {
    chargeId: v.id("charges"),
    confirmDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDelete) {
      throw new Error("Confirmação necessária para deletar cobrança");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");
    
    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) {
      throw new Error("Cobrança não encontrada");
    }

    if (charge.status === "paid") {
      throw new Error("Não é possível deletar uma cobrança já paga. Cancele-a primeiro.");
    }

    await ctx.db.delete(args.chargeId);
    return { success: true };
  },
});

/**
 * Gera HTML da cobrança para visualização/PDF
 */
export const generateChargeHTML = mutation({
  args: {
    chargeId: v.id("charges"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado");

    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) {
      throw new Error("Cobrança não encontrada");
    }

    const patient = await ctx.db.get(charge.patientId);
    if (!patient) throw new Error("Paciente não encontrado");

    // Get therapist profile
    const therapistProfile = await ctx.db
      .query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    // Get sessions details if available
    let sessionsDetails: any[] = [];
    if (charge.appointmentIds && charge.appointmentIds.length > 0) {
      const sessionPromises = await Promise.all(
        charge.appointmentIds.map(async (appointmentId) => {
          const appointment = await ctx.db.get(appointmentId);
          if (appointment) {
            return {
              date: appointment.date,
              time: appointment.time,
              duration: appointment.duration || 60,
              treatmentType: appointment.treatmentType,
              sessionType: appointment.sessionType,
              price: appointment.price || 0,
            };
          }
          return null;
        })
      );
      sessionsDetails = sessionPromises.filter(Boolean);
    }

    const chargeData = {
      chargeNumber: charge.chargeNumber,
      issueDate: new Date(charge.createdAt).toISOString().split('T')[0],
      dueDate: new Date(charge.dueDate).toISOString().split('T')[0],
      patient: {
        name: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
      },
      therapist: {
        name: therapistProfile?.fullName || "Débora Pastori",
        profession: therapistProfile?.profession || "Psicóloga",
        crp: therapistProfile?.crpNumber || "[Número do CRP]",
        email: therapistProfile?.email || "",
        phone: therapistProfile?.phone || "",
        address: therapistProfile?.address || "",
        logoUrl: therapistProfile?.logoStorageId ? await ctx.storage.getUrl(therapistProfile.logoStorageId) : null,
      },
      charge: {
        id: charge._id,
        description: charge.description,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        paymentOptions: charge.paymentOptions,
        isManual: charge.isManual,
      },
      sessions: sessionsDetails,
      totalHours: sessionsDetails.reduce((total, session) => total + (session?.duration || 60), 0) / 60,
    };

    const html = generateChargeHTMLTemplate(chargeData);
    
    return {
      html,
      chargeNumber: chargeData.chargeNumber,
      filename: `cobranca-${chargeData.chargeNumber}.html`,
      chargeData,
    };
  },
});

/**
 * Calcula valor automático baseado em consultas
 */
export const calculateChargeAmount = mutation({
  args: {
    patientId: v.id("patients"),
    appointmentIds: v.array(v.id("appointments")),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Paciente não encontrado");

    // Get payment settings
    const settings = await ctx.db
      .query("paymentSettings")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    const hourlyRate = args.currency === "BRL" 
      ? (settings?.sessionPriceBRL || patient.sessionPrice || 150)
      : (settings?.sessionPriceEUR || 80);

    // Get appointments and calculate total
    const appointments = await Promise.all(
      args.appointmentIds.map(id => ctx.db.get(id))
    );

    let totalMinutes = 0;
    let sessionDetails = [];

    for (const appointment of appointments) {
      if (appointment && appointment.status === "completed") {
        const duration = appointment.duration || 60;
        totalMinutes += duration;
        
        sessionDetails.push({
          date: appointment.date,
          time: appointment.time,
          duration,
          treatmentType: appointment.treatmentType,
          sessionType: appointment.sessionType,
        });
      }
    }

    const totalHours = totalMinutes / 60;
    const totalAmount = totalHours * hourlyRate;

    const sessionDetailsText = sessionDetails
      .map(s => `${new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')} às ${s.time} - ${s.duration}min (${s.treatmentType} - ${s.sessionType})`)
      .join('\n');

    return {
      totalHours,
      totalMinutes,
      hourlyRate,
      totalAmount,
      sessionDetails: sessionDetailsText,
      sessionsCount: sessionDetails.length,
    };
  },
});

// ===== HELPER FUNCTIONS =====

function generateChargeHTMLTemplate(chargeData: any): string {
  const currencySymbol = chargeData.charge.currency === 'EUR' ? '€' : 'R$';
  const logoSection = chargeData.therapist.logoUrl 
    ? `<img src="${chargeData.therapist.logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 10px;">`
    : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cobrança - ${chargeData.chargeNumber}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 30px;
          border-radius: 10px;
        }
        .header h1 {
          color: #2563eb;
          margin: 10px 0;
          font-size: 28px;
        }
        .header h2 {
          color: #475569;
          margin: 5px 0;
          font-weight: 400;
        }
        .charge-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          gap: 30px;
        }
        .info-section {
          flex: 1;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .info-section h3 { 
          color: #2563eb; 
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .info-section p {
          margin: 8px 0;
          font-size: 14px;
        }
        .section { 
          margin-bottom: 30px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .section-header {
          background: #2563eb;
          color: white;
          padding: 15px 20px;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .section-content {
          padding: 20px;
        }
        .sessions-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 14px;
        }
        .sessions-table th, .sessions-table td { 
          border: 1px solid #e2e8f0; 
          padding: 12px 8px; 
          text-align: left; 
        }
        .sessions-table th { 
          background-color: #f1f5f9; 
          font-weight: 600;
          color: #475569;
        }
        .sessions-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .amount-section {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          margin: 30px 0;
        }
        .amount-section h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .amount-section .amount {
          font-size: 32px;
          font-weight: bold;
          margin: 10px 0;
        }
        .payment-info {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .payment-info h4 {
          color: #92400e;
          margin-top: 0;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 12px; 
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }
        .status-overdue {
          background: #fee2e2;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoSection}
        <h1>COBRANÇA DE SERVIÇOS</h1>
        <h2>${chargeData.therapist.name}</h2>
        <p>${chargeData.therapist.profession} - CRP: ${chargeData.therapist.crp}</p>
        <p style="margin-top: 15px;"><strong>Cobrança Nº:</strong> ${chargeData.chargeNumber}</p>
        <span class="status-badge status-${chargeData.charge.status}">
          ${chargeData.charge.status === 'pending' ? 'Pendente' : 
            chargeData.charge.status === 'paid' ? 'Pago' : 
            chargeData.charge.status === 'overdue' ? 'Vencido' : 'Cancelado'}
        </span>
      </div>

      <div class="charge-info">
        <div class="info-section">
          <h3>📋 Dados do Paciente</h3>
          <p><strong>Nome:</strong> ${chargeData.patient.name}</p>
          <p><strong>E-mail:</strong> ${chargeData.patient.email}</p>
          <p><strong>Telefone:</strong> ${chargeData.patient.phone}</p>
          ${chargeData.patient.address ? `<p><strong>Endereço:</strong> ${chargeData.patient.address}</p>` : ''}
        </div>
        <div class="info-section">
          <h3>📅 Informações da Cobrança</h3>
          <p><strong>Data de Emissão:</strong> ${new Date(chargeData.issueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p><strong>Vencimento:</strong> ${new Date(chargeData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p><strong>Tipo:</strong> ${chargeData.charge.isManual ? 'Manual' : 'Automática'}</p>
          <p><strong>Sessões:</strong> ${chargeData.sessions.length} sessão${chargeData.sessions.length !== 1 ? 'ões' : ''}</p>
          ${chargeData.totalHours > 0 ? `<p><strong>Total de Horas:</strong> ${chargeData.totalHours.toFixed(2)}h</p>` : ''}
        </div>
      </div>

      <div class="section">
        <h3 class="section-header">💼 Descrição dos Serviços</h3>
        <div class="section-content">
          <p><strong>Serviço:</strong> ${chargeData.charge.description}</p>
          
          ${chargeData.sessions.length > 0 ? `
            <table class="sessions-table">
              <thead>
                <tr>
                  <th>📅 Data</th>
                  <th>🕐 Horário</th>
                  <th>⏱️ Duração</th>
                  <th>🎯 Tipo</th>
                  <th>💻 Modalidade</th>
                  <th>💰 Valor</th>
                </tr>
              </thead>
              <tbody>
                ${chargeData.sessions.map((session: any) => `
                  <tr>
                    <td>${new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>${session.time}</td>
                    <td>${session.duration} min</td>
                    <td>${session.treatmentType}</td>
                    <td>${session.sessionType}</td>
                    <td>${currencySymbol} ${session.price.toFixed(2).replace('.', ',')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </div>
      </div>

      <div class="amount-section">
        <h3>💰 Valor Total a Pagar</h3>
        <div class="amount">${currencySymbol} ${chargeData.charge.amount.toFixed(2).replace('.', ',')}</div>
        <p>Valor referente a ${chargeData.sessions.length} sessão${chargeData.sessions.length !== 1 ? 'ões' : ''} de ${chargeData.therapist.profession.toLowerCase()}</p>
      </div>

      ${chargeData.charge.status === 'pending' ? `
        <div class="payment-info">
          <h4>💳 Informações para Pagamento</h4>
          <p><strong>Vencimento:</strong> ${new Date(chargeData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p><strong>Formas de Pagamento Aceitas:</strong></p>
          <ul>
            ${chargeData.charge.paymentOptions.map((option: string) => `<li>${option}</li>`).join('')}
          </ul>
          <p><em>Após o pagamento, envie o comprovante para confirmação.</em></p>
        </div>
      ` : ''}

      <div class="section">
        <h3 class="section-header">👩‍⚕️ Dados do Profissional</h3>
        <div class="section-content">
          <p><strong>Nome:</strong> ${chargeData.therapist.name}</p>
          <p><strong>Profissão:</strong> ${chargeData.therapist.profession}</p>
          <p><strong>CRP:</strong> ${chargeData.therapist.crp}</p>
          ${chargeData.therapist.email ? `<p><strong>E-mail:</strong> ${chargeData.therapist.email}</p>` : ''}
          ${chargeData.therapist.phone ? `<p><strong>Telefone:</strong> ${chargeData.therapist.phone}</p>` : ''}
          ${chargeData.therapist.address ? `<p><strong>Endereço:</strong> ${chargeData.therapist.address}</p>` : ''}
        </div>
      </div>

      <div class="footer">
        <p>Esta cobrança refere-se aos serviços de ${chargeData.therapist.profession.toLowerCase()} prestados conforme acordado.</p>
        <p>Em caso de dúvidas, entre em contato através dos dados acima.</p>
        <p>Documento gerado automaticamente em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}
