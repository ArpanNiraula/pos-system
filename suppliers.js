const router = require('express').Router();

const db = require('../db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, async (req, res) => {
    try {

        const result = await db.query(`
            SELECT
                id,
                supplier_name,
                contact_person,
                phone,
                email,
                address,
                created_at
            FROM suppliers
            ORDER BY supplier_name
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load suppliers'
        });

    }
});

router.get('/:id', auth, async (req, res) => {
    try {

        const result = await db.query(
            `
            SELECT *
            FROM suppliers
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to load supplier'
        });

    }
});

router.post('/', auth, admin, async (req, res) => {
    try {

        const {
            supplier_name,
            contact_person,
            phone,
            email,
            address
        } = req.body;

        const result = await db.query(
            `
            INSERT INTO suppliers (
                supplier_name,
                contact_person,
                phone,
                email,
                address
            )
            VALUES (
                $1,$2,$3,$4,$5
            )
            RETURNING *
            `,
            [
                supplier_name,
                contact_person,
                phone,
                email,
                address
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to create supplier'
        });

    }
});

router.put('/:id', auth, admin, async (req, res) => {
    try {

        const {
            supplier_name,
            contact_person,
            phone,
            email,
            address
        } = req.body;

        const result = await db.query(
            `
            UPDATE suppliers
            SET
                supplier_name = $1,
                contact_person = $2,
                phone = $3,
                email = $4,
                address = $5
            WHERE id = $6
            RETURNING *
            `,
            [
                supplier_name,
                contact_person,
                phone,
                email,
                address,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to update supplier'
        });

    }
});

router.delete('/:id', auth, admin, async (req, res) => {
    try {

        const result = await db.query(
            `
            DELETE FROM suppliers
            WHERE id = $1
            RETURNING id
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Supplier not found'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Failed to delete supplier'
        });

    }
});

module.exports = router;