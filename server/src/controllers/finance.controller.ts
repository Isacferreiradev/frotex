import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { payments, expenses, otherRevenues, rentals } from '../db/schema';
import { eq, sum, and, gte, sql } from 'drizzle-orm';

export async function getStats(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        console.log(`[FINANCE] getStats for tenant: ${tenantId}`);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Receita de Locações (completed) - do Mês
        const [rentalRevenueData] = await db.select({
            total: sum(payments.amount)
        }).from(payments).where(
            and(
                eq(payments.tenantId, tenantId),
                eq(payments.status, 'completed'),
                gte(payments.paymentDate, startOfMonth)
            )
        );

        // 2. Outras Receitas - do Mês
        const [otherRevenueData] = await db.select({
            total: sum(otherRevenues.amount)
        }).from(otherRevenues).where(
            and(
                eq(otherRevenues.tenantId, tenantId),
                gte(otherRevenues.date, startOfMonth)
            )
        );

        // 3. Total Despesas - do Mês
        const [expensesData] = await db.select({
            total: sum(expenses.amount)
        }).from(expenses).where(
            and(
                eq(expenses.tenantId, tenantId),
                gte(expenses.date, startOfMonth)
            )
        );

        // 4. Pagamentos Pendentes (Total)
        const [pendingData] = await db.select({
            total: sum(payments.amount)
        }).from(payments).where(and(eq(payments.tenantId, tenantId), eq(payments.status, 'pending')));

        // 5. Total de Locações Ativas (para auxílio em cálculos de ROI)
        const [activeRentals] = await db.select({
            count: sql<number>`count(*)`
        }).from(rentals).where(and(eq(rentals.tenantId, tenantId), eq(rentals.status, 'active')));

        // 6. Histórico Recente (apenas Concluídos)
        const recentPayments = await db.query.payments.findMany({
            where: and(eq(payments.tenantId, tenantId), eq(payments.status, 'completed')),
            with: { rental: { columns: { rentalCode: true } } },
            orderBy: (p, { desc }) => [desc(p.paymentDate)],
            limit: 20,
        });

        const totalRevenueValue = parseFloat(rentalRevenueData?.total || '0') + parseFloat(otherRevenueData?.total || '0');
        const expensesValue = parseFloat(expensesData?.total || '0');

        const data = {
            revenue: totalRevenueValue.toFixed(2),
            rentalRevenue: rentalRevenueData?.total || '0',
            otherRevenue: otherRevenueData?.total || '0',
            expenses: expensesValue.toFixed(2),
            pending: pendingData?.total || '0',
            netProfit: (totalRevenueValue - expensesValue).toFixed(2),
            activeRentals: activeRentals?.count || 0,
            recentPayments,
        };

        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function listExpenses(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const data = await db.query.expenses.findMany({
            where: eq(expenses.tenantId, tenantId),
            orderBy: (e, { desc }) => [desc(e.date)],
        });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { category, description, amount, date } = req.body;

        console.log('--- CREATE EXPENSE ---');
        console.log('Body:', req.body);
        console.log('Tenant:', tenantId);

        const [expense] = await db.insert(expenses).values({
            tenantId,
            category,
            description,
            amount: amount.toString(),
            date: date ? new Date(date) : new Date(),
        }).returning();

        res.status(201).json({ success: true, data: expense });
    } catch (err: any) {
        console.error('Save Expense Error:', err);
        next(err);
    }
}

export async function listOtherRevenues(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const data = await db.query.otherRevenues.findMany({
            where: eq(otherRevenues.tenantId, tenantId),
            orderBy: (r, { desc }) => [desc(r.date)],
        });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function createOtherRevenue(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { category, description, amount, date } = req.body;

        console.log('--- CREATE OTHER REVENUE ---');
        console.log('Body:', req.body);

        const [revenue] = await db.insert(otherRevenues).values({
            tenantId,
            category,
            description,
            amount: amount.toString(),
            date: date ? new Date(date) : new Date(),
        }).returning();

        res.status(201).json({ success: true, data: revenue });
    } catch (err: any) {
        console.error('Save Other Revenue Error:', err);
        next(err);
    }
}
