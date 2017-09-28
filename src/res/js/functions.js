function clearStorage(callback){
    //cleans up the storage after a classification was submitted;

    //Async calls for the storage-reset with the callback function that is executed when all the storage clears are done
    //I am using arbitrary key-value pairs as parameters here --> the content does not really matter here, i just want to
    //use these functions asyncly
    var params = new ParamsWaiter(7, callback);
    chrome.storage.local.remove("selectionCaller", function(){
        params.addParam(1, 1)
    });
    chrome.storage.local.remove("mainCategory", function(){
        params.addParam(2, 2)
    });
    chrome.storage.local.remove("subcategory", function(){
        params.addParam(3, 3);
    });
    chrome.storage.local.remove("navigation", function(){
        params.addParam(4, 4);
    });
    chrome.storage.local.remove("currentSite",function(){
        params.addParam(5, 5);
    });
    chrome.storage.local.remove("navigationMeasurement", function(){
        params.addParam(6, 6);
    });
    chrome.storage.local.remove("finalUrl", function(){
        params.addParam(7, 7);
    });
}

function loadSite(newUrl, callback){
    chrome.tabs.update(null, {url: newUrl}, function(){
        if(callback){
            callback();
        }
    });
}

function enableButton(button, title){
    button.classList.add("button_enabled");
    button.classList.remove("button_disabled");
    button.setAttribute("title", title);
    button.disabled = false;
}

function disableButton(button, title){
    button.classList.add("button_disabled");
    button.classList.remove("button_enabled");
    button.setAttribute("title", title);
    button.disabled = true;
}


function fetchSite(callback){
    chrome.storage.local.get("domainCache", function(item){
        var domain = item.domainCache;
        if (domain){
            chrome.storage.local.set({"currentSite" : domain}, function(){
                chrome.storage.local.remove("domainCache", function(){
                    chrome.storage.local.set({"navigation" : "../measurement_view/measurement.html"}, function(){
                        loadSite(domain.url, callback);
                    });
                });
            });
        }else{
            loadDomainFromServer(callback);
        }
    });
}

function loadDomainFromServer(callback){
    chrome.storage.local.get("server_addr", function(itemServer){
        if(itemServer.server_addr){
            chrome.storage.local.get("secondaryLanguages", function(itemLang){
                var lang;
                if(itemLang.secondaryLanguages){
                        lang = itemLang.secondaryLanguages.toString();
                }
                if(!lang){
                    var prim = chrome.i18n.getUILanguage().split("-")[0];
                    lang = prim ? prim : "en";
                }

                var url = itemServer.server_addr + "/api/v1/fetch?filter[lang]=" + lang;
                var method = "GET";
                var request = new XMLHttpRequest();

                request.open(method,url,true);
                request.onload = function() {
                    //if something went wrong
                    if(this.status !== 200){
                        handleRESTCallError(this);
                    }else{
                        storeDomain(this, callback);
                    }
                }
                request.timeout = 20000;
                request.ontimeout = function(e){
                    clearStorage(function(){
                        alert(chrome.i18n.getMessage("error_msg_connErr"));
                        window.location.href = "../startup_view/startup.html";
                    });
                };
                request.onerror = function() {
                    clearStorage(function(){
                        alert(chrome.i18n.getMessage("error_msg_connErr"));
                        window.location.href = "../startup_view/startup.html";
                    });
                };

                chrome.storage.local.get("bearer_token", function(item_bearer){
                    if(item_bearer.bearer_token){
                        request.setRequestHeader("Content-type", "application/vnd.api+json");
                        request.setRequestHeader("Authorization", item_bearer.bearer_token);
                        request.send();
                    }else{
                        handleRESTCallError(null);
                    }
                });
            });
        }else{
            handleRESTCallError(null);
        }
    });
}

function storeDomain(body, callback){
    var response = JSON.parse(body.responseText);
    var id = response.data.id;
    var domainName = response.data.attributes["domain-name"];
    var url = ("http://www." + domainName);
    var site = {"id" : id,
                "url" : url,
                "domainName" : domainName};

    chrome.storage.local.get("currentSite", function(item){
        if(!item.currentSite){
            chrome.storage.local.set({"currentSite" : site},function(){
                loadSite(url, callback);
            });
        }else{
            chrome.storage.local.set({"domainCache" : site});
        }
    });
}

