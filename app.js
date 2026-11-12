const http = require("node:http");


const crypto = require("node:crypto");

const USERNAME = "admin";
const PASSWORD = "1234";

const sessions = {};

function checkCredentials(username, password) {
  return username === USERNAME && password === PASSWORD;
}

function getSessionId(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/sid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function isLoggedIn(req) {
  const id = getSessionId(req);
  return id && sessions[id] && sessions[id] > Date.now();
}

const todolist = [
  {
    id: 1,
    title: "Task1",
    status: "Complete",
  },
  {
    id: 2,
    title: "Task2",
    status: "Pending",
  },
  {
    id: 3,
    title: "Task3",
    status: "Pending",
  },
];

let lastId = 3;

function getNextId(){
   lastId = lastId + 1;
   return lastId;
}

const server = http.createServer((req, res) => {
  // Set the HTTP status code to 200 (OK) and Content-Type to text/html

  const url = new URL(req.url, `http://${req.headers.host}`);

if (url.pathname === "/login" && req.method === "GET") {
  if (isLoggedIn(req)) {
    res.writeHead(302, { Location: "/"});
    return res.end();
  }
  const error = url.searchParams.get("error")
  ? "<p style='colour:red'>Username ya password galat hai</p"
  : "";
  res.writeHead(200, { "Content-Type": "text/html" });
  return res.end(`
    <!DOCTYPE html>
    <html><head><title>Login</title></head>
    <body>
    <h1 style="text-align:centre;">Login</h1>
    ${error}
    <form action="/login" method="POST">
    <input type="text" name="username" placeholder="Username" /><br /><br />
    <input type="password" name="password" placeholder="Password" /><br /><br />
    <button type="submit">Login</button>
    </form>
    </body></html>
  `);
}


if (url.pathname === "/login" && req.method === "POST") {
  let body = "";
  req.on("data", (chunk) => (body += chunk.toString()));
  req.on("end", () => {
    const data = new URLSearchParams(body);
    if (checkCredentials(data.get("username"), data.get("password"))) {
      const id = crypto.randomBytes(16).toString("hex");
      sessions[id] = Date.now() + 20 * 60 * 1000; // 20 min
      res.writeHead(302, {
        "Set-Cookie": `sid=${id}; HttpOnly; Path=/; SameSite=Strict`,
        Location: "/",
      });
      return res.end();
    }
    res.writeHead(302, { Location: "/login?error=1" });
    res.end();
  });
  return;
}

if (url.pathname === "/logout") {
  delete sessions[getSessionId(req)];
  res.writeHead(302, {
    "Set-Cookie": "sid=; HttpOnly; Path=/; Max-Age=0",
    Location: "/login",
  });
  return res.end();
}

if (!isLoggedIn(req)) {
  res.writeHead(302, { Location: "/login" });
  return res.end();
}

  if (req.url === "/") {

      res.writeHead(200, { "Content-Type": "text/html" });
    let tr = "";
    for (let i = 0; i < todolist.length; i++) {
      tr =
        tr +
        `
        <tr>
            <td>${i+1}</td>
            <td>${todolist[i].title}</td>
            <td>${todolist[i].status}</td>
            <th>
                <form action="/todo-delete/${todolist[i].id}" method="POST">
                    <button type="submit">Delete</button>
                </form>
                <button type="button">Edit</button>
            </th>
        </tr>
        `;
    }
    // Send the HTML response and close the connection
    res.end(`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width= , initial-scale=1.0">
    <title>TO-DO-APPLICATION</title>
</head>
<style>
    table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #dddddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
</style>

<body>
    <H1 style="text-align: center;">TODO-APP</H1>
    <a href="/todo-create">Create</a>
    <a href="/logout">Logout</a>
    <table>
        <tr>
            <th>Sr.</th>
            <th>Tasks</th>
            <th>Status</th>
            <th>Action</th>
        </tr>
        ${tr}
    </table>

</body>
</html>
  `);
  }

  if (req.url === "/todo-create") {

    if(req.method == "GET"){
        res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
        
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width= , initial-scale=1.0">
    <title>TO-DO-APPLICATION</title>
</head>
<style>
    table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #dddddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
</style>

<body>
    <H1 style="text-align: center;">TODO-APP</H1>
    <a href="/">My Todos</a>
    <form action="/todo-create" method="POST">
        <input type="text" name='title' />

        <button type="submit">Create</button>
    </form>

</body>
</html>
        `);
    }

    if(req.method == "POST"){


        let body = "";

    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", () => {

        const formData = new URLSearchParams(body);

        const title = formData.get("title");

        todolist.push({
            id: getNextId(),
            title: title,
            status: "Pending"
        });

        res.writeHead(302, {
            "Location": "/"
        });

        res.end();
    });
     
  }
}

  if (req.url === "/todo-edit") {
    res.end("<h1>Edit Todod</h1>");
  }

if (
    url.pathname.startsWith("/todo-delete/") &&
    req.method === "POST"
) {
    const id = Number(url.pathname.split("/")[2]);

    const index = todolist.findIndex((todo) => todo.id === id);

    if (index !== -1) {
        todolist.splice(index, 1);
    }

    res.writeHead(302, {
        Location: "/"
    });

    res.end();
}
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
