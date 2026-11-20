
const http = require("http");
const { randomUUID } = require("crypto");

// Temporary storage (No database)
let users = [];

// Helper function to prevent HTML injection
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Read data sent by HTML forms
function getFormData(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            resolve(Object.fromEntries(new URLSearchParams(body)));
        });

        req.on("error", reject);
    });
}

// HTML page
function renderPage(message = "", editUser = null) {

    const editing = editUser !== null;

    const userRows = users.map(user => `
        <tr>
            <td>${escapeHTML(user.username)}</td>
            <td>${escapeHTML(user.firstName)} ${escapeHTML(user.lastName)}</td>
            <td>${escapeHTML(user.email)}</td>
            <td>${escapeHTML(user.language)}</td>
            <td>
                <a href="/edit?id=${encodeURIComponent(user.id)}">Edit</a>

                <form action="/delete?id=${encodeURIComponent(user.id)}"
                      method="POST" style="display:inline;">
                    <button type="submit"
                    onclick="return confirm('Delete this user?')">
                    Delete
                    </button>
                </form>
            </td>
        </tr>
    `).join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Developer Registration</title>

        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                background: #f5f5f5;
                margin: 0;
                padding: 30px;
                color: #444;
            }

            .container {
                background: white;
                max-width: 460px;
                margin: auto;
                padding: 30px;
                border-radius: 5px;
                box-shadow: 0 2px 10px #ddd;
            }

            h2 {
                text-align: center;
                font-weight: normal;
                margin-bottom: 30px;
            }

            label {
                display: block;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 9px;
            }

            input, select {
                width: 100%;
                padding: 10px;
                border: 1px solid #ccc;
                margin-bottom: 18px;
                font-size: 14px;
            }

            .buttons {
                display: flex;
                gap: 15px;
            }

            button {
                cursor: pointer;
                padding: 12px;
                border: none;
                border-radius: 4px;
            }

            .buttons button {
                width: 50%;
            }

            .register {
                background: #35a2d5;
                color: white;
            }

            .login {
                background: #eee;
                color: #444;
            }

            .message {
                text-align: center;
                color: green;
                margin-bottom: 15px;
            }

            .table-container {
                max-width: 1000px;
                margin: 35px auto;
                overflow-x: auto;
                background: white;
                padding: 20px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
            }

            th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }

            th {
                background: #35a2d5;
                color: white;
            }

            a {
                color: #168bc4;
                margin-right: 10px;
            }
        </style>
    </head>

    <body>

        <div class="container">

            <h2>${editing ? "Update Developer" : "Developer Registration"}</h2>

            <p class="message">${escapeHTML(message)}</p>

            <form action="${editing ? "/update?id=" + encodeURIComponent(editUser.id) : "/register"}"
                  method="POST">

                <label>Username</label>
                <input type="text" name="username"
                value="${escapeHTML(editUser?.username || "")}"
                placeholder="Enter username" required>

                <label>First Name</label>
                <input type="text" name="firstName"
                value="${escapeHTML(editUser?.firstName || "")}"
                placeholder="Enter first name" required>

                <label>Last Name</label>
                <input type="text" name="lastName"
                value="${escapeHTML(editUser?.lastName || "")}"
                placeholder="Enter last name" required>

                <label>E-mail Address</label>
                <input type="email" name="email"
                value="${escapeHTML(editUser?.email || "")}"
                placeholder="Enter email" required>

                <label>Password</label>
                <input type="password" name="password"
                placeholder="${editing ? "Leave blank to keep existing password" : "Enter password"}"
                ${editing ? "" : "required"}>

                <label>Main Programming Language</label>

                <select name="language" required>
                    <option value="">Select a language</option>

                    ${["Java", "Python", "JavaScript", "C", "C++", "PHP"].map(lang =>
                        `<option value="${lang}"
                        ${editUser?.language === lang ? "selected" : ""}>
                        ${lang}
                        </option>`
                    ).join("")}

                </select>

                <div class="buttons">

                    <button type="submit" class="register">
                        ${editing ? "Update" : "Register"}
                    </button>

                    <button type="button" class="login"
                    onclick="window.location.href='/login'">
                        Login
                    </button>

                </div>

            </form>

            ${editing ? '<p><a href="/">Back to Registration</a></p>' : ""}

        </div>

        ${!editing ? `
        <div class="table-container">

            <h2>Registered Developers</h2>

            <table>
                <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Language</th>
                    <th>Actions</th>
                </tr>

                ${userRows || '<tr><td colspan="5">No users registered yet.</td></tr>'}

            </table>

        </div>
        ` : ""}

    </body>
    </html>
    `;
}

// Create server
const server = http.createServer(async (req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);

    // READ: Display registration page
    if (req.method === "GET" && url.pathname === "/") {

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderPage());
    }

    // CREATE: Register new developer
    else if (req.method === "POST" && url.pathname === "/register") {

        const data = await getFormData(req);

        const exists = users.some(user =>
            user.username === data.username ||
            user.email.toLowerCase() === data.email.toLowerCase()
        );

        if (exists) {
            res.writeHead(200, { "Content-Type": "text/html" });
            return res.end(renderPage("Username or email already exists!"));
        }

        users.push({
            id: randomUUID(),
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            language: data.language
        });

        res.writeHead(303, { Location: "/" });
        res.end();
    }

    // UPDATE: Show edit form
    else if (req.method === "GET" && url.pathname === "/edit") {

        const id = url.searchParams.get("id");

        const user = users.find(u => u.id === id);

        if (!user) {
            res.writeHead(404);
            return res.end("User not found");
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderPage("Edit developer details", user));
    }

    // UPDATE: Save edited details
    else if (req.method === "POST" && url.pathname === "/update") {

        const id = url.searchParams.get("id");

        const user = users.find(u => u.id === id);

        if (!user) {
            res.writeHead(404);
            return res.end("User not found");
        }

        const data = await getFormData(req);

        const duplicate = users.some(u =>
            u.id !== id &&
            (u.username === data.username ||
            u.email.toLowerCase() === data.email.toLowerCase())
        );

        if (duplicate) {
            res.writeHead(409, { "Content-Type": "text/html" });
            return res.end("Username or email already exists. Go back and try again.");
        }

        user.username = data.username;
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.email = data.email;
        user.language = data.language;

        if (data.password) {
            user.password = data.password;
        }

        res.writeHead(303, { Location: "/" });
        res.end();
    }

    // DELETE: Delete developer
    else if (req.method === "POST" && url.pathname === "/delete") {

        const id = url.searchParams.get("id");

        users = users.filter(user => user.id !== id);

        res.writeHead(303, { Location: "/" });
        res.end();
    }

    // LOGIN: Show login form
    else if (req.method === "GET" && url.pathname === "/login") {

        res.writeHead(200, { "Content-Type": "text/html" });

        res.end(`
            <html>
            <head><title>Login</title></head>
            <body style="font-family:Arial; max-width:400px; margin:50px auto;">

                <h2>Developer Login</h2>

                <form action="/login" method="POST">
                    <label>Email Address</label>
                    <input type="email" name="email" required>
                    <br><br>

                    <label>Password</label>
                    <input type="password" name="password" required>
                    <br><br>

                    <button type="submit">Login</button>
                </form>

                <a href="/">Back to Registration</a>

            </body>
            </html>
        `);
    }

    // LOGIN: Check credentials
    else if (req.method === "POST" && url.pathname === "/login") {

        const data = await getFormData(req);

        const user = users.find(u =>
            u.email.toLowerCase() === data.email.toLowerCase() &&
            u.password === data.password
        );

        res.writeHead(200, { "Content-Type": "text/html" });

        if (user) {
            res.end(`
                <h2>Login Successful!</h2>
                <p>Welcome, ${escapeHTML(user.firstName)}!</p>
                <a href="/">Go to Home</a>
            `);
        } else {
            res.end(`
                <h2>Invalid email or password!</h2>
                <a href="/login">Try Again</a>
            `);
        }
    }

    // INVALID ROUTE
    else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h2>404 - Page Not Found</h2>");
    }

});

// Start server on port 5001
server.listen(5001, () => {
    console.log("Server running at http://localhost:5001");
});
