/*********************************************
* NodeJs based server to compute response times of given websites
* @author : Richa Lakhe
* References:
* - HTTP Requests : https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
* - 
**********************************************
*/
var http = require('http');
var fs = require('fs');
var parser = require('url');

// Global Maps
var handlers = {}; // Maps URL to its handler. Key = HTTP_Method + URL , Value = UrlHandler
var testHandleToResultMap = {}; // Maintains tests results, mapped by their handle. Key = Test Handle, Val = Test Result.
var testStatusMap = {}; // Maintains map of testHandle to testStatus.

//**************** URL handler definitions **************
function handlePostStartTest(req, res) {
  var body = [];
  req.on('error', function(err) {
    console.error(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();
    //console.log(body);
    // Error handler for response.
    res.on('error', function(err) {
	      console.error(err);
	});

    // Now that we have all body in array, get JSON object from it.
    var reqObject = JSON.parse(body);
    console.log(reqObject.sitesToTest);
    var sitesToTest = reqObject.sitesToTest;
    // Generate test Handle for this new Test. Assume unix epoch time is valid for use as Handle.
    var testHandle = Date.now();
    // Update the global test results map with this handle.
    testHandleToResultMap[testHandle] = {}; // empty result to start with.
    testStatusMap[testHandle] = "started";
    // Iterate the given sites and trigger processing for them.
    for (siteIndex = 0; siteIndex < sitesToTest.length; siteIndex++) {
    	console.log('Starting test for site [%s]', sitesToTest[siteIndex]);
    	// Trigger processing for this Site. Processing will happen in background. Will fill testHandleToResultMap with results.
    	calcResponseTime(sitesToTest[siteIndex], reqObject.iterations, siteIndex, sitesToTest.length, testHandle, res);
    }

    // Generate Response to include Test Handle and Test Status.
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	var testStartResp = {
		testHandle : testHandle,
		status : 'started'
	};
	res.write(JSON.stringify(testStartResp));
	// Send response now. Processing will happen in background.
	res.end();
  });
}

function handleGetTestStatus(req, res) {
	var requestedTestHandle = getParameterByName('testHandle', req.url);
	
	// Fetch test Results from global Map.
	var testResult = testHandleToResultMap[requestedTestHandle];
	var testStatus = testStatusMap[requestedTestHandle];
	// Return 400 if TestHandle is not found.
	if (testResult === null || testResult == null || testStatus == null || testStatus === null) {
		console.error("ERROR: Couldn't find Test result for test handle [%s]", requestedTestHandle == null ? "NULL" : requestedTestHandle);
		// Write ERROR response
		res.writeHead(400, {'Content-Type': 'text/plain'});
    	res.write('Invalid testHandle ' + requestedTestHandle.toString());
    	res.end();
    	return;

	}
    
	// Write SUCCESS response with test status.
	var result = {
		testHandle : requestedTestHandle,
		status : testStatus
	}
	res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(result));
    res.end();
}

function handleGetTestResults(req, res) {
	var requestedTestHandle = getParameterByName('testHandle', req.url);

	// Fetch test Results from global Map.
	var testResult = testHandleToResultMap[requestedTestHandle];
	var testStatus = testStatusMap[requestedTestHandle];
	// Return 400 if TestHandle is not found or test is in progress.
	if (testResult === null || testResult == null || testStatus == null || testStatus === null) {
		console.error("ERROR: Couldn't find Test result for test handle [%s]", requestedTestHandle);
		// Write ERROR response
		res.writeHead(400, {'Content-Type': 'text/plain'});
    	res.write('Invalid testHandle ' + requestedTestHandle.toString());
    	res.end();
    	return;

	}
	if (testStatus === 'started') {
		console.log("Test associated with test handle [%s] is in progress. Returning 400", requestedTestHandle);
		// Write ERROR response
		res.writeHead(400, {'Content-Type': 'text/plain'});
    	res.write('Test is in progress ' + requestedTestHandle.toString());
    	res.end();
    	return;
	}
    
	// Write SUCCESS response.
	var result = [];
	for (var siteName in testResult) {         //iterate over map
		var siteResult = testResult[siteName];
		result.push(siteResult);          //push can be used to write in array
	}
	res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(result));
    res.end();
}

function handleGetAllTests(req, res) {
	var allTestHandles = [];
	for (var testHandle in testStatusMap) {
		allTestHandles.push(testHandle);
	}
	var result = {
		handles: allTestHandles
	}
	res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(result));
    res.end();
}

//**************** END URL handler definitions **************

// **************** Register URL handlers *******************
register('POST', '/startTest', handlePostStartTest);
register('GET', '/testStatus', handleGetTestStatus);
register('GET', '/testResults', handleGetTestResults);
register('GET', '/allTests', handleGetAllTests);

// ************** END URL handler registrations *************

