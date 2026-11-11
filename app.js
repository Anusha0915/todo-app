const http = require("node:http");

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
