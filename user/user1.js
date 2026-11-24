
const http = require("http");
const crypto = require("crypto");

// In-memory storage
const users = [];

// Function to create HTML page
function registrationPage(message = "") {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>User Registration</title>

        <style>
            body {
                font-family: Arial;
                background: #f2f2f2;
                display: flex;
                justify-content: center;
                padding-top: 40px;
            }

            .container {
                background: white;
                padding: 30px;
                width: 350px;
                border-radius: 10px;
            }

            h1 {
                text-align: center;
            }

            label {
                display: block;
                margin-top: 12px;
            }

            input {
                width: 100%;
                padding: 9px;
                box-sizing: border-box;
                margin-top: 5px;
            }

            button {
                width: 100%;
                padding: 12px;
                margin-top: 20px;
                background: blue;
                color: white;
                border: none;
                cursor: pointer;
            }

            .message {
                text-align: center;
                color: green;
            }

            .error {
                color: red;
            }
        </style>
    </head>

    <body>

        <div class="container">

            <h1>User Registration</h1>

            ${message}

            <form action="/register" method="POST">

                <label>First Name</label>
                <input type="text" name="firstName" required>

                <label>Last Name</label>
                <input type="text" name="lastName" required>

                <label>Email</label>
                <input type="email" name="email" required>

                <label>Username</label>
                <input type="text" name="username" required>

                <label>Password</label>
                <input type="password" name="password" required>

                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" required>

                <button type="submit">Register</button>

            </form>

        </div>

    </body>
    </html>
    `;
}


// Create HTTP server
const server = http.createServer((req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);

    // GET request: Display registration page
    if (url.pathname === "/" && req.method === "GET") {

        let message = "";

        if (url.searchParams.get("success")) {
            message = `<p class="message">Registration successful!</p>`;
        }

        if (url.searchParams.get("error")) {
            message = `<p class="error">Registration failed. Please check your details.</p>`;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        return res.end(registrationPage(message));
    }

    // POST request: Handle registration form
    if (url.pathname === "/register" && req.method === "POST") {
-
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {

            // Convert form data into JavaScript object
            const formData = new URLSearchParams(body);

            const firstName = formData.get("firstName")?.trim();
            const lastName = formData.get("lastName")?.trim();
            const email = formData.get("email")?.trim();
            const username = formData.get("username")?.trim();
            const password = formData.get("password");
            const confirmPassword = formData.get("confirmPassword");

            // Validate empty fields
            if (!firstName || !lastName || !email ||
                !username || !password || !confirmPassword) {

                res.writeHead(303, { Location: "/?error=1" });
                return res.end();
            }

            // Check password confirmation
            if (password !== confirmPassword) {

                res.writeHead(303, { Location: "/?error=1" });
                return res.end();
            }

            // Check duplicate username or email
            const existingUser = users.find(user =>
                user.username.toLowerCase() === username.toLowerCase() ||
                user.email.toLowerCase() === email.toLowerCase()
            );

            if (existingUser) {

                res.writeHead(303, { Location: "/?error=1" });
                return res.end();
            }

            // Hash password before storing
            const salt = crypto.randomBytes(16).toString("hex");

            const hashedPassword = crypto.scryptSync(
                password,
                salt,
                64
            ).toString("hex");

            // Create user object
            const newUser = {
                firstName,
                lastName,
                email,
                username,
                salt,
                password: hashedPassword
            };

            // Store user in memory
            users.push(newUser);

            console.log("Registered Users:", users.length);

            // Redirect to same page
            res.writeHead(303, {
                Location: "/?success=1"
            });

            return res.end();

        });

        return;
    }


    // Handle unknown routes
    res.writeHead(404, {
        "Content-Type": "text/plain"
    });

    res.end("404 - Page Not Found");

});


// Start server
server.listen(3007, () => {
    console.log("Server running at http://localhost:3007");
});
