chrome.storage.local.get("navigation", function(item){
    if(item.navigation){
        window.location.href =  item.navigation;
    }else{
        chrome.storage.local.get("isConfigured", function(item){
            if(item.isConfigured){
                window.location.href = "startup_view/startup.html";
            }else{
                window.location.href = "setup_view/credentials.html";
            }
        });
    }
});