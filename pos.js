import { request } from "./api.js";

let cart = [];

export function posView() {
    return `
        <div class="pos">

            <div class="top">
                <input id="search" placeholder="Scan / Search product">
                <button id="logout">Logout</button>
            </div>

            <div class="grid">

                <div class="items">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="cart"></tbody>
                    </table>
                </div>

                <div class="panel">
                    <div id="summary"></div>

                    <button id="pay">PAY</button>
                </div>

            </div>

        </div>
    `;
}

export async function initPOS(reRender) {

    const search = document.getElementById("search");

    search.addEventListener("keydown", async (e) => {

        if (e.key !== "Enter") return;

        const q = search.value.trim();

        if (!q) return;

        try {

            const product = await request(`/products/search?q=${q}`);

            const item = product[0];

            if (!item) {
                alert("Product not found");
                return;
            }

            const existing = cart.find(c => c.id === item.id);

            if (existing) {
                existing.qty++;
            } else {
                cart.push({ ...item, qty: 1 });
            }

            renderCart();

        } catch (err) {
            alert(err.message);
        }

        search.value = "";
    });

    document.getElementById("pay").onclick = async () => {

        try {

            const items = cart.map(i => ({
                product_id: i.id,
                qty: i.qty
            }));

            const res = await request("/sales", "POST", {
                payment_method: "CASH",
                invoice_date_bs: "2083-01-01",
                counter_id: null,
                items
            });

            alert("Invoice: " + res.invoice_no);

            cart = [];
            renderCart();

        } catch (err) {
            alert(err.message);
        }
    };

    document.getElementById("logout").onclick = () => {
        localStorage.removeItem("token");
        reRender();
    };

    renderCart();
}

function renderCart() {

    const tbody = document.getElementById("cart");

    if (!cart.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#6b7280;padding:20px;">
                    No items in cart
                </td>
            </tr>
        `;

        document.getElementById("summary").innerHTML = `
            <p>Subtotal: 0</p>
            <p>VAT (13%): 0</p>
            <p><b>Total: 0</b></p>
        `;

        return;
    }

    let subtotal = 0;

    tbody.innerHTML = "";

    cart.forEach(i => {

        const total = i.qty * i.selling_price;
        subtotal += total;

        tbody.innerHTML += `
            <tr>
                <td>${i.sku}</td>
                <td>${i.product_name}</td>
                <td>${i.qty}</td>
                <td>${i.selling_price}</td>
                <td>${total.toFixed(2)}</td>
            </tr>
        `;
    });

    const vat = subtotal * 0.13;

    document.getElementById("summary").innerHTML = `
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>VAT (13%): ${vat.toFixed(2)}</p>
        <p><b>Total: ${(subtotal + vat).toFixed(2)}</b></p>
    `;
}