import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { rentals, tools, customers, payments, tenants, users, toolCategories, expenses, maintenanceLogs } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { getPlanLimits } from '../lib/plan-limits';

export const createRentalSchema = z.object({
    toolId: z.string().uuid('Ferramenta inválida'),
    customerId: z.string().uuid('Cliente inválido'),
    startDate: z.string(),
    endDateExpected: z.string(),
    dailyRateAgreed: z.coerce.number().min(0),
    templateId: z.string().uuid().optional(),
    notes: z.string().optional(),
});

export const checkinSchema = z.object({
    endDateActual: z.string(),
    paymentMethod: z.enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer']),
    notes: z.string().optional(),
});

function daysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function generateRentalCode(tenantId: string): Promise<string> {
    const existingRentals = await db.select({ rentalCode: rentals.rentalCode }).from(rentals).where(eq(rentals.tenantId, tenantId));
    const maxNum = existingRentals.reduce((max, r) => {
        const num = parseInt(r.rentalCode.slice(2)) || 0;
        return Math.max(max, num);
    }, 0);
    return 'AL' + String(maxNum + 1).padStart(4, '0');
}

export async function listRentals(tenantId: string, filters: { status?: string; search?: string }) {
    const rows = await db.query.rentals.findMany({
        where: eq(rentals.tenantId, tenantId),
        with: {
            tool: { columns: { id: true, name: true, serialNumber: true } },
            customer: { columns: { id: true, fullName: true, phoneNumber: true } },
        },
        orderBy: [desc(rentals.createdAt)],
    });

    let result = rows;
    if (filters.status) result = result.filter((r) => r.status === filters.status);
    if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
            (r) =>
                r.rentalCode.toLowerCase().includes(s) ||
                r.tool?.name.toLowerCase().includes(s) ||
                r.customer?.fullName.toLowerCase().includes(s)
        );
    }
    return result;
}

export async function getRental(tenantId: string, id: string) {
    const rental = await db.query.rentals.findFirst({
        where: and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)),
        with: {
            tool: true,
            customer: true,
            payments: true,
        },
    });
    if (!rental) throw new AppError(404, 'Locação não encontrada');
    return rental;
}

export async function createRental(tenantId: string, userId: string, data: z.infer<typeof createRentalSchema>) {
    // Check tool availability
    const [tool] = await db.select().from(tools).where(and(eq(tools.tenantId, tenantId), eq(tools.id, data.toolId)));
    if (!tool) throw new AppError(404, 'Ferramenta não encontrada');
    if (tool.status !== 'available') throw new AppError(409, `Ferramenta não disponível (status: ${tool.status})`);

    // Check customer not blocked
    const [customer] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, data.customerId)));
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    if (customer.isBlocked) throw new AppError(403, 'Cliente bloqueado por inadimplência');

    const startDate = new Date(data.startDate);
    const endDateExpected = new Date(data.endDateExpected);
    const totalDaysExpected = daysBetween(startDate, endDateExpected);
    const totalAmountExpected = data.dailyRateAgreed * totalDaysExpected;
    const rentalCode = await generateRentalCode(tenantId);

    const rental = await db.transaction(async (tx) => {
        const [insertedRental] = await tx.insert(rentals).values({
            tenantId,
            toolId: data.toolId,
            customerId: data.customerId,
            rentalCode,
            startDate,
            endDateExpected,
            dailyRateAgreed: String(data.dailyRateAgreed),
            totalDaysExpected,
            totalAmountExpected: String(totalAmountExpected),
            status: 'active',
            templateId: data.templateId,
            checkoutBy: userId,
            notes: data.notes,
        }).returning();

        // Update tool status to rented
        await tx.update(tools).set({ status: 'rented', updatedAt: new Date() }).where(eq(tools.id, data.toolId));

        // Create pending payment record
        await tx.insert(payments).values({
            tenantId,
            rentalId: insertedRental.id,
            amount: String(totalAmountExpected),
            paymentDate: startDate,
            paymentMethod: 'pix',
            status: 'pending',
            receivedBy: userId,
            notes: 'Pagamento pendente criado na locação (Transação)',
        });

        return insertedRental;
    });

    console.log(`[RENTAL CREATE] Transaction successful for Rental ${rental.rentalCode}`);
    return rental;
}

