/*
* Primary file for API
*
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

//Instantiate the HTTP server
var httpServer = http.createServer(function(req,res){
    unifiedServer(req, res);
});

//Start the HTTP server
httpServer.listen(config.httpPort, function() {
    console.log("The server is listening on port: "+config.httpPort);
});

//Instantiate the HTTPS server
var httpServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpServerOptions, function(req, res) {
    unifiedServer(req, res);
});


//Start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
    console.log("The server is listening on port: "+config.httpsPort);
});

//All the server logic for both the http and https server
var unifiedServer = function(req, res) {
    //Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    //Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the HTTP method
    var method = req.method.toLowerCase();
    var queryStringObject = parsedUrl.query;

    var headers = req.headers;

    //Get the payload, if any

    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    //data emit callback
    req.on('data', function(data){
        buffer += decoder.write(data);
        //buffer1 = '';
        //buffer1 += data;
        //console.log(buffer1);
    });

    req.on('end', function(){
        buffer += decoder.end();

        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath]:handlers.notFound;

        //Construct the data object to send to this handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        }

        //Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload) {
            //use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            //Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log the request path
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
};

//Define the handlers
var handlers = {};

//Hello handler 

handlers.hello = function(data, callback) {
    var responseObj = {
        'Hello' : 'This is your response back in JSON format',
    }
    callback(200, responseObj);
}

//Ping handler
handlers.ping = function(data, callback) {
    callback(200); 
};

handlers.notFound = function(data, callback) {
    //Callback an HTTP status code and payload object
    callback(404);
};

var router = {
    'ping' : handlers.ping,
    'hello' : handlers.hello,
}


