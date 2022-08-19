// import axios from "axios";
// import {
//     showAlert
// } from "./alert";

// export const login = async (email, password) => {
//     try {
//         const res = await axios({
//             method: "POST",
//             url: "http://127.0.0.1:8000/api/v1/users/login",
//             data: {
//                 email,
//                 password
//             }
//         });
//         if (res.data.status === "success") {
//             showAlert("success", "Logged in successfully");
//             window.setTimeout(() => {
//                 location.assign("/");
//             }, 1500);
//         }
//     } catch (err) {
//         showAlert("error", err.response.data.message);
//     }
// }

// export const logout = async () => {
//     try {
//         const res = await axios({
//             method: "GET",
//             url: "http://127.0.0.1:8000/api/v1/users/logout",
//         });
//         console.log(res);

//         if (res.data.status === "success") location.reload(true)
//     } catch (err) {
//         showAlert("error", "Error loging out. Please try again!");
//     }
// }

const hideAlert = () => {
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
}

const showAlert = (type, message) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    const body = document.querySelector("body");
    body.insertAdjacentHTML("afterbegin", markup);
    window.setTimeout(hideAlert, 5000);
}

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


const login = async (email, password) => {
    try {
        const res = await axios({
            method: "POST",
            url: "http://127.0.0.1:8000/api/v1/users/login",
            data: {
                email,
                password
            }
        });
        if (res.data.status === "success") {
            showAlert("success", "Logged in successfully");
            window.setTimeout(() => {
                location.assign("/");
            }, 1500);
        }
    } catch (err) {
        showAlert("error", err.response.data.message);
    }
}

const logout = async () => {
    try {
        const res = await axios({
            method: "GET",
            url: "http://127.0.0.1:8000/api/v1/users/logout",
        });
        console.log(res);

        if (res.data.status === "success") location.reload(true)
    } catch (err) {
        console.log(err);

        showAlert("error", "Error loging out. Please try again!");
    }
}

if (logOutBtn) logOutBtn.addEventListener("click", logout);