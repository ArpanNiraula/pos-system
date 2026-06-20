const router = require('express').Router();
const crypto = require('crypto');

const db = require('../db');
const auth = require('../middleware/auth');

function generateInvoiceNumber() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const random = Math.floor(Math.random() * 100000);

    return `INV-${year}${month}${day}-${random}`;
}

router.post('/', auth, async (req, res) => {

    const client = await db.pool.connect();

    try {

        const {
            invoice_date_bs,
            payment_method,
            items,
            counter_id
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'Cart is empty'
            });
        }

        await client.query('BEGIN');

        let subtotal = 0;
        let vatAmount = 0;

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

            if (Number(product.current_stock) < Number(item.qty)) {
                throw new Error(
                    `${product.product_name} stock is insufficient`
                );
            }

            const lineSubtotal =
                Number(product.selling_price) *
                Number(item.qty);

            const lineVat =
                (lineSubtotal * Number(product.vat_rate)) / 100;

            subtotal += lineSubtotal;
            vatAmount += lineVat;
        }

        const grandTotal = subtotal + vatAmount;

        const invoiceNo = generateInvoiceNumber();

        const fiscalYearBS = '2083/84';

        const saleResult = await client.query(
            `
            INSERT INTO sales (
                invoice_no,
                fiscal_year_bs,
                invoice_date_ad,
                invoice_date_bs,
                counter_id,
                cashier_id,
                payment_method,
                subtotal,
                vat_amount,
                grand_total
            )
            VALUES (
                $1,$2,CURRENT_DATE,$3,$4,
                $5,$6,$7,$8,$9
            )
            RETURNING *
            `,
            [
                invoiceNo,
                fiscalYearBS,
                invoice_date_bs,
                counter_id,
                req.user.id,
                payment_method,
                subtotal,
                vatAmount,
                grandTotal
            ]
        );

        const sale = saleResult.rows[0];

        for (const item of items) {

            const productResult = await client.query(
                `
                SELECT *
                FROM products
                WHERE id = $1
                `,
                [item.product_id]
            );

            const product = productResult.rows[0];

            const lineTotal =
                Number(product.selling_price) *
                Number(item.qty);

            await client.query(
                `
                INSERT INTO sale_items (
                    sale_id,
                    product_id,
                    qty,
                    unit_price,
                    vat_rate,
                    line_total
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6
                )
                `,
                [
                    sale.id,
                    product.id,
                    item.qty,
                    product.selling_price,
                    product.vat_rate,
                    lineTotal
                ]
            );

            const newStock =
                Number(product.current_stock) -
                Number(item.qty);

            await client.query(
                `
                UPDATE products
                SET current_stock = $1
                WHERE id = $2
                `,
                [
                    newStock,
                    product.id
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
                    'SALE',
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    product.id,
                    invoiceNo,
                    item.qty,
                    newStock,
                    req.user.id
                ]
            );
        }

        const auditPayload = {
            invoice_no: invoiceNo,
            subtotal,
            vatAmount,
            grandTotal,
            cashier: req.user.id,
            timestamp: new Date()
        };

        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(auditPayload))
            .digest('hex');

        await client.query(
            `
            INSERT INTO ird_logs (
                invoice_no,
                immutable_hash,
                payload
            )
            VALUES (
                $1,$2,$3
            )
            `,
            [
                invoiceNo,
                hash,
                JSON.stringify(auditPayload)
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            invoice_no: invoiceNo,
            subtotal,
            vat: vatAmount,
            total: grandTotal
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
