window.onload = function(){
    progressBar = new ProgressBarAdapter(document.getElementById("progress_bar"), document.getElementById("progress_container"),
                                        document.getElementById("progress_bar_default_text"));
    initLanguage();
    loadServerData();

    var btn_next = document.getElementById("btn_next");
    btn_next.addEventListener("click", submitNext);
}

function submitNext(){
    chrome.storage.local.get("categories",function(item){
        if(item.categories){
            window.location.href = "../startup_view/startup.html";
        }
    });
}

function completeForm(){
    chrome.storage.local.set({"navigation" : "startup_view/startup.html"});
    chrome.storage.local.remove("delegationCache");
    progressBar.finish();

    var loader = document.getElementById("loader_container");
    loader.style.display = "none";

    var img_success = document.getElementById("img_success");
    img_success.style.display = "inline";

    var title = document.getElementById("title_text");
    title.innerText = chrome.i18n.getMessage("title_fin_loaded");

    var message = document.getElementById("message_text");
    message.innerText = chrome.i18n.getMessage("message_fin_loaded");

    var btn_next = document.getElementById("btn_next");
    btn_next.style.display = "inline";
}

function loadServerData(){
    var params = new ParamsWaiter(2, function(){
        chrome.storage.local.set({"isConfigured" : "true"}, function(){
            clearStorage(completeForm);
        });
    });
    var workingLanguage = chrome.i18n.getUILanguage().split("-")[0];
    loadCategories(workingLanguage, storeCategories, params);
    loadStatuses(storeStatuses, params);
}

function loadCategories(lang, callback, selfParams){
    chrome.storage.local.get("server_addr", function(item){
        if(item.server_addr){
            var url = item.server_addr + "/api/v1/categories?page[size]=300&filter[lang]=" + lang;
            var method = "GET";
            var request = new XMLHttpRequest();

            request.open(method,url,true);
            request.onload = function() {
                //if something went wrong
                if (this.status !== 200){
                    handleRESTCallError(this);
                }

                //if everything went ok just collect all category pages and store them.
                var response = JSON.parse(this.responseText);
                var total = parseInt(response.meta.page["total"]);

                //if the requested language is not supported by the server, we have to perform
                //the REST call using English as the requested language
                if(total === 0 && lang !== "en"){
                    loadCategories("en", callback, selfParams); //English HAS to be supported by any server as of the server specs
                }else{
                    progressBar.increment(32);
                    storeCategories(response, selfParams);
                }
            };
            request.onerror = function() {
                alert(chrome.i18n.getMessage("error_msg_setup"));
                window.location.href="../setup_view/credentials.html";
            };
            request.timeout = 20000;
            request.ontimeout = function(){
                alert(chrome.i18n.getMessage("error_msg_setup"));
                window.location.href="../setup_view/credentials.html";
            };
            chrome.storage.local.get("bearer_token", function(item){
                if(item.bearer_token){
                    request.setRequestHeader("Content-type", "application/vnd.api+json");
                    request.setRequestHeader("Authorization", item.bearer_token);
                    request.send();
                }else{
                    handleRESTCallError(null);
                }
            });
        }else{
            handleRESTCallError(null);
        }
    });
}

function storeCategories(categoryObject, params){
    var categories = {};
    var categoriesFull = [];

    //Prepare the categories
    var length = categoryObject.data.length;
    for (var i = 1; i < length; i++){
        categoriesFull.push(categoryObject.data[i]);
    }

    categoriesFull.sort(function(a, b){
        return parseInt(a.id) - parseInt(b.id);
    });
    
    //Parse the categories
    for(var i = 0; i < categoriesFull.length; i++){
        var id = categoriesFull[i].id;
        var name = categoriesFull[i].attributes.maincategory;
        var desc = categoriesFull[i].attributes.description;
        var lastPart = parseInt(id.substring(2,4));
        var mainCategory = {};
        if(lastPart === 0){
            i++;
            var subcategories = [];
            var lastPartSub = parseInt(((categoriesFull[i].id).substring(2,4)));
            while(lastPartSub !== 0 && i < categoriesFull.length-1){
                var subId = categoriesFull[i].id;
                var subName = categoriesFull[i].attributes.subcategory;
                var subDesc = categoriesFull[i].attributes.description;
                var subcategory = {"id" : subId, "name" : subName, "desc" : subDesc};
                subcategories.push(subcategory);
                i++;
                lastPartSub = parseInt(((categoriesFull[i].id).substring(2,4)));
            }
            i--;
            var mainId = id.substring(0,2) + "00";
            categories[mainId] = {"id" : id, "name" : name, "subcategories" : subcategories, "desc" : desc};
        }
    }
    chrome.storage.local.set({"categories" : categories}, function(){
        params.addParam(1, 1);
    });
}

function loadStatuses(callback, params){
        chrome.storage.local.get("server_addr", function(item){
        if(item.server_addr){
            var server_addr = item.server_addr;
            var url = server_addr + "/api/v1/statuses";
            var method = "GET";
            var request = new XMLHttpRequest();
            
            request.open(method,url,true);
            request.onload = function() {
                if (this.status !== 200){
                    handleRESTCallError(this);
                }

                var response = JSON.parse(this.responseText);
                progressBar.increment(33);
                callback(response, params);
            };
            request.onerror = function(e) {
                alert(chrome.i18n.getMessage("error_msg_setup"));
                window.location.href="../setup_view/credentials.html";
            };
            request.timeout = 20000;
            request.ontimeout = function(){
                alert(chrome.i18n.getMessage("error_msg_setup"));
                window.location.href="../setup_view/credentials.html";
            }
            chrome.storage.local.get("bearer_token", function(item){
                if(item.bearer_token){
                    request.setRequestHeader("Content-type", "application/vnd.api+json");
                    request.setRequestHeader("Authorization", item.bearer_token);
                    request.send();
                }else{
                    handleRESTCallError(null);
                }
            });
        }else{
            handleRESTCallError(null);
        }
    });
}

function storeStatuses(item, params){
    var  statuses = {};
    if(item){
        for(var key in item.data){
            if(item.data[key]){
                statuses[item.data[key].attributes.status] = item.data[key].attributes["measurement-status-id"];
            }
        }
    }
    chrome.storage.local.set({"statuses" : statuses},function(){
        params.addParam(2, 2);
    });
}

function initLanguage(){
    var title_text = document.getElementById("title_text");
    title_text.innerText = chrome.i18n.getMessage("title_fin");

    var message_text = document.getElementById("message_text");
    message_text.innerText = chrome.i18n.getMessage("message_fin");

    var btn_next = document.getElementById("btn_next");
    btn_next.innerText = chrome.i18n.getMessage("next");
}

function ProgressBarAdapter(barElement, containerElement, defaultElement){
    this.bar = barElement;
    this.container = containerElement;
    this.defaultElement = defaultElement
}
ProgressBarAdapter.prototype.increment = function(amount){
    if(this.bar.offsetWidth === 0){
        this.defaultElement.style.display = "none";
    }

    var width = parseInt(this.bar.offsetWidth/this.container.offsetWidth*100);
    width += amount;
    width = width <= 99 ? width : 99;
    this.bar.style.width = width + "%";
    this.bar.innerText = width + "%";
}
ProgressBarAdapter.prototype.finish = function(){
    this.bar.style.width = "100%";
    this.bar.innerText = "100%";
}