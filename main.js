import { loginView } from "./auth.js";
import { posView } from "./pos.js";

const app = document.getElementById("app");

function render() {

    const token = localStorage.getItem("token");

    if (!token) {
        app.innerHTML = loginView();
        attachLogin();
    } else {
        app.innerHTML = posView();
        attachPOS();
    }
}

function attachLogin() {

    document.getElementById("loginBtn").onclick = async () => {

        const pin = document.getElementById("pin").value;

        const { request } = await import("./api.js");

        try {

            const res = await request("/pin-auth/login-pin", "POST", {
                pin
            });

            localStorage.setItem("token", res.token);

            render();

        } catch (err) {
            alert(err.message);
        }
    };
}

function attachPOS() {
    import("./pos.js").then(m => m.initPOS(render));
}

render();