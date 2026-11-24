const http = require("node:http");
const handler = require("./modules/requestHandler")
const server = http.createServer(handler);
const PORT = 3001
server.listen(PORT,()=>console.log("server is running on localhost:"+PORT));

 