window.onload = function(){
    initLanguage();
    chrome.storage.local.remove("navigation");

    //initializing the dropdown menu
    var img_settings = document.getElementById("img_settings");
    img_settings.addEventListener("click", openDropdown);

    var btn_next = document.getElementById("btn_next");
    btn_next.addEventListener("click", submitNext);
}

function submitNext(){
    document.getElementById("loader").style.visibility="visible";
    chrome.webNavigation.onDOMContentLoaded.addListener(function(data){
        window.location.href = "../measurement_view/measurement.html";
    });
    chrome.webNavigation.onErrorOccurred.addListener(function(data){
        window.location.href = "../measurement_view/measurement.html";
    });

    goToSite();
}

function goToSite(){
    chrome.storage.local.get("currentSite", function(item){
        if(item.currentSite && item.currentSite.url){
            loadSite(item.currentSite.url);
        }else{
            fetchSite();
        }
    });
}

function openDropdown(){
    document.getElementById("settingsDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches(".dropbtn")) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if(openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
}

function initLanguage(){
    var title = document.getElementById("title");
    title.innerText = chrome.i18n.getMessage("extName");
    
    var img_settings = document.getElementById("img_settings");
    img_settings.setAttribute("title", chrome.i18n.getMessage("settings_title"));

    var link_cred = document.getElementById("link_credentials");
    link_cred.innerText = chrome.i18n.getMessage("title_cred");

    var link_lang = document.getElementById("link_languages");
    link_lang.innerText = chrome.i18n.getMessage("title_languages");

    var message = document.getElementById("message");
    message.innerText = chrome.i18n.getMessage("message_startup");

    var btn_next = document.getElementById("btn_next");
    btn_next.innerText = chrome.i18n.getMessage("start");
}
