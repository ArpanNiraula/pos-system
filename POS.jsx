import { useState, useEffect } from "react";

export default function POS() {

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/products")
            .then(r => r.json())
            .then(setProducts);
    }, []);

    function add(p) {
        setCart([...cart, { ...p, qty: 1 }]);
    }

    async function checkout() {
        await fetch("http://localhost:5000/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cashier_id: 1,
                items: cart.map(i => ({
                    product_id: i.id,
                    qty: i.qty
                }))
            })
        });

        setCart([]);
        alert("Sale completed");
    }

    return (
        <div style={{ display: "flex" }}>

            <div>
                {products.map(p => (
                    <div key={p.id} onClick={() => add(p)}>
                        {p.name} - {p.price}
                    </div>
                ))}
            </div>

            <div>
                <h3>Cart</h3>
                {cart.map((c, i) => (
                    <div key={i}>{c.name}</div>
                ))}

                <button onClick={checkout}>Checkout</button>
            </div>

        </div>
    );
}