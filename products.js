const router = require('express').Router();

const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                p.id,
                p.sku,
                p.barcode,
                p.product_name,
                p.cost_price,
                p.selling_price,
                p.current_stock,
                p.vat_rate,
                p.is_active,
                c.category_name
            FROM products p
            LEFT JOIN categories c
                ON c.id = p.category_id
            ORDER BY p.product_name
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load products'
        });

    }
});

router.get('/search', auth, async (req, res) => {
    try {

        const q = req.query.q || '';

        const result = await db.query(
            `
            SELECT *
            FROM products
            WHERE
                product_name ILIKE $1
                OR sku ILIKE $1
                OR barcode ILIKE $1
            ORDER BY product_name
            LIMIT 50
            `,
            [`%${q}%`]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Search failed'
        });

    }
});

router.get('/barcode/:barcode', auth, async (req, res) => {
    try {

        const result = await db.query(
            `
            SELECT *
            FROM products
            WHERE barcode = $1
            `,
            [req.params.barcode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Lookup failed'
        });

    }
});

router.post('/', auth, admin, async (req, res) => {
    try {

        const {
            sku,
            barcode,
            product_name,
            category_id,
            cost_price,
            selling_price,
            vat_rate,
            current_stock,
            reorder_level
        } = req.body;

        const result = await db.query(
            `
            INSERT INTO products (
                sku,
                barcode,
                product_name,
                category_id,
                cost_price,
                selling_price,
                vat_rate,
                current_stock,
                reorder_level
            )
            VALUES (
                $1,$2,$3,$4,$5,
                $6,$7,$8,$9
            )
            RETURNING *
            `,
            [
                sku,
                barcode,
                product_name,
                category_id,
                cost_price,
                selling_price,
                vat_rate,
                current_stock,
                reorder_level
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Product creation failed'
        });

    }
});

router.put('/:id', auth, admin, async (req, res) => {
    try {

        const {
            sku,
            barcode,
            product_name,
            category_id,
            cost_price,
            selling_price,
            vat_rate,
            current_stock,
            reorder_level,
            is_active
        } = req.body;

        const result = await db.query(
            `
            UPDATE products
            SET
                sku = $1,
                barcode = $2,
                product_name = $3,
                category_id = $4,
                cost_price = $5,
                selling_price = $6,
                vat_rate = $7,
                current_stock = $8,
                reorder_level = $9,
                is_active = $10,
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
            `,
            [
                sku,
                barcode,
                product_name,
                category_id,
                cost_price,
                selling_price,
                vat_rate,
                current_stock,
                reorder_level,
                is_active,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Update failed'
        });

    }
});

router.delete('/:id', auth, admin, async (req, res) => {
    try {

        const result = await db.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING id
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Delete failed'
        });

    }
});

module.exports = router;