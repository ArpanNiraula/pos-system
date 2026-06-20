const db = require('../db');

const calculateVat = require('../utils/vat');
const generateBillNumber = require('../utils/billNumber');
const createAuditHash = require('../utils/auditHash');

exports.getSales = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT *
            FROM invoices
            ORDER BY transaction_time DESC
            LIMIT 100
            `
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to fetch sales'
        });
    }
};

exports.getSale = async (req, res) => {
    try {
        const invoice = await db.query(
            `
            SELECT *
            FROM invoices
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (!invoice.rows.length) {
            return res.status(404).json({
                message: 'Invoice not found'
            });
        }

        const items = await db.query(
            `
            SELECT *
            FROM invoice_items
            WHERE invoice_id = $1
            `,
            [req.params.id]
        );

        res.json({
            invoice: invoice.rows[0],
            items: items.rows
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to fetch invoice'
        });
    }
};

exports.createSale = async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const {
            cashier_id,
            counter_id,
            payment_method,
            customer_name,
            items
        } = req.body;

        if (!items || !items.length) {
            throw new Error('No items provided');
        }

        let subtotal = 0;

        for (const item of items) {
            const product = await client.query(
                `
                SELECT *
                FROM products
                WHERE id = $1
                FOR UPDATE
                `,
                [item.product_id]
            );

            if (!product.rows.length) {
                throw new Error('Product not found');
            }

            const currentProduct = product.rows[0];

            if (
                Number(currentProduct.stock_quantity) <
                Number(item.qty)
            ) {
                throw new Error(
                    `${currentProduct.product_name} out of stock`
                );
            }

            subtotal +=
                Number(currentProduct.selling_price) *
                Number(item.qty);
        }

        subtotal = Number(subtotal.toFixed(2));

        const vatAmount = calculateVat(subtotal);

        const grandTotal = Number(
            (subtotal + vatAmount).toFixed(2)
        );

        const billNo = generateBillNumber();

        const auditString =
            `${billNo}|${subtotal}|${vatAmount}|${grandTotal}`;

        const auditHash =
            createAuditHash(auditString);

        const invoiceResult = await client.query(
            `
            INSERT INTO invoices (
                bill_no,
                transaction_time,
                ad_date,
                bs_date,
                fiscal_year,
                counter_id,
                cashier_id,
                customer_name,
                subtotal,
                vat_amount,
                grand_total,
                payment_method,
                immutable_audit_hash
            )
            VALUES (
                $1,
                NOW(),
                CURRENT_DATE,
                '',
                '',
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *
            `,
            [
                billNo,
                counter_id,
                cashier_id,
                customer_name,
                subtotal,
                vatAmount,
                grandTotal,
                payment_method,
                auditHash
            ]
        );

        const invoice = invoiceResult.rows[0];

        for (const item of items) {
            const product = await client.query(
                `
                SELECT *
                FROM products
                WHERE id = $1
                `,
                [item.product_id]
            );

            const p = product.rows[0];

            const lineTotal =
                Number(p.selling_price) *
                Number(item.qty);

            await client.query(
                `
                INSERT INTO invoice_items (
                    invoice_id,
                    product_id,
                    qty,
                    rate,
                    line_total
                )
                VALUES ($1,$2,$3,$4,$5)
                `,
                [
                    invoice.id,
                    item.product_id,
                    item.qty,
                    p.selling_price,
                    lineTotal
                ]
            );

            await client.query(
                `
                UPDATE products
                SET stock_quantity =
                    stock_quantity - $1
                WHERE id = $2
                `,
                [
                    item.qty,
                    item.product_id
                ]
            );
        }

        await client.query(
            `
            INSERT INTO ird_logs (
                invoice_id,
                bill_no,
                log_string,
                generated_hash
            )
            VALUES ($1,$2,$3,$4)
            `,
            [
                invoice.id,
                billNo,
                auditString,
                auditHash
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            invoice
        });

    } catch (err) {

        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            success: false,
            message: err.message
        });

    } finally {

        client.release();

    }
};