window.onload = function(){
    initLanguage();
    initFormValues();
    chrome.storage.local.set({"navigation" : "setup_view/credentials.html"});

    //check whether the user comes from the settings menu --> if that is the case enable the back button, which 
    //navigates back to startup.html (which is where the user came from)
    chrome.storage.local.get("isConfigured", function(item){
        if(item.isConfigured && (item.isConfigured === "true")){
            var img_back = document.getElementById("img_back");
            img_back.hidden = false;
            img_back.addEventListener("click", back);
            //also adjust the "next"-button text
            btnNext.innerHTML = chrome.i18n.getMessage("finish");
        }
    });

    //init eventListeners
    var txt_server = document.getElementById("txt_server_url");
    txt_server.addEventListener("input", checkIfFinished);

    var txt_token = document.getElementById("txt_token");
    txt_token.addEventListener("input", checkIfFinished);

    var btnNext = document.getElementById("btn_next");
    btnNext.addEventListener("click", submitNext);
}

function back(){
    removeCache(function(){
        window.location.href = "../startup_view/startup.html";
    });
}

function initFormValues(){
    chrome.storage.local.get("server_addr_cache", function(item){
        var txt_server_url = document.getElementById("txt_server_url");
        if(item.server_addr_cache){
            txt_server_url.value = item.server_addr_cache;
            checkIfFinished();
        }else{
            chrome.storage.local.get("server_addr", function(itemOrig){
                if(itemOrig.server_addr){
                    txt_server_url.value=itemOrig.server_addr;
                    checkIfFinished();
                }
            });
        }
    });

    chrome.storage.local.get("bearer_token_cache", function(item){
        var txt_token = document.getElementById("txt_token");
        if(item.bearer_token_cache){
            txt_token.value = item.bearer_token_cache;
            checkIfFinished();
        }else{
            chrome.storage.local.get("bearer_token", function(itemOrig){
                if(itemOrig.bearer_token){
                    txt_token.value = itemOrig.bearer_token;
                    checkIfFinished();
                }
            });
        }
    });
}

function checkIfFinished(){
    var btn = document.getElementById("btn_next");
    if(isFormFilled()){
        if(btn.disabled){
            toggleButton(btn);
        }
    }else{
        if(!btn.disabled){
            toggleButton(btn);
        }
    }
    saveData();
}

function saveData(){
    var server_input = document.getElementById("txt_server_url").value;
    var token_input = document.getElementById("txt_token").value;
    document.getElementById("txt_server_url").setAttribute("title", server_input);

    if(server_input !== ""){
        chrome.storage.local.set({"server_addr_cache" : server_input});
    }
    if(token_input !== ""){
        chrome.storage.local.set({"bearer_token_cache" : token_input});
    }
}

function isFormFilled(){
    var server_input = document.getElementById("txt_server_url").value;
    var token_input = document.getElementById("txt_token").value;
    if(server_input === "" || token_input === "") {
        return false;
    }
    return true;
}

function toggleButton(button){
    if(button.disabled){
        enableButton(button, "");
    }else{
        disableButton(button, chrome.i18n.getMessage("button_next_title_cred"));
    }
}

function submitNext(){
    if(isFormFilled()){
        var params = new ParamsWaiter(2, function(){
            removeCache(function(){
                chrome.storage.local.get("isConfigured", function(item){
                    if(item.isConfigured && (item.isConfigured === "true")){
                        window.location.href = "finished.html";
                    }else{
                        window.location.href = "languages.html";
                    }
                })
            });
        });

        chrome.storage.local.set({"server_addr" : document.getElementById("txt_server_url").value}, function(){
            params.addParam(1, 1);
        });
        chrome.storage.local.set({"bearer_token" : document.getElementById("txt_token").value}, function(){
            params.addParam(2, 2);
        });
    }
}

function removeCache(callback){
    var params = new ParamsWaiter(2, callback)
    chrome.storage.local.remove("server_addr_cache",function(){
        params.addParam(1, 1);
    });
    chrome.storage.local.remove("bearer_token_cache", function(){
        params.addParam(2, 2);
    });
}

function initLanguage(){
    var img_back = document.getElementById("img_back");
    img_back.setAttribute("title", chrome.i18n.getMessage("back"));

    var title = document.getElementById("title_text");
    title.innerText = chrome.i18n.getMessage("title_cred");

    var label_server_url = document.getElementById("label_server_url");
    label_server_url.innerText= chrome.i18n.getMessage("label_server_url");

    var label_token = document.getElementById("label_token");
    label_token.innerText = chrome.i18n.getMessage("label_token");

    var img_info = document.getElementById("img_info");
    img_info.setAttribute("title", chrome.i18n.getMessage("img_info_cred"));

    var btn_next = document.getElementById("btn_next");
    btn_next.innerText = chrome.i18n.getMessage("next");
    btn_next.setAttribute("title", chrome.i18n.getMessage("button_next_title_cred"));
}
