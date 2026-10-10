import type { DataSource } from "../repositories";
import type { AppNotification, AuthUser, Id, RoleKey, Store, UserSession } from "../types";
import { ApiError } from "../errors";
import { buildDashboard } from "./dashboard";
import { createMockSale, posCategories, posCustomers, posProducts, posTaxLines } from "./pos";
import {
  catalogBulkChangeCategory,
  catalogBulkDeactivate,
  catalogBulkUpdatePrice,
  catalogCreate,
  catalogGetById,
  catalogList,
  catalogSetStatus,
  catalogSummary,
  catalogUpdate,
  createBrand,
  createCategory,
  listBrands,
  listCategories,
  listTaxRates,
  removeBrand,
  removeCategory,
  updateBrand,
  updateCategory,
} from "./catalog";
import {
  cancelTransfer,
  createAdjustment,
  createTransfer,
  inventoryKpis,
  inventoryList,
  listMovements,
  listTransfers,
  receiveTransfer,
  shipTransfer,
} from "./inventory";
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  createSupplier,
  getPurchaseOrder,
  getSupplier,
  listPurchaseOrders,
  listSuppliers,
  purchaseKpis,
  receivePurchase,
  recordPurchasePayment,
  setSupplierStatus,
  submitPurchaseOrder,
  supplierHistory,
  updateSupplier,
} from "./purchasing";
import {
  createCustomer,
  getCustomer,
  listCustomers,
  setCustomerStatus,
  updateCustomer,
} from "./customers";
import { createRefund, getOrder, listOrders, ordersForCustomer, salesKpis } from "./sales";
import {
  createExpense,
  expenseKpis,
  listExpenses,
  removeExpense,
  updateExpense,
} from "./expenses";
import { getReport } from "./reports";
import {
  createEmployee,
  listEmployees,
  listRoles,
  setEmployeeStatus,
  toggleRolePermission,
  updateEmployee,
} from "./staff";
import {
  createStore,
  getStoreAdmin,
  listStoresAdmin,
  setStoreStatus,
  updateStore,
} from "./stores";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from "./notifications";
import { seedActiveStoreId, seedStores, seedTenant, seedUser } from "./seed";

// Simulate network latency in the browser so loading states are visible during
// development; resolve immediately under tests to keep them fast.
const SIMULATED_LATENCY_MS = 160;

function delay(): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