export async function checkinRental(tenantId: string, id: string, userId: string, data: z.infer<typeof checkinSchema>) {
    const rental = await getRental(tenantId, id);
    if (rental.status === 'returned') throw new AppError(409, 'Locação já devolvida');
    if (rental.status === 'cancelled') throw new AppError(409, 'Locação cancelada');

    // Get tenant settings for fine calculation
    const [tenant] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId));
    const finePercentage = (tenant?.settings as any)?.overdueFinePercentage ?? 10;

    const endDateActual = new Date(data.endDateActual);
    const startDate = new Date(rental.startDate);
    const endDateExpected = new Date(rental.endDateExpected);
    const totalDaysActual = daysBetween(startDate, endDateActual);
    const dailyRate = parseFloat(rental.dailyRateAgreed);

    let overdueFineAmount = 0;
    if (endDateActual > endDateExpected) {
        const overdueDays = daysBetween(endDateExpected, endDateActual);
        // Apply percentage fine of the daily rate per overdue day
        overdueFineAmount = overdueDays * dailyRate * (finePercentage / 100);
    }

    const totalAmountActual = totalDaysActual * dailyRate + overdueFineAmount;

    const updated = await db.transaction(async (tx) => {
        const [updatedRental] = await tx
            .update(rentals)
            .set({
                status: 'returned',
                endDateActual,
                totalDaysActual,
                totalAmountActual: String(totalAmountActual),
                overdueFineAmount: String(overdueFineAmount),
                checkinBy: userId,
                updatedAt: new Date(),
            })
            .where(and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)))
            .returning();

        // Update or create payment record
        const existingPayment = await tx.query.payments.findFirst({
            where: and(eq(payments.rentalId, id), eq(payments.status, 'pending'))
        });

        if (existingPayment) {
            await tx.update(payments).set({
                amount: String(totalAmountActual),
                paymentDate: new Date(),
                paymentMethod: data.paymentMethod,
                status: 'completed',
                receivedBy: userId,
                notes: 'Pagamento concluído na devolução (Transação)',
            }).where(eq(payments.id, existingPayment.id));
        } else {
            await tx.insert(payments).values({
                tenantId,
                rentalId: id,
                amount: String(totalAmountActual),
                paymentDate: new Date(),
                paymentMethod: data.paymentMethod,
                status: 'completed',
                receivedBy: userId,
                notes: 'Pagamento automático na devolução (Novo - Transação)',
            });
        }

        // Update tool back to available
        await tx.update(tools).set({ status: 'available', updatedAt: new Date() }).where(eq(tools.id, rental.toolId));

        return updatedRental;
    });

    console.log(`[RENTAL CHECKIN] Transaction successful for Rental ${id}`);
    return updated;
}

export async function cancelRental(tenantId: string, id: string) {
    const rental = await getRental(tenantId, id);
    if (rental.status === 'returned') throw new AppError(409, 'Locação já devolvida');

    const [updated] = await db
        .update(rentals)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)))
        .returning();

    // Release tool
    await db.update(tools).set({ status: 'available', updatedAt: new Date() }).where(eq(tools.id, rental.toolId));

    return updated;
}

