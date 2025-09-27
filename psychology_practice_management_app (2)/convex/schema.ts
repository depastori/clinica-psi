import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  patients: defineTable({
    therapistId: v.id("users"),
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
    isActive: v.optional(v.boolean()),
    inactivatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_email", ["email"])
    .index("by_active", ["therapistId", "isActive"]),

  appointments: defineTable({
    therapistId: v.id("users"),
    patientId: v.id("patients"),
    date: v.string(),
    time: v.string(),
    duration: v.optional(v.number()),
    treatmentType: v.string(),
    sessionType: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("missed")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_patient", ["patientId"])
    .index("by_date", ["therapistId", "date"])
    .index("by_status", ["therapistId", "status"]),

  clinicalSessions: defineTable({
    therapistId: v.id("users"),
    patientId: v.id("patients"),
    appointmentId: v.id("appointments"),
    attendance: v.union(v.literal("present"), v.literal("absent")),
    clinicalObservations: v.string(),
    freeNotes: v.string(),
    interventions: v.optional(v.string()),
    strategies: v.optional(v.string()),
    referrals: v.optional(v.string()),
    evolution: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_patient", ["patientId"])
    .index("by_appointment", ["appointmentId"]),

  therapistProfiles: defineTable({
    therapistId: v.id("users"),
    fullName: v.string(),
    profession: v.string(),
    crpNumber: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_therapist", ["therapistId"]),

  availableSlots: defineTable({
    therapistId: v.id("users"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    isActive: v.boolean(),
  }).index("by_therapist", ["therapistId"]),

  invoices: defineTable({
    therapistId: v.id("users"),
    patientId: v.id("patients"),
    amount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    ),
    paymentDate: v.string(),
    appointmentIds: v.optional(v.array(v.id("appointments"))),
    sessionDetails: v.optional(v.string()),
    paymentMethod: v.optional(v.union(
      v.literal("pix"),
      v.literal("cartao_credito"),
      v.literal("mbway"),
      v.literal("paypal"),
      v.literal("stripe"),
      v.literal("wise"),
      v.literal("revolut"),
      v.literal("manual")
    )),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["therapistId", "status"]),

  receipts: defineTable({
    therapistId: v.id("users"),
    patientId: v.id("patients"),
    amount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    description: v.string(),
    paymentMethod: v.union(
      v.literal("pix"),
      v.literal("cartao_credito"),
      v.literal("mbway"),
      v.literal("paypal"),
      v.literal("stripe"),
      v.literal("wise"),
      v.literal("revolut"),
      v.literal("manual")
    ),
    appointmentIds: v.optional(v.array(v.id("appointments"))),
    sessionDetails: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    receiptNumber: v.string(),
    generatedAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_patient", ["patientId"]),

  paymentSettings: defineTable({
    therapistId: v.id("users"),
    sessionPriceBRL: v.number(),
    sessionPriceEUR: v.number(),
    pixKey: v.optional(v.string()),
    creditCardDetails: v.optional(v.string()),
    mbwayDetails: v.optional(v.string()),
    paypalDetails: v.optional(v.string()),
    stripeDetails: v.optional(v.string()),
    wiseDetails: v.optional(v.string()),
    revolutDetails: v.optional(v.string()),
    bankDetails: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
    autoGenerateInvoices: v.boolean(),
    defaultPaymentDate: v.number(),
  }).index("by_therapist", ["therapistId"]),

  packages: defineTable({
    therapistId: v.id("users"),
    patientId: v.id("patients"),
    name: v.string(),
    totalSessions: v.number(),
    usedSessions: v.number(),
    totalAmount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    purchaseDate: v.string(),
    expiryDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_therapist", ["therapistId"])
    .index("by_patient", ["patientId"]),

  reports: defineTable({
    therapistId: v.id("users"),
    type: v.union(
      v.literal("sessions"),
      v.literal("payments"),
      v.literal("patient_summary")
    ),
    title: v.string(),
    data: v.any(),
    generatedAt: v.number(),
  }).index("by_therapist", ["therapistId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,

  users: defineTable({
    username: v.optional(v.string()),   // Nome de usuário opcional
    email: v.optional(v.string()),      // Email opcional
    password: v.string(),               // Senha (armazenada como hash)
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),
});
