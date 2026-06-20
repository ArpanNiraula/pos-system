const router = require('express').Router();

const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                id,
                sku,
                barcode,
                product_name,
                cost_price,
                selling_price,
                current_stock,
                reorder_level,
                vat_rate
            FROM products
            ORDER BY product_name
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load inventory'
        });

    }
});

router.get('/low-stock', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                id,
                sku,
                product_name,
                current_stock,
                reorder_level
            FROM products
            WHERE current_stock <= reorder_level
            ORDER BY product_name
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load low stock products'
        });

    }
});

router.get('/movements/:productId', auth, async (req, res) => {
    try {

        const result = await db.query(
            `
            SELECT *
            FROM stock_movements
            WHERE product_id = $1
            ORDER BY created_at DESC
            `,
            [req.params.productId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load stock history'
        });

    }
});

router.post('/adjust', auth, admin, async (req, res) => {

    const client = await db.pool.connect();

    try {

        const {
            product_id,
            qty,
            reason
        } = req.body;

        await client.query('BEGIN');

        const productResult = await client.query(
            `
            SELECT *
            FROM products
            WHERE id = $1
            FOR UPDATE
            `,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            throw new Error('Product not found');
        }

        const product = productResult.rows[0];

        const newStock =
            Number(product.current_stock) +
            Number(qty);

        if (newStock < 0) {
            throw new Error('Negative stock not allowed');
        }

        await client.query(
            `
            UPDATE products
            SET
                current_stock = $1,
                updated_at = NOW()
            WHERE id = $2
            `,
            [
                newStock,
                product_id
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
                'ADJUSTMENT',
                $2,
                $3,
                $4,
                $5
            )
            `,
            [
                product_id,
                reason || 'MANUAL',
                qty,
                newStock,
                req.user.id
            ]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            previous_stock: product.current_stock,
            current_stock: newStock
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

router.get('/valuation', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                SUM(current_stock * cost_price) AS inventory_value,
                SUM(current_stock) AS total_units
            FROM products
        `);

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to calculate valuation'
        });

    }
});

module.exports = router;