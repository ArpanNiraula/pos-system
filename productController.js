const db = require('../db');

exports.getProducts = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM products
            WHERE active = true
            ORDER BY product_name
            `
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to fetch products'
        });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM products
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to fetch product'
        });
    }
};

exports.createProduct = async (req, res) => {
    const {
        sku,
        barcode,
        product_name,
        cost_price,
        selling_price,
        stock_quantity
    } = req.body;

    try {
        const result = await db.query(
            `
            INSERT INTO products (
                sku,
                barcode,
                product_name,
                cost_price,
                selling_price,
                stock_quantity
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                sku,
                barcode,
                product_name,
                cost_price,
                selling_price,
                stock_quantity
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to create product'
        });
    }
};

exports.updateProduct = async (req, res) => {
    const {
        sku,
        barcode,
        product_name,
        cost_price,
        selling_price,
        stock_quantity,
        active
    } = req.body;

    try {
        const result = await db.query(
            `
            UPDATE products
            SET
                sku = $1,
                barcode = $2,
                product_name = $3,
                cost_price = $4,
                selling_price = $5,
                stock_quantity = $6,
                active = $7,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
            `,
            [
                sku,
                barcode,
                product_name,
                cost_price,
                selling_price,
                stock_quantity,
                active,
                req.params.id
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to update product'
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await db.query(
            `
            UPDATE products
            SET active = false
            WHERE id = $1
            `,
            [req.params.id]
        );

        res.json({
            message: 'Product archived'
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to delete product'
        });
    }
};