export async function getDashboardStats(tenantId: string, period?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Period-based start date for dynamic metrics
    let periodStart = startOfMonth; // default to 30d/month behaviors
    if (period === 'today') periodStart = startOfToday;
    else if (period === '7d') periodStart = lastWeek;
    else if (period === '30d') periodStart = thirtyDaysAgo;

    // Get basic counts and lists for calculation
    const [toolRows, rentalRows, paymentRows, maintenanceRows, newCustomers, expensesRows] = await Promise.all([
        db.select().from(tools).where(eq(tools.tenantId, tenantId)),
        db.query.rentals.findMany({
            where: eq(rentals.tenantId, tenantId),
            with: {
                tool: { columns: { name: true, brand: true, acquisitionCost: true, currentUsageHours: true, nextMaintenanceDueHours: true } },
                customer: { columns: { fullName: true } }
            }
        }),
        db.select({ amount: payments.amount, status: payments.status, paymentDate: payments.paymentDate }).from(payments).where(eq(payments.tenantId, tenantId)),
        db.select({ toolId: maintenanceLogs.toolId, cost: maintenanceLogs.cost }).from(maintenanceLogs).where(eq(maintenanceLogs.tenantId, tenantId)),
        db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), sql`${customers.createdAt} >= ${lastWeek}`)),
        db.select({ amount: expenses.amount }).from(expenses).where(eq(expenses.tenantId, tenantId))
    ]);

    const totalTools = toolRows.length;
    const rentedTools = toolRows.filter((t: any) => t.status === 'rented');
    const availableTools = toolRows.filter((t: any) => t.status === 'available');
    const maintenanceTools = toolRows.filter((t: any) => t.status === 'maintenance');

    const occupancyRate = totalTools > 0 ? (rentedTools.length / totalTools) * 100 : 0;

    const activeRentals = rentalRows.filter((r: any) => r.status === 'active');
    const overdueRentals = activeRentals.filter((r: any) => new Date(r.endDateExpected) < now);

    // NEW: Returns for today
    const returnsToday = activeRentals.filter((r: any) => {
        const end = new Date(r.endDateExpected);
        return end >= startOfToday && end <= endOfToday;
    }).length;

    // NEW: Critical overdue (vencidos há mais de 3 dias)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const criticalOverdueCount = activeRentals.filter((r: any) => new Date(r.endDateExpected) < threeDaysAgo).length;

    // NEW: Maintenance alerts based on intervals
    const maintenanceAlertsCount = toolRows.filter((t: any) => {
        // Alerta se exceder horas de uso
        const usageExceeded = t.currentUsageHours && t.nextMaintenanceDueHours && parseFloat(t.currentUsageHours) >= parseFloat(t.nextMaintenanceDueHours);

        // Alerta se exceder intervalo de dias
        let daysExceeded = false;
        if (t.maintenanceIntervalDays && t.lastMaintenanceAt) {
            const lastMaint = new Date(t.lastMaintenanceAt);
            const daysSince = daysBetween(lastMaint, now);
            daysExceeded = daysSince >= t.maintenanceIntervalDays;
        }

        // Alerta se exceder número de locações
        let rentalsExceeded = false;
        if (t.maintenanceIntervalRentals) {
            const rentalsSinceLastMaint = rentalRows.filter(r => r.toolId === t.id && (!t.lastMaintenanceAt || new Date(r.createdAt) > new Date(t.lastMaintenanceAt))).length;
            rentalsExceeded = rentalsSinceLastMaint >= t.maintenanceIntervalRentals;
        }

        return usageExceeded || daysExceeded || rentalsExceeded;
    }).length;

    // NEW: Idle rate (% tools not rented in last 30 days)
    const itemsRentedLast30Days = new Set(
        rentalRows
            .filter((r: any) => new Date(r.startDate) >= thirtyDaysAgo)
            .map((r: any) => r.toolId)
    );
    const idleCount = toolRows.filter(t => !itemsRentedLast30Days.has(t.id)).length;
    const idleRate = totalTools > 0 ? (idleCount / totalTools) * 100 : 0;

    // NEW: Zombie Equipment (ROI < threshold or Idleness > threshold)
    const zombieEquipment = toolRows.filter((t: any) => {
        const isIdle = !itemsRentedLast30Days.has(t.id);
        const acquisitionCost = parseFloat(t.acquisitionCost || '0');

        // Se custou algo e não rendeu nada em 90 dias (estimativa simplificada aqui com os dados que temos)
        // Ou se o custo de manutenção está alto relativo à receita (precisaríamos de mais agregados)
        return isIdle && acquisitionCost > 0; // Simplified zombie logic for now: expensive and idle
    }).map(t => ({ id: t.id, name: t.name, status: t.status }));


    // Calculate revenue metrics — only from COMPLETED payments
    const completedPayments = paymentRows.filter((p: any) => p.status === 'completed');
    const pendingPayments = paymentRows.filter((p: any) => p.status === 'pending');

    const actualRevenue = completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
    const revenueInPeriod = completedPayments
        .filter((p: any) => new Date(p.paymentDate) >= periodStart)
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

    // "To Receive" is the sum of all PENDING payment records
    const toReceive = pendingPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

    // Plan enforcement for Intelligence
    const [tenant] = await db.select({ settings: tenants.settings, plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId));
    const limits = getPlanLimits(tenant?.plan);
    const finePercentage = (tenant?.settings as any)?.overdueFinePercentage ?? 10;

    let topToolsByROI: any[] = [];
    let topRiskyCustomers: any[] = [];
    let mostProfitableCustomers: any[] = [];
    let totalFinesGenerated = 0;
    let revenueAtRisk = 0;

    if (limits.advancedIntelligence) {
        // Revenue at risk & Overdue Fine calculation
        revenueAtRisk = overdueRentals.reduce((sum: number, r: any) => {
            const expected = parseFloat(r.totalAmountExpected || '0');
            const dailyRate = parseFloat(r.dailyRateAgreed || '0');
            const overdueDays = daysBetween(new Date(r.endDateExpected), now);
            const fine = overdueDays * dailyRate * (finePercentage / 100);
            totalFinesGenerated += fine;
            return sum + expected + fine;
        }, 0);

        // Asset ROI & Rankings
        const toolStatsMap: Record<string, { name: string, revenue: number, maintenance: number, cost: number }> = {};

        // Initialize with tools
        toolRows.forEach(t => {
            toolStatsMap[t.id] = {
                name: t.name,
                revenue: 0,
                maintenance: 0,
                cost: parseFloat(t.acquisitionCost || '0')
            };
        });

        rentalRows.forEach((r: any) => {
            const amount = parseFloat(r.totalAmountActual || r.totalAmountExpected || '0');
            if (toolStatsMap[r.toolId]) {
                toolStatsMap[r.toolId].revenue += amount;
            }
        });

        maintenanceRows.forEach((m: any) => {
            if (toolStatsMap[m.toolId]) {
                toolStatsMap[m.toolId].maintenance += parseFloat(m.cost || '0');
            }
        });

        const toolROI = Object.entries(toolStatsMap).map(([id, stats]) => {
            const profit = stats.revenue - stats.maintenance;
            const roi = stats.cost > 0 ? (profit / stats.cost) * 100 : 0;
            return { id, ...stats, profit, roi };
        });

        topToolsByROI = [...toolROI]
            .filter(t => t.cost > 0)
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5);

        // Customer Risk & VIP Scoring
        const customerStatsMap: Record<string, { name: string, totalRentals: number, lateCount: number, totalOverdueDays: number, totalRevenue: number }> = {};

        rentalRows.forEach((r: any) => {
            if (!customerStatsMap[r.customerId]) {
                customerStatsMap[r.customerId] = {
                    name: r.customer?.fullName || 'Desconhecido',
                    totalRentals: 0,
                    lateCount: 0,
                    totalOverdueDays: 0,
                    totalRevenue: 0
                };
            }
            const stats = customerStatsMap[r.customerId];
            stats.totalRentals += 1;
            stats.totalRevenue += parseFloat(r.totalAmountActual || r.totalAmountExpected || '0');

            const isLate = r.status === 'overdue' || (r.endDateActual && new Date(r.endDateActual) > new Date(r.endDateExpected)) || (r.status === 'active' && new Date(r.endDateExpected) < now);

            if (isLate) {
                stats.lateCount += 1;
                const end = r.endDateActual ? new Date(r.endDateActual) : now;
                const delay = daysBetween(new Date(r.endDateExpected), end);
                stats.totalOverdueDays += delay;
            }
        });

        const customerRiskScores = Object.entries(customerStatsMap).map(([id, stats]) => {
            const lateRatio = stats.totalRentals > 0 ? stats.lateCount / stats.totalRentals : 0;
            const avgDelay = stats.lateCount > 0 ? stats.totalOverdueDays / stats.lateCount : 0;

            const score = Math.min(100, (lateRatio * 70) + (Math.min(30, avgDelay * 3)));

            return { id, ...stats, score: Math.round(score) };
        });

        topRiskyCustomers = [...customerRiskScores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        mostProfitableCustomers = [...customerRiskScores]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
    }

    // Fleet utilization and turnover
    const [totalCustomersCount] = await db.select({ count: sql`count(*)` }).from(customers).where(eq(customers.tenantId, tenantId));

    // Total Expenses
    const totalExpenses = expensesRows.reduce((sum: number, e: any) => sum + parseFloat(e.amount || '0'), 0);
    const netProfit = actualRevenue - totalExpenses;

    return {
        // Essential counts
        available: availableTools.length,
        rented: rentedTools.length,
        maintenance: maintenanceTools.length,
        total: totalTools,
        activeRentals: activeRentals.length,
        overdueRentalsCount: overdueRentals.length,
        criticalOverdueCount,
        maintenanceAlertsCount,
        returnsToday,
        idleRate: idleRate.toFixed(1),
        totalCustomers: Number((totalCustomersCount as any)?.count || 0),

        // Financials
        actualRevenue: actualRevenue.toFixed(2),
        revenueThisMonth: revenueInPeriod.toFixed(2), // We rename it in frontend but send period-relative value
        toReceive: toReceive.toFixed(2),
        revenueAtRisk: revenueAtRisk.toFixed(2),
        totalFinesGenerated: totalFinesGenerated.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2),

        // Intelligence & Rankings
        topToolsByROI,
        topRiskyCustomers,
        mostProfitableCustomers,
        zombieEquipment,
        newCustomersCount: newCustomers.length
    };
}

export const getToolAvailability = async (tenantId: string, toolId: string) => {
    const data = await db.query.rentals.findMany({
        where: (rentals, { and, eq, ne }) => and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.toolId, toolId),
            ne(rentals.status, 'cancelled')
        ),
        columns: {
            id: true,
            startDate: true,
            endDateExpected: true,
            endDateActual: true,
            status: true,
        },
        orderBy: (rentals, { asc }) => [asc(rentals.startDate)]
    });

    return data;
};

export async function getExpiringRentals(tenantId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const data = await db.query.rentals.findMany({
        where: and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.status, 'active'),
            sql`${rentals.endDateExpected} >= ${startOfToday}`,
            sql`${rentals.endDateExpected} <= ${endOfTomorrow}`
        ),
        with: {
            tool: { columns: { name: true } },
            customer: { columns: { fullName: true, phoneNumber: true } },
        },
        orderBy: [desc(rentals.endDateExpected)],
    });

    return data;
}