/*
Processes the given site in background. Will fill testHandleToResultMap with results for given site.
*/
function calcResponseTime(site, iterations, siteIndex, numOfSites, testHandle, currentResponse) {
	// Map which stores the calculated results for given site.
	var result = {};
	var startTime = Date.now();
	var siteHostName = getHostFromUrl(site);
	
    /*console.log('Calucating response for site [%s] with iterations [%s], this is site [%d] / [%d] . TestHandle = [%s]',
    siteHostName, iterations, siteIndex+1, numOfSites, testHandle);*/

    // Update global map with empty test result for this site.
    // TODO: Ideally response times should be zeroed based on user given iterations, instead of hardcoding it here.
    var siteResult = {
    	site : siteHostName,
		avg : 0,
		max : 0,
		min : 0,
		startTestTime : startTime,
		endTestTime : Date.now(),
		iterations : iterations,
		curIterations : 0,
		curResponseTimes : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
    var curSiteResultsMap = testHandleToResultMap[testHandle];
    if (curSiteResultsMap === null) {
    	/*console.log('Current site results map empty for testHandle [%s]. Initializaing Map with empty results for site [%s]',
    		testHandle, siteHostName);*/
    	curSiteResultsMap = {};
    }
    curSiteResultsMap[siteHostName] = siteResult;
    // Put it back with testHandle
    testHandleToResultMap[testHandle] = curSiteResultsMap;


    // Trigger HTTP GET on given site and callback function has all the logic to update test results in global map.
    var request = {
		host : siteHostName,
		port : 80
	};
	for (iterationCount = 0; iterationCount < iterations; iterationCount++) {
	http.get(request, function (res) {
		// Compute the response time.
		var responseTime = Date.now()-startTime;
		// Lets use Host name as the key for storing site results.
		var host = res.req._headers.host;
        // Retrieve the test result from testHandle.
        console.log('Received response for site [%s] testHandle [%s], request took [%d]', host, testHandle, responseTime);
        var curSiteResultsMap = testHandleToResultMap[testHandle];
        if (curSiteResultsMap === null) {
        	console.error("ERROR: Cannot find testHandle [%s] associated with site[%s]", testHandle, host);
        	return;
        }
        // Retrieve existing result for this site from TestResult.
        var curSiteResult = curSiteResultsMap[host];
        if (curSiteResult === null) {
        	console.error("ERROR: Cannot find siteResult for site [%s], associated with testHandle [%s]", host, testHandle);
                return;
        }

        //console.log("Will update the response info for site [%s]", host);
        var curIterations = curSiteResult.curIterations;
        // Add the response time to internal array, using iteration as index. Array is zero-indexed to increment curIterations later.
        var curResponseTimes = curSiteResult.curResponseTimes;
        curResponseTimes[curIterations] = responseTime;
        // Increment and Update iteration count.
        curIterations++;
        curSiteResult.curIterations = curIterations;
        // Compute and update average, min and max, by iterating through all the responseTimes we have so far.
        var newAvg = 0;        
        for (valIndex = 0; valIndex < curSiteResult.iterations; valIndex++) {
        	newAvg = newAvg + curResponseTimes[valIndex];
        	if (curSiteResult.min > responseTime || curSiteResult.min === 0) {
        		curSiteResult.min = responseTime;
        	}
        	if (curSiteResult.max < responseTime) {
        		curSiteResult.max = responseTime;
        	}
        }
        newAvg = newAvg / curSiteResult.iterations;
        curSiteResult.avg = newAvg;

        // If TEST HAS COMPLETED!!, Update end time only if this is last iteration of test for this site.
        if (curSiteResult.iterations == curIterations) {
        	curSiteResult.endTestTime = Date.now();
        	// Nullify non-required fields from result.
        	delete curSiteResult["curIterations"];
        	delete curSiteResult["curResponseTimes"];
        	// Update status of Test
        	testStatusMap[testHandle] = "finished";
        	// Write test result to file.
        	writeTestToFile("alltests.txt", curSiteResult);
        }
        // Push the site result back in the map.
        curSiteResultsMap[host] = curSiteResult;
        // Push the site results map back to global Test Results Map.
        testHandleToResultMap[testHandle] = curSiteResultsMap;

        /*console.log("Updated Response for site [%s] after iteration [%d] is : %s",
        	host, curIterations, JSON.stringify(curSiteResult));*/
        //console.log("Updated TestResult for handle [%s] is : %s", testHandle, JSON.stringify(testHandleToResultMap));
	}); // http GET handler ends here.
  } // iteration for loop ends here.
}


/*
Start server which will route the requests to right handlers.
*/
var server = http.createServer(function (req, res) {
	// Get handler for this request.
    handler = route(req);
    // Ask handler to process the request.
    handler.process(req, res);
});

/*
Method which stores mapping of a URL to its handler in global map.
*/
function register(httpMethod, url, urlHandler) {
	// Key = HTTP_Method + URL , Value = UrlHandler
	handlers[httpMethod.concat(url)] = createHandler(urlHandler);
	console.log('Registering handler for URL [%s]', httpMethod.concat(url));
}

/*
This method routes the 'req' to its assigned handler.
Handlers are registered for URLs using 'register' method.
*/
function route (req) {
    url = parser.parse(req.url, true);
    console.log('Routing request [%s]', req.method.concat(url.pathname));
    var handler = handlers[req.method.concat(url.pathname)];
    // TODO: include logic to handler unsupported URLs in better manner.
    //if (!handler) handler = this.missing(req)
    if (!handler) console.log('Invalid URL. Not handling the request!');
    return handler;
}

/*
Definition of the URL handler.
Handlers exposes 'process' method which in-turn will
process the URL request by executing the given 'method'.
*/
function Handler(method) {
  this.process = function(req, res) {
  	console.log('Processing request %s %s', req.method, req.url);
    params = null;
    return method.apply(this, [req, res, params]);
  }
}

/*
Create a new Handler instance for given method.
*/
function createHandler (method) {
	console.log('Returning a new Handler from factory.');
    return new Handler(method);
}

function getHostFromUrl(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function writeTestToFile(fileName, result) {
	console.log("Result is : %s", JSON.stringify(result));
	fs.appendFileSync('alltests.txt', JSON.stringify(result));
}



// Start it up
server.listen(8000);
console.log('Server running');
