import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/billing.css";

export default function BillingTerminal() {
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");
    const [cashReceived, setCashReceived] = useState("");

    const inputRef = useRef(null);

    

    const subtotal = useMemo(() => {
        return items.reduce((sum, i) => sum + i.qty * i.price, 0);
    }, [items]);

    const vat = useMemo(() => +(subtotal * 0.13).toFixed(2), [subtotal]);
    const total = useMemo(() => +(subtotal + vat).toFixed(2), [subtotal, vat]);

    function addItem(product) {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);

            if (existing) {
                return prev.map(i =>
                    i.id === product.id
                        ? { ...i, qty: i.qty + 1 }
                        : i
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    price: product.price,
                    qty: 1
                }
            ];
        });

        setQuery("");
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            const match = mockProducts.find(p =>
                p.sku.toLowerCase() === query.toLowerCase() ||
                p.name.toLowerCase().includes(query.toLowerCase())
            );

            if (match) addItem(match);
        }

        if (e.key === "F2") {
            e.preventDefault();
            setItems([]);
        }
    }

    function removeItem(id) {
        setItems(prev => prev.filter(i => i.id !== id));
    }

    function updateQty(id, qty) {
        setItems(prev =>
            prev.map(i =>
                i.id === id ? { ...i, qty: Number(qty) } : i
            )
        );
    }

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="billing-container">

            <header className="topbar">
                <div className="brand">POS Terminal</div>
                <div className="meta">
                    <span>Counter: C01</span>
                    <span>Cashier: Admin</span>
                </div>
            </header>

            <div className="body">

                <div className="left">

                    <input
                        ref={inputRef}
                        className="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Scan barcode or type product..."
                    />

                    <table className="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.sku}</td>
                                    <td>{item.name}</td>
                                    <td>
                                        <input
                                            value={item.qty}
                                            onChange={(e) =>
                                                updateQty(item.id, e.target.value)
                                            }
                                        />
                                    </td>
                                    <td>{item.price}</td>
                                    <td>{item.qty * item.price}</td>
                                    <td>
                                        <button onClick={() => removeItem(item.id)}>
                                            x
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

                <div className="right">

                    <div className="box">
                        <div className="row">
                            <span>Subtotal</span>
                            <span>{subtotal}</span>
                        </div>

                        <div className="row">
                            <span>VAT (13%)</span>
                            <span>{vat}</span>
                        </div>

                        <div className="row total">
                            <span>Total</span>
                            <span>{total}</span>
                        </div>
                    </div>

                    <div className="box">
                        <input
                            placeholder="Cash received"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                        />

                        <button className="btn pay">
                            COMPLETE SALE
                        </button>

                        <button className="btn print">
                            PRINT RECEIPT
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
}