const http = require("node:http");

const crypto = require("node:crypto");

const USERNAME = "admin";
const PASSWORD = "1234";

const sessions = {};

function checkCredentials(username, password) {
  return username === USERNAME && password === PASSWORD;
}

function getSessionId(request) {
  const cookie = request.headers.cookie || "";
  const match = cookie.match(/sid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function isLoggedIn(request) {
  const id = getSessionId(request);
  return id && sessions[id] && sessions[id] > Date.now();
}

const todolist = [
  {
    id: 1,
    title: "Task1",
    status: "Completed",
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

const server = http.createServer(function(request,response){
    
    // response.write("Hello\n");
    // response.write("Anusha\n");
    // response.end("Welcome\n");


      // Set the HTTP status code to 200 (OK) and Content-Type to text/html
    
      const url = new URL(request.url, `http://${request.headers.host}`);
    
    if (url.pathname === "/login" && request.method === "GET") {
      if (isLoggedIn(request)) {
        response.writeHead(302, { Location: "/"});
        return response.end();
      }
      const error = url.searchParams.get("error")
      ? "<p style='colour:red'>Username ya password galat hai</p"
      : "";
      response.writeHead(200, { "Content-Type": "text/html" });
      return response.end(`
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
    
    
    if (url.pathname === "/login" && request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => (body += chunk.toString()));
      request.on("end", () => {
        const data = new URLSearchParams(body);
        if (checkCredentials(data.get("username"), data.get("password"))) {
          const id = crypto.randomBytes(16).toString("hex");
          sessions[id] = Date.now() + 20 * 60 * 1000; // 20 min
          response.writeHead(302, {
            "Set-Cookie": `sid=${id}; HttpOnly; Path=/; SameSite=Strict`,
            Location: "/",
          });
          return response.end();
        }
        response.writeHead(302, { Location: "/login?error=1" });
        response.end();
      });
      return;
    }
    
    if (url.pathname === "/logout") {
      delete sessions[getSessionId(request)];
      response.writeHead(302, {
        "Set-Cookie": "sid=; HttpOnly; Path=/; Max-Age=0",
        Location: "/login",
      });
      return response.end();
    }
    
    if (!isLoggedIn(request)) {
      response.writeHead(302, { Location: "/login" });
      return response.end();
    }
    
      if (request.url === "/") {
    
        response.writeHead(200, { "Content-Type": "text/html" });
        let tr = "";
        for (let i = 0; i < todolist.length; i++) {
          tr = tr + `<tr>
                    <td>${i+1}</td>
                    <td>${todolist[i].title}</td>
                    <td>${todolist[i].status}</td>
                    <th>
                        <form action="/todo-delete/${todolist[i].id}" method="POST">
                            <button type="submit">Delete</button>
                        </form>
                        <form action="/todo-edit/${todolist[i].id}" method="POST">
                            <button type="submit">Edit</button>
                        </form>
                        
                    </th>
                </tr>`;
        }
        // Send the HTML response and close the connection
        response.end(`
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
    
       if (request.url === "/todo-create") {
    
        if(request.method == "GET"){
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(`
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
    
        if(request.method == "POST"){
            let body = "";
            request.on("data", (chunk) => {
                body += chunk.toString();
            });
    
            request.on("end", () => {
    
                const formData = new URLSearchParams(body);
    
                const title = formData.get("title");
    
                todolist.push({
                    id: getNextId(),
                    title: title,
                    status: "Pending"
                });
    
                response.writeHead(302, {
                    "Location": "/"
                });
    
                response.end();
            });
        }
      }
    
    
    if (url.pathname.startsWith("/todo-edit/") && request.method === "POST") {
    
    
          const id = Number(url.pathname.split("/")[2]);
    
          const todo = todolist.find((todo) => todo.id === id);
    
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(`
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
                <form action="/todo-edit-post" method="POST">
                    
                    <label>Title</label>
                    <input type="text" name='title' value='${todo.title}' />
                    
                    <label>Status</label>
                    <select name="status" >
                      <option value="Pending" ${todo.status ==="Pending"?'selected':''}>Pending</option>
                      <option value="Completed" ${todo.status ==="Completed"?'selected':''}>Completed</option>
                    </select>
                    <input type="hidden" name="id" value=${todo.id} />
                    <button type="submit">Edit</button>
                </form>
    
            </body>
            </html>`);
    
    }
    
    
    if (
        url.pathname.startsWith("/todo-delete/") &&
        request.method === "POST"
    ) {
        const id = Number(url.pathname.split("/")[2]);
        const index = todolist.findIndex((todo) => todo.id === id);
    
        if (index !== -1) {
            todolist.splice(index, 1);
        }
    
        response.writeHead(302 , {
            Location: "/"
        });
    
        response.end();
    }
    
      if(request.url == "/todo-edit-post"){
      
        let body = "";
        request.on("data", (chunk) => {
            body += chunk.toString();
        });
    
        request.on("end", () => {
    
            const formData = new URLSearchParams(body);
    
            const title = formData.get("title");
            const id = formData.get("id");
            const status = formData.get("status")
    
            const existingTodo = todolist.find((todo)=> todo.id == id);
            existingTodo.title = title;
            existingTodo.status = status;
    
            response.writeHead(302, {
                "Location": "/"
            });
    
            response.end();
        });
      }
    });
    
    
    const PORT = 5000;
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);

      console.log("hello");
    });



   // const PORT = 5000
    //server.listen(PORT,()=>console.log("server is running on localhost:"+PORT));

    
//});


