window.onload = function(){
    initLanguage();
    chrome.storage.local.set({"navigation" : "setup_view/languages.html"});

    //initiate the secondary language list values
    initListOptions(document.getElementById("sel_sec_lang"),getSecondaryLanguages());
    initListSelection();
    updateListSecondary();

    var img_back = document.getElementById("img_back");
    chrome.storage.local.get("isConfigured", function(item){
        var backPath;
        if(item.isConfigured && (item.isConfigured === "true")){
            backPath = "../startup_view/startup.html";
        }else{
            backPath = "../setup_view/credentials.html";
        }
        img_back.addEventListener("click", function(){back(backPath);});
    });

    //use the select2 select dropdown list style
    var selectionEvents = $(".select2").select2({
                            "language" : chrome.i18n.getUILanguage().split("-")[0]
                          });
    selectionEvents.on("change", onSelectionChange);

    var btnNext = document.getElementById("btn_next");
    btnNext.addEventListener("click", submitNext);
}

function back(backPath){
    removeCache(function(){
        window.location.href = backPath;
    });
}

function onSelectionChange(){
    chrome.storage.local.set({"secondaryLanguages_cache" : $("#sel_sec_lang").val()}, function(){
        checkIfFinished();
    });
}

function checkIfFinished(){
    var btn_next = document.getElementById("btn_next");
    if(btn_next.disabled){
        if(isFormFilled()){
            enableButton(btn_next, "");
        }
    }else{
        if(!isFormFilled()){
            disableButton(btn_next, chrome.i18n.getMessage("btn_next_title_language"));
        }
    }
}

function isFormFilled(){
    if(document.getElementById("sel_sec_lang").value === ""){
        return false;
    }
    return true;
}

function initListOptions(element, lang){
    for(var i = 0; i < lang.length; i++){
        var opt = document.createElement("option");
        opt.value = lang[i].code;
        opt.innerText = lang[i].name;
        element.appendChild(opt);
    }
}

function initListSelection(){
    chrome.storage.local.get("secondaryLanguages_cache", function(item){
        if(item.secondaryLanguages_cache){
            $("#sel_sec_lang").val(item.secondaryLanguages_cache).trigger("change");
        }else{
            chrome.storage.local.get("secondaryLanguages", function(itemOrig){
                if(itemOrig && itemOrig.secondaryLanguages){
                    $("#sel_sec_lang").val(itemOrig.secondaryLanguages).trigger("change");
                }
            });
        }
    });
}

function updateListSecondary(){
    /*On detecting a primary language, the secondary language field should be updated accordingly:
    *    If the primary language isnt listed in the secondary field yet, it should be added there too
    */
    var secondary = $("#sel_sec_lang").val();
    var primary = chrome.i18n.getUILanguage().split("-")[0];
    var btn_next = document.getElementById("btn_next");
    var primExistsInSecList = false;

    if(primary !== ""){
        if(!secondary){
            $("#sel_sec_lang").val([primary]).trigger("change");
            enableButton(btn_next,"");
        }else{
            for(var i = 0; i < secondary.length; i++){
                if(secondary[i] === primary){
                    primExistsInSecList = true;
                }
            }
            if(!primExistsInSecList){
                var allLang = secondary;
                allLang.push(primary);
                $("#sel_sec_lang").val(allLang).trigger("change");
                enableButton(btn_next,"");
            }
        }
    }
}
function removeCache(callback){
    chrome.storage.local.remove("secondaryLanguages_cache", function(){
        callback();
    });
}
function submitNext(){
    if(isFormFilled()){
        removeCache(function(){
            var secondary = $("#sel_sec_lang").val();
            chrome.storage.local.set({"secondaryLanguages" : secondary}, function(){
                window.location.href = "finished.html"
            });
        });
    }
}

function initLanguage(){
    var img_back = document.getElementById("img_back");
    img_back.setAttribute("title", chrome.i18n.getMessage("back"));

    var title = document.getElementById("title_text");
    title.innerText = chrome.i18n.getMessage("title_languages");

    var working_language_title = document.getElementById("working_language_title");
    working_language_title.innerText = chrome.i18n.getMessage("title_working_language");

    var working_language = document.getElementById("working_language");
    working_language.innerText = chrome.i18n.getMessage("language");

    var img_info = document.getElementById("img_info");
    img_info.setAttribute("title", chrome.i18n.getMessage("img_info_working_language"));

    var secondary_language_title = document.getElementById("secondary_language_title");
    secondary_language_title.innerText = chrome.i18n.getMessage("title_sec_language");

    var img_info_secondary = document.getElementById("img_info_secondary");
    img_info_secondary.setAttribute("title", chrome.i18n.getMessage("img_info_sec_language"));

    var btn_next = document.getElementById("btn_next");
    btn_next.innerHTML = chrome.i18n.getMessage("finish");
    btn_next.setAttribute("title", chrome.i18n.getMessage("btn_next_title_language"));
}