/** Deep clone so callers cannot mutate the shared seed data. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

function titleCase(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function deriveName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const name = titleCase(local);
  return name.length >= 2 ? name : "New User";
}

function makeUser(email: string, fullName: string, role: RoleKey = "store_manager"): AuthUser {
  return { id: `user_${email}`, email, fullName, role };
}

export function createMockDataSource(): DataSource {
  return {
    auth: {
      async login(email, password) {
        await delay();
        const normalized = email.trim().toLowerCase();
        if (normalized.startsWith("locked")) {
          throw new ApiError("FORBIDDEN", "This account is locked. Contact your administrator.", {
            status: 403,
          });
        }
        if (password === "wrong") {
          throw new ApiError("UNAUTHENTICATED", "Incorrect email or password.", { status: 401 });
        }
        return { user: makeUser(normalized, deriveName(normalized)), token: `mock.${Date.now()}` };
      },
      async signup(input) {
        await delay();
        const normalized = input.email.trim().toLowerCase();
        if (normalized === "taken@mozud.example") {
          throw new ApiError("CONFLICT", "An account with this email already exists.", {
            status: 409,
          });
        }
        return { user: makeUser(normalized, input.fullName), token: `mock.${Date.now()}` };
      },
      async requestPasswordReset() {
        await delay();
        // Always resolves — never reveals whether an email is registered.
      },
      async resetPassword(token) {
        await delay();
        if (!token) {
          throw new ApiError("VALIDATION_FAILED", "Invalid or expired reset link.", {
            status: 422,
          });
        }
      },
      async verifyEmail(token) {
        await delay();
        if (!token) {
          throw new ApiError("VALIDATION_FAILED", "Invalid or expired verification link.", {
            status: 422,
          });
        }
      },
    },
    session: {
      async getCurrentSession(): Promise<UserSession> {
        await delay();
        return clone({
          user: seedUser,
          tenant: seedTenant,
          stores: seedStores,
          activeStoreId: seedActiveStoreId,
        });
      },
    },
    stores: {
      async list(): Promise<Store[]> {
        await delay();
        return listStoresAdmin();
      },
      async getById(id: Id): Promise<Store | null> {
        await delay();
        return getStoreAdmin(id);
      },
      async create(input) {
        await delay();
        return createStore(input);
      },
      async update(id, input) {
        await delay();
        return updateStore(id, input);
      },
      async setStatus(id, status) {
        await delay();
        return setStoreStatus(id, status);
      },
    },
    notifications: {
      async list(): Promise<AppNotification[]> {
        await delay();
        return listNotifications();
      },
      async unreadCount(): Promise<number> {
        await delay();
        return unreadNotificationCount();
      },
      async markRead(id) {
        await delay();
        markNotificationRead(id);
      },
      async markAllRead() {
        await delay();
        markAllNotificationsRead();
      },
    },
    dashboard: {
      async getOverview({ storeId, range }) {
        await delay();
        return buildDashboard(storeId, range);
      },
    },
    pos: {
      async listProducts() {
        await delay();
        return posProducts();
      },
      async listCategories() {
        await delay();
        return posCategories();
      },
      async searchCustomers(query) {
        await delay();
        return posCustomers(query);
      },
      async getTaxLines() {
        await delay();
        return posTaxLines();
      },
      async createSale(input) {
        await delay();
        return createMockSale(input);
      },
    },
    products: {
      async list(params) {
        await delay();
        return catalogList(params);
      },
      async getById(id) {
        await delay();
        return catalogGetById(id);
      },
      async getSummary() {
        await delay();
        return catalogSummary();
      },
      async create(input) {
        await delay();
        return catalogCreate(input);
      },
      async update(id, input) {
        await delay();
        return catalogUpdate(id, input);
      },
      async setStatus(id, status) {
        await delay();
        return catalogSetStatus(id, status);
      },
      async bulkUpdatePrice(ids, adjustment) {
        await delay();
        return catalogBulkUpdatePrice(ids, adjustment);
      },
      async bulkChangeCategory(ids, categoryId) {
        await delay();
        return catalogBulkChangeCategory(ids, categoryId);
      },
      async bulkDeactivate(ids) {
        await delay();
        return catalogBulkDeactivate(ids);
      },
    },
    categories: {
      async list() {
        await delay();
        return listCategories();
      },
      async create(input) {
        await delay();
        return createCategory(input);
      },
      async update(id, input) {
        await delay();
        return updateCategory(id, input);
      },
      async remove(id) {
        await delay();
        removeCategory(id);
      },
    },
    brands: {
      async list() {
        await delay();
        return listBrands();
      },
      async create(input) {
        await delay();
        return createBrand(input);
      },
      async update(id, input) {
        await delay();
        return updateBrand(id, input);
      },
      async remove(id) {
        await delay();
        removeBrand(id);
      },
    },
    taxRates: {
      async list() {
        await delay();
        return listTaxRates();
      },
    },
    inventory: {
      async listItems(params) {
        await delay();
        return inventoryList(params);
      },
      async getKpis({ storeId }) {
        await delay();
        return inventoryKpis(storeId);
      },
      async listMovements(params) {
        await delay();
        return listMovements(params);
      },
      async createAdjustment(input) {
        await delay();
        return createAdjustment(input);
      },
      async listTransfers(params) {
        await delay();
        return listTransfers(params?.storeId);
      },
      async createTransfer(input) {
        await delay();
        return createTransfer(input);
      },
      async shipTransfer(id) {
        await delay();
        return shipTransfer(id);
      },
      async receiveTransfer(input) {
        await delay();
        return receiveTransfer(input);
      },
      async cancelTransfer(id) {
        await delay();
        return cancelTransfer(id);
      },
    },
    suppliers: {
      async list() {
        await delay();
        return listSuppliers();
      },
      async getById(id) {
        await delay();
        return getSupplier(id);
      },
      async history(id) {
        await delay();
        return supplierHistory(id);
      },
      async create(input) {
        await delay();
        return createSupplier(input);
      },
      async update(id, input) {
        await delay();
        return updateSupplier(id, input);
      },
      async setStatus(id, status) {
        await delay();
        return setSupplierStatus(id, status);
      },
    },
    purchases: {
      async list(params) {
        await delay();
        return listPurchaseOrders(params);
      },
      async getById(id) {
        await delay();
        return getPurchaseOrder(id);
      },
      async getKpis() {
        await delay();
        return purchaseKpis();
      },
      async create(input) {
        await delay();
        return createPurchaseOrder(input);
      },
      async submit(id) {
        await delay();
        return submitPurchaseOrder(id);
      },
      async receive(input) {
        await delay();
        return receivePurchase(input);
      },
      async recordPayment(id, amountMinor) {
        await delay();
        return recordPurchasePayment(id, amountMinor);
      },
      async cancel(id) {
        await delay();
        return cancelPurchaseOrder(id);
      },
    },
    customers: {
      async list() {
        await delay();
        return listCustomers().map((customer) => {
          const orders = ordersForCustomer(customer.id).filter((o) => o.status !== "voided");
          const spent = orders.reduce((sum, o) => sum + o.total.amountMinor, 0);
          return {
            ...customer,
            orderCount: orders.length,
            totalSpent: { amountMinor: spent, currency: customer.balance.currency },
          };
        });
      },
      async getById(id) {
        await delay();
        return getCustomer(id);
      },
      async create(input) {
        await delay();
        return createCustomer(input);
      },
      async update(id, input) {
        await delay();
        return updateCustomer(id, input);
      },
      async setStatus(id, status) {
        await delay();
        return setCustomerStatus(id, status);
      },
    },
    sales: {
      async list(params) {
        await delay();
        return listOrders(params);
      },
      async getById(id) {
        await delay();
        return getOrder(id);
      },
      async getKpis(params) {
        await delay();
        return salesKpis(params?.storeId);
      },
      async listForCustomer(customerId) {
        await delay();
        return ordersForCustomer(customerId);
      },
      async createRefund(input) {
        await delay();
        return createRefund(input);
      },
    },
    expenses: {
      async list(params) {
        await delay();
        return listExpenses(params);
      },
      async getKpis(params) {
        await delay();
        return expenseKpis(params?.storeId);
      },
      async create(input) {
        await delay();
        return createExpense(input);
      },
      async update(id, input) {
        await delay();
        return updateExpense(id, input);
      },
      async remove(id) {
        await delay();
        removeExpense(id);
      },
    },
    reports: {
      async get(key, params) {
        await delay();
        return getReport(key, params);
      },
    },
    staff: {
      async listEmployees() {
        await delay();
        return listEmployees();
      },
      async createEmployee(input) {
        await delay();
        return createEmployee(input);
      },
      async updateEmployee(id, input) {
        await delay();
        return updateEmployee(id, input);
      },
      async setEmployeeStatus(id, status) {
        await delay();
        return setEmployeeStatus(id, status);
      },
      async listRoles() {
        await delay();
        return listRoles();
      },
      async toggleRolePermission(roleId, permission, enabled) {
        await delay();
        return toggleRolePermission(roleId, permission, enabled);
      },
    },
  };
}