function initPostRest(params, callback){
    chrome.storage.local.get("server_addr", function(item){
        if(item.server_addr){
            var url = item.server_addr + "/api/v1/measurements";
            var data = JSON.stringify(createMeasurementBody(params));
            var method = "POST";
            var request = new XMLHttpRequest();

            request.open(method,url,true);
            request.onload = function(){
                if (this.status !== 200){
                    handleRESTCallError(this);
                }else if (callback){
                    callback();
                }
            };
            request.timeout = 20000;
            request.ontimeout = function(e){
                clearStorage(function(){
                    alert(chrome.i18n.getMessage("error_msg_connErr"));
                    window.location.href ="../startup_view/startup.html";
                });
            };
            request.onerror = function() {
                clearStorage(function(){
                    alert(chrome.i18n.getMessage("error_msg_connErr"));
                    window.location.href ="../startup_view/startup.html";
                });
            };
            
            chrome.storage.local.get("bearer_token", function(item){
                if(item.bearer_token){
                    request.setRequestHeader("Content-Type", "application/vnd.api+json");
                    request.setRequestHeader("Authorization", item.bearer_token);
                    request.send(data);
                }else{
                    handleRESTCallError(null);
                }
            });
        }else{
            handleRESTCallError(null);
        }
    });
}

function classify(status, confidence, callback){
    chrome.tabs.update(null, {url: "about:blank"})

    //ParamsWaiter is defined at the bottom of this file
    var paramsWaiter = new ParamsWaiter(5, function(){
        initPostRest(paramsWaiter, callback);
    });

    paramsWaiter.addParam("status", status)
    paramsWaiter.addParam("confidence", confidence)
    chrome.storage.local.get("subcategory", function(item){
        if (item.subcategory){
            paramsWaiter.addParam("categoryId",item.subcategory);
        }else{
            chrome.storage.local.get("mainCategory", function(item){
                if(item.mainCategory){
                    paramsWaiter.addParam("categoryId",item.mainCategory.id);
                }else{
                    paramsWaiter.addParam("categoryId",null);
                }
            });
        }
    });
    chrome.storage.local.get("currentSite", function(item){
        if(item.currentSite && item.currentSite.id){
            paramsWaiter.addParam("domainId", item.currentSite.id);
        }
    });
    chrome.storage.local.get("finalUrl", function(item){
        if(item.finalUrl){
            paramsWaiter.addParam("url", item.finalUrl);
        }
    });
}

function createMeasurementBody(params){
    var categoryDataContent = null;
    if(params.categoryId){
        categoryDataContent = {
                                "type": "categories", 
                                "id":  params.categoryId + ""
                            };
    }
     return {
         "data": {
            "type": "measurements",
            "attributes": {
                "finalurl": params.url,
                "confidence": params.confidence ? params.confidence : 0
            },
            "relationships": {
                "domains": {
                    "data": {
                        "type": "domains",
                        "id": params.domainId ? (params.domainId  + "") : "0"
                    }
                },
                "categories": {
                    "data": categoryDataContent
                },
                "statuses": {
                    "data": {
                        "type": "statuses",
                        "id": params.status + ""
                    }
                }
            }
        }
    }
}

function handleRESTCallError(response){
    //Used when the response status of an xmlhttprequest != 200 (success)

    //Error 401 (unauthorized -- bearer token is probably false)
    //and Error 404 (resource not found -- server might be implemented differently than what the specification states)
    //are addressed specifically, because these two might be debugable easily
    var errorMsg;
    var navigation = "/startup_view/startup.html";
    if(response){
        errorMsg = "Error " + response.status;
         switch (response.status){
            case 401 : {
                errorMsg += ":\n" + chrome.i18n.getMessage("error_msg_401");
                navigation = "/setup_view/credentials.html";
                break;
            }
            case 404 : {
                errorMsg += ":\n" + chrome.i18n.getMessage("error_msg_404");
                break;
            }
            default : {
                errorMsg += "\n" + chrome.i18n.getMessage("go_to_settings");
            }
        }
    }else{
        errorMsg = chrome.i18n.getMessage("error_msg_default");
        navigation = "/setup_view/credentials.html";
    }
    alert(errorMsg);
    window.location.href=navigation;
}

//ParamsWaiter(maxParams, callback) waits for [maxParams] parameters to be passed;
//In the case of the function classify() it waits for 4 parameters to be passed --> once they have been passed, the callback is executed
//this is useful when we need to wait for several concurrent async functions to finish
function ParamsWaiter(maxParams, callback){
    this.maxParams = maxParams;
    this.numParams = 0;
    this.onSuccess = callback;
}
ParamsWaiter.prototype.addParam = function(paramKey, paramValue){
    this[paramKey] = paramValue;
    this.numParams = parseInt(this.numParams) + 1;
    this.checkForFinish();
}
ParamsWaiter.prototype.checkForFinish = function(){
    if(this.numParams !== this.maxParams){
        return;
    }    
    this.onSuccess();
}