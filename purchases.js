const router = require('express').Router();

const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

function generatePurchaseNumber() {
    const now = new Date();

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const r = Math.floor(Math.random() * 100000);

    return `PUR-${y}${m}${d}-${r}`;
}

router.get('/', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                p.id,
                p.purchase_no,
                p.purchase_date,
                p.total_amount,
                s.supplier_name
            FROM purchases p
            LEFT JOIN suppliers s
                ON s.id = p.supplier_id
            ORDER BY p.purchase_date DESC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load purchases'
        });

    }
});

router.post('/', auth, admin, async (req, res) => {

    const client = await db.pool.connect();

    try {

        const {
            supplier_id,
            items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'No purchase items'
            });
        }

        await client.query('BEGIN');

        let totalAmount = 0;

        for (const item of items) {

            const lineTotal =
                Number(item.qty) *
                Number(item.unit_cost);

            totalAmount += lineTotal;
        }

        const purchaseNo = generatePurchaseNumber();

        const purchaseResult = await client.query(
            `
            INSERT INTO purchases (
                purchase_no,
                supplier_id,
                total_amount,
                created_by
            )
            VALUES (
                $1,$2,$3,$4
            )
            RETURNING *
            `,
            [
                purchaseNo,
                supplier_id,
                totalAmount,
                req.user.id
            ]
        );

        const purchase = purchaseResult.rows[0];

        for (const item of items) {

            const productResult = await client.query(
                `
                SELECT *
                FROM products
                WHERE id = $1
                FOR UPDATE
                `,
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error('Product not found');
            }

            const product = productResult.rows[0];

            const lineTotal =
                Number(item.qty) *
                Number(item.unit_cost);

            await client.query(
                `
                INSERT INTO purchase_items (
                    purchase_id,
                    product_id,
                    qty,
                    unit_cost,
                    total_cost
                )
                VALUES (
                    $1,$2,$3,$4,$5
                )
                `,
                [
                    purchase.id,
                    item.product_id,
                    item.qty,
                    item.unit_cost,
                    lineTotal
                ]
            );

            const newStock =
                Number(product.current_stock) +
                Number(item.qty);

            await client.query(
                `
                UPDATE products
                SET
                    current_stock = $1,
                    cost_price = $2,
                    updated_at = NOW()
                WHERE id = $3
                `,
                [
                    newStock,
                    item.unit_cost,
                    item.product_id
                ]
            );

            await client.query(
                `
                INSERT INTO stock_movements (
                    product_id,
                    movement_type,
                    reference_no,
                    qty,
                    balance_after,
                    created_by
                )
                VALUES (
                    $1,
                    'PURCHASE',
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    item.product_id,
                    purchaseNo,
                    item.qty,
                    newStock,
                    req.user.id
                ]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            purchase_no: purchaseNo,
            total_amount: totalAmount
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    } finally {

        client.release();

    }

});

module.exports = router;