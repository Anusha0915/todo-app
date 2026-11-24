
const http = require("node:http");

// Temporary storage for student records
const students = [];

// Function to protect HTML output
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

const server = http.createServer((req, res) => {

    // CREATE: Display registration form
    if (req.method === "GET" && req.url === "/") {

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

        res.end(`
            <h1>Student Management System</h1>
            <h2>Student Registration</h2>

            <form action="/register" method="POST">

                Student ID: <input type="text" name="studentId" required><br><br>

                Student Name: <input type="text" name="name" required><br><br>

                Age: <input type="number" name="age" required><br><br>

                Course: <input type="text" name="course" required><br><br>

                Email: <input type="email" name="email" required><br><br>

                Phone: <input type="tel" name="phone" required><br><br>

                <button type="submit">Register Student</button>

            </form>

            <br>
            <a href="/students">View All Students</a>
        `);
    }

    // CREATE: Process student registration
    else if (req.method === "POST" && req.url === "/register") {

        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {

            const formData = new URLSearchParams(body);

            const student = {
                studentId: formData.get("studentId")?.trim(),
                name: formData.get("name")?.trim(),
                age: formData.get("age")?.trim(),
                course: formData.get("course")?.trim(),
                email: formData.get("email")?.trim(),
                phone: formData.get("phone")?.trim()
            };

            if (Object.values(student).some(value => !value)) {
                res.writeHead(400);
                res.end("All fields are required!");
                return;
            }

            const exists = students.some(
                (s) => s.studentId === student.studentId
            );

            if (exists) {
                res.writeHead(409, { "Content-Type": "text/plain" });
                res.end("Student ID already exists!");
                return;
            }

            students.push(student);

            console.log("New student registered:");
            console.log(student);

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

            res.end(`
                <h1>Registration Successful!</h1>
                <p>Student Name: ${escapeHTML(student.name)}</p>
                <p>Student ID: ${escapeHTML(student.studentId)}</p>
                <a href="/">Register Another Student</a>
                <br><br>
                <a href="/students">View All Students</a>
            `);
        });
    }

    // READ: Display all registered students
    else if (req.method === "GET" && req.url === "/students") {

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

        let studentRows = "";

        students.forEach((student) => {

            studentRows += `
                <tr>
                    <td>${escapeHTML(student.studentId)}</td>
                    <td>${escapeHTML(student.name)}</td>
                    <td>${escapeHTML(student.age)}</td>
                    <td>${escapeHTML(student.course)}</td>
                    <td>${escapeHTML(student.email)}</td>
                    <td>${escapeHTML(student.phone)}</td>

                    <td>
                        <a href="/edit?id=${encodeURIComponent(student.studentId)}">
                            Edit
                        </a>

                        <form action="/delete" method="POST"
                              onsubmit="return confirm('Are you sure you want to delete this student?');">

                            <input type="hidden"
                                   name="studentId"
                                   value="${escapeHTML(student.studentId)}">

                            <button type="submit">Delete</button>

                        </form>
                    </td>
                </tr>
            `;
        });

        res.end(`
            <h1>Registered Students</h1>

            ${
                students.length === 0
                ? "<p>No students registered yet.</p>"
                : `
                    <table border="1" cellpadding="10">
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Course</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>

                        ${studentRows}

                    </table>
                `
            }

            <br>
            <a href="/">Back to Registration</a>
        `);
    }

    // UPDATE PART 1: Display pre-filled edit form
    else if (req.method === "GET" && req.url.startsWith("/edit")) {

        const pageURL = new URL(req.url, "http://localhost:3000");

        const studentId = pageURL.searchParams.get("id");

        const student = students.find(
            (s) => s.studentId === studentId
        );

        if (!student) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Student not found!");
            return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

        res.end(`
            <h1>Edit Student Details</h1>

            <form action="/update" method="POST">

                Student ID:
                <input type="text"
                    name="studentId"
                    value="${escapeHTML(student.studentId)}"
                    readonly>
                <br><br>

                Student Name:
                <input type="text"
                    name="name"
                    value="${escapeHTML(student.name)}"
                    required>
                <br><br>

                Age:
                <input type="number"
                    name="age"
                    value="${escapeHTML(student.age)}"
                    required>
                <br><br>

                Course:
                <input type="text"
                    name="course"
                    value="${escapeHTML(student.course)}"
                    required>
                <br><br>

                Email:
                <input type="email"
                    name="email"
                    value="${escapeHTML(student.email)}"
                    required>
                <br><br>

                Phone:
                <input type="tel"
                    name="phone"
                    value="${escapeHTML(student.phone)}"
                    required>
                <br><br>

                <button type="submit">Update Student</button>

            </form>

            <br>
            <a href="/students">Cancel and Go Back</a>
        `);
    }

    // UPDATE PART 2: Process updated student information
    else if (req.method === "POST" && req.url === "/update") {

        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {

            const formData = new URLSearchParams(body);

            const studentId = formData.get("studentId")?.trim();

            const student = students.find(
                (s) => s.studentId === studentId
            );

            if (!student) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Student not found!");
                return;
            }

            const updatedData = {
                name: formData.get("name")?.trim(),
                age: formData.get("age")?.trim(),
                course: formData.get("course")?.trim(),
                email: formData.get("email")?.trim(),
                phone: formData.get("phone")?.trim()
            };

            if (Object.values(updatedData).some(value => !value)) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("All fields are required!");
                return;
            }

            student.name = updatedData.name;
            student.age = updatedData.age;
            student.course = updatedData.course;
            student.email = updatedData.email;
            student.phone = updatedData.phone;

            console.log("Student information updated:");
            console.log(student);

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

            res.end(`
                <h1>Student Updated Successfully!</h1>

                <p>Student ID: ${escapeHTML(student.studentId)}</p>
                <p>Student Name: ${escapeHTML(student.name)}</p>
                <p>Updated Course: ${escapeHTML(student.course)}</p>

                <br>
                <a href="/students">View All Students</a>
            `);
        });
    }

    // DELETE: Remove a student
    else if (req.method === "POST" && req.url === "/delete") {

        let body = "";

        // Receive incoming form data
        req.on("data", (chunk) => {
            body += chunk;
        });

        // Process data after receiving everything
        req.on("end", () => {

            const formData = new URLSearchParams(body);

            const studentId = formData.get("studentId")?.trim();

            // Find the position of the student
            const index = students.findIndex(
                (s) => s.studentId === studentId
            );

            // Check whether student exists
            if (index === -1) {

                res.writeHead(404, { "Content-Type": "text/plain" });

                res.end("Student not found!");

                return;
            }

            // Store the deleted student's information for logging
            const deletedStudent = students[index];

            // Remove student from the array
            students.splice(index, 1);

            console.log("Student deleted successfully:");
            console.log(deletedStudent);

            // Send response to browser
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

            res.end(`
                <h1>Student Deleted Successfully!</h1>

                <p>Student ID: ${escapeHTML(deletedStudent.studentId)}</p>
                <p>Student Name: ${escapeHTML(deletedStudent.name)}</p>

                <br>
                <a href="/students">View Remaining Students</a>
                <br><br>
                <a href="/">Back to Registration</a>
            `);
        });
    }

    // Handle unknown URLs
    else {

        res.writeHead(404, { "Content-Type": "text/plain" });

        res.end("404 - Page Not Found");
    }

});

// Start server
server.listen(3000, () => {

    console.log("Server running at http://localhost:3000");

});
