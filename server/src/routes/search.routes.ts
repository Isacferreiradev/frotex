import { Router } from 'express';
import { db } from '../db';
import { tools, customers, rentals } from '../db/schema';
import { ilike, or, and, eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
    try {
        const { q } = req.query;
        const tenantId = req.user.tenantId;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
        }

        const searchTerm = `%${q}%`;

        // 1. Buscar Ferramentas
        const toolsResults = await db.select()
            .from(tools)
            .where(
                and(
                    eq(tools.tenantId, tenantId),
                    or(
                        ilike(tools.name, searchTerm),
                        ilike(tools.brand, searchTerm),
                        ilike(tools.model, searchTerm),
                        ilike(tools.serialNumber, searchTerm)
                    )
                )
            )
            .limit(5);

        // 2. Buscar Clientes
        const customersResults = await db.select()
            .from(customers)
            .where(
                and(
                    eq(customers.tenantId, tenantId),
                    or(
                        ilike(customers.fullName, searchTerm),
                        ilike(customers.documentNumber, searchTerm),
                        ilike(customers.email, searchTerm)
                    )
                )
            )
            .limit(5);

        // 3. Buscar Locações (pelo código)
        const rentalsResults = await db.select()
            .from(rentals)
            .where(
                and(
                    eq(rentals.tenantId, tenantId),
                    ilike(rentals.rentalCode, searchTerm)
                )
            )
            .limit(5);

        return res.json({
            success: true,
            data: {
                tools: toolsResults.map(t => ({ id: t.id, name: t.name, type: 'tool', status: t.status })),
                customers: customersResults.map(c => ({ id: c.id, name: c.fullName, type: 'customer' })),
                rentals: rentalsResults.map(r => ({ id: r.id, name: r.rentalCode, type: 'rental' }))
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
