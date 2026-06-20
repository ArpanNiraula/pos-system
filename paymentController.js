const axios = require('axios');
const db = require('../db');

/*
|--------------------------------------------------------------------------
| eSewa Verification
|--------------------------------------------------------------------------
*/
exports.verifyEsewa = async (req, res) => {
    try {
        const {
            transaction_code,
            amount,
            reference_id,
            invoice_id
        } = req.body;

        if (!transaction_code || !amount || !invoice_id) {
            return res.status(400).json({
                message: 'Invalid request'
            });
        }

        // In real integration, eSewa uses redirect verification or SOAP/API
        // This is structured for production adaptation

        const invoice = await db.query(
            `SELECT * FROM invoices WHERE id = $1`,
            [invoice_id]
        );

        if (!invoice.rows.length) {
            return res.status(404).json({
                message: 'Invoice not found'
            });
        }

        await db.query(
            `
            INSERT INTO payment_logs (
                invoice_id,
                gateway,
                gateway_transaction_id,
                amount,
                status,
                raw_response
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            `,
            [
                invoice_id,
                'ESEWA',
                transaction_code,
                amount,
                'SUCCESS',
                JSON.stringify(req.body)
            ]
        );

        res.json({
            success: true
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'eSewa verification failed'
        });
    }
};

/*
|--------------------------------------------------------------------------
| Khalti Verification
|--------------------------------------------------------------------------
*/
exports.verifyKhalti = async (req, res) => {
    try {
        const { token, amount, invoice_id } = req.body;

        if (!token || !amount || !invoice_id) {
            return res.status(400).json({
                message: 'Invalid request'
            });
        }

        const response = await axios.post(
            'https://khalti.com/api/v2/payment/verify/',
            {
                token,
                amount
            },
            {
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`
                }
            }
        );

        const invoice = await db.query(
            `SELECT * FROM invoices WHERE id = $1`,
            [invoice_id]
        );

        if (!invoice.rows.length) {
            return res.status(404).json({
                message: 'Invoice not found'
            });
        }

        await db.query(
            `
            INSERT INTO payment_logs (
                invoice_id,
                gateway,
                gateway_transaction_id,
                amount,
                status,
                raw_response
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            `,
            [
                invoice_id,
                'KHALTI',
                response.data.idx,
                amount,
                response.data.state?.name || 'SUCCESS',
                JSON.stringify(response.data)
            ]
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (err) {
        console.error(err.response?.data || err);

        res.status(500).json({
            message: 'Khalti verification failed'
        });
    }
};