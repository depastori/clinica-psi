/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as availableSlots from "../availableSlots.js";
import type * as clinicalSessions from "../clinicalSessions.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as packages from "../packages.js";
import type * as patients from "../patients.js";
import type * as receipts from "../receipts.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";
import type * as therapistProfiles from "../therapistProfiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  appointments: typeof appointments;
  auth: typeof auth;
  availableSlots: typeof availableSlots;
  clinicalSessions: typeof clinicalSessions;
  http: typeof http;
  invoices: typeof invoices;
  packages: typeof packages;
  patients: typeof patients;
  receipts: typeof receipts;
  reports: typeof reports;
  router: typeof router;
  therapistProfiles: typeof therapistProfiles;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
