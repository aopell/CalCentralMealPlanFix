chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type == "fetch" && request.url !== undefined) {
            console.debug("Received fetch request for " + request.url);

            (async function () {
                let finalResponse = {};
                let responseObj;
                try {
                    responseObj = await fetch(request.url, request.params);
                } catch (e) {
                    finalResponse.success = false;
                    finalResponse.error = e;
                    return finalResponse;
                }

                finalResponse.success = true;

                finalResponse.headers = responseObj.headers;
                finalResponse.ok = responseObj.ok;
                finalResponse.redirected = responseObj.redirected;
                finalResponse.status = responseObj.status;
                finalResponse.statusText = responseObj.statusText;
                finalResponse.type = responseObj.type;
                finalResponse.url = responseObj.url;
                finalResponse.useFinalURL = responseObj.useFinalURL;

                try {
                    switch (request.bodyReadType) {
                        case "json":
                            finalResponse.json = await responseObj.json();
                            break;
                        case "text":
                            finalResponse.text = await responseObj.text();
                            break;
                    }
                } catch (e) {
                    finalResponse.bodyReadError = e || true;
                }
                console.debug("Returning:", finalResponse);
                return finalResponse;
            })().then(x => sendResponse(x));

            return true;
        }
    }
);