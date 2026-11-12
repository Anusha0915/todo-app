const http = require("node:http");

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

const server = http.createServer((req, res) => {
  // Set the HTTP status code to 200 (OK) and Content-Type to text/html

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.url === "/") {

    res.writeHead(200, { "Content-Type": "text/html" });
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


if (url.pathname.startsWith("/todo-edit/") && req.method === "POST") {


      const id = Number(url.pathname.split("/")[2]);

      const todo = todolist.find((todo) => todo.id === id);

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
    req.method === "POST"
) {
    const id = Number(url.pathname.split("/")[2]);
    const index = todolist.findIndex((todo) => todo.id === id);

    if (index !== -1) {
        todolist.splice(index, 1);
    }

    res.writeHead(302 , {
        Location: "/"
    });

    res.end();
}

  if(req.url == "/todo-edit-post"){
  
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });

    req.on("end", () => {

        const formData = new URLSearchParams(body);

        const title = formData.get("title");
        const id = formData.get("id");
        const status = formData.get("status")

        const existingTodo = todolist.find((todo)=> todo.id == id);
        existingTodo.title = title;
        existingTodo.status = status;

        res.writeHead(302, {
            "Location": "/"
        });

        res.end();
    });
  }
});


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
