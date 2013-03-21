var connect = require("connect");
var server = connect()
    .use(connect.static("app"))
    .use(function (request, response) {
    response.statusCode = 403;
    response.end("403: Bad Request!");

    })
    .listen(3000);

console.log('*** Statewide Planning Map is running on port 3000 ***');
