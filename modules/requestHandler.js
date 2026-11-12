

function handleHttpRequest(request, response){

    console.log("Handler is called", request.url);

    if (request.url == "/") {

        response.end("<h1>List</h1>");
    }
    else if(request.url =="/login"){
        response.end("<h1>Login</h1>");
    }
    else{
        response.end("<h1>Hello</h1>");
    }
    
}

module.exports = handleHttpRequest;