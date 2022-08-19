import {
    login,
    logout
} from "./login";

const submit = document.querySelector(".submit");
const logOutBtn = document.querySelector(".nav__el--logout");

if (submit) {
    submit.addEventListener("click", e => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        login(email, password);
    })
}

if (logOutBtn) logOutBtn.addEventListener("click", logout);