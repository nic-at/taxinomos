window.onload = function(){
    initLanguage();
    fillDomainCache();
    chrome.storage.local.set({"navigation" : "/measurement_view/measurement.html"});

    //create main button grid, navigate to the correct user story + setup the submit section on the bottom
    chrome.storage.local.get("categories",function(item){
        if(item.categories){
            createButtonGrid(item.categories,7,selectMainCategory, document.getElementById("mainCategoryTableBody"), function(){
                loadNavigation();
                setupSubmitSection();
            });
        }
    });

    //set content of the link on the page
    var lnk_website = document.getElementById("link_website");
    link_website.addEventListener("click",goToSite);
    chrome.storage.local.get("currentSite", function(item){
        if(item.currentSite && item.currentSite.domainName){
            lnk_website.innerText = item.currentSite.domainName;
        }
    });

    initEventListeners();

    //adding that :not(:hover) effect only after window is loaded; If it is included in the .css file directly, I got some unwanted behavior.
    var sheet = document.styleSheets[0];
    setInterval(function(){
        sheet.insertRule("html:not(:hover){max-width: 300px;}", 0);
    },500);
    
}

function initEventListeners(){
    var img_back = document.getElementById("img_back");
    img_back.addEventListener("click", back);

    var img_home = document.getElementById("img_home");
    img_home.addEventListener("click", home);
    
    var btn_leave = document.getElementById("btn_exit");
    btn_leave.addEventListener("click", submitPanic);

    var btn_unsure = document.getElementById("btn_unsure");
    btn_unsure.addEventListener("click", submitUnsure);

    var btn_noncomprende = document.getElementById("btn_noncomprende");
    btn_noncomprende.addEventListener("click", submitNoncomprende);

    var five_stars = document.getElementById("five_stars");
    five_stars.addEventListener("click",function(){
        lockStars(this);
        submitNext(100);
    });

    var four_stars = document.getElementById("four_stars");
    four_stars.addEventListener("click",function(){
        lockStars(this);
        submitNext(80);
    });

    var three_stars = document.getElementById("three_stars");
    three_stars.addEventListener("click",function(){
        lockStars(this);
        submitNext(60);
    });

    var two_stars = document.getElementById("two_stars");
    two_stars.addEventListener("click",function(){
        lockStars(this);
        submitNext(40);
    });

    var one_star = document.getElementById("one_star");
    one_star.addEventListener("click",function(){
        lockStars(this);
        submitNext(20);
    });

    var mainCat_text = document.getElementById("summary_mainCat_text");
    mainCat_text.addEventListener("click", summaryMainClicked)

    var subcat_text = document.getElementById("summary_subcat_text");
    subcat_text.addEventListener("click", summarySubClicked);
}

function loadNavigation(callback){
    chrome.storage.local.get("navigationMeasurement", function(item){
        var nav = item.navigationMeasurement;
        if(nav){
            switch (nav){
                case "sub" : {
                    chrome.storage.local.get("mainCategory", function(item){
                        if(item.mainCategory){
                            document.getElementById("table_mainCategories").classList.add("noAnimation");
                            document.getElementById("table_subcategories").classList.add("noAnimation");
                            disableMain();
                            switchToSubcat(item.mainCategory, setColorSubcat);
                        }
                    });
                    break;
                }
                case "sum" : {
                        chrome.storage.local.get("mainCategory", function(item){
                        if(item.mainCategory){
                            document.getElementById("table_mainCategories").classList.add("noAnimation");
                            document.getElementById("summary_container").classList.add("noAnimation");
                            disableMain();
                            switchToSubcat(item.mainCategory, function(){
                                chrome.storage.local.get("subcategory", function(item){
                                    var cell = document.getElementById(item.subcategory);
                                    if(cell){
                                        cell.classList.add("selectedCell");
                                        switchToSummary(cell, true);
                                    }else{
                                        switchToSummary(null,false);
                                    }
                                });
                            });
                        }
                    });
                }
            }
        }
    });
}

function fillDomainCache(){
    chrome.storage.local.get("domainCache", function(item){
        if(!item.domainCache){
            loadDomainFromServer();
        }
    });
}

function goToSite(){
    chrome.storage.local.get("currentSite", function(item){
        if(item.currentSite && item.currentSite.url){
            loadSite(item.currentSite.url);
        }
    });
}

function nextSite(){
    chrome.webNavigation.onDOMContentLoaded.addListener(function(data){
        window.location.href = "/measurement_view/measurement.html";
    });
    chrome.webNavigation.onErrorOccurred.addListener(function(data){
        window.location.href = "/measurement_view/measurement.html";
    });
    fetchSite(function(){});
}

function createButtonGrid(categories, rowSize, eventCallback, tableBody, callback){
    var newRowCount = 0;
    var tr = document.createElement("tr");
    var tableSub = document.getElementById("subcategoryTableBody");
    
    chrome.storage.local.get("mainCategory",function(itemMainCat){
        for(var key in categories){
            if(newRowCount % rowSize === 0 && newRowCount !== 0){
                tableBody.append(tr);
                tr = document.createElement("tr");
            }
            var category  = categories[key];
            var cell = document.createElement("td");

            cell.setAttribute("class", "cell");
            cell.setAttribute("id",category.id);
            cell.setAttribute("name", category.name);
            cell.setAttribute("title", category.desc);
            cell.innerText = category.name;
            cell.addEventListener("click", function(){
                eventCallback(this);
            });
            if(itemMainCat.mainCategory && itemMainCat.mainCategory.id && category.id === itemMainCat.mainCategory.id){
                cell.classList.add("selectedCell");
            }
            //in case we are creating the subcategory table, we want to mark those cells for further uses
            if(tableBody == tableSub){
                cell.classList.add("cell_sub");
            }
            tr.append(cell);
            newRowCount++;
        }
        //adding that last row that might not have been added
        tableBody.append(tr);
        
        //in case the subcategory table gets too big, we need to reduce its fontSize a bit
        if(tableBody == tableSub){
            var table_container = document.getElementById("table_container");
            if(tableBody.offsetWidth > table_container.offsetWidth || tableBody.offsetHeight > table_container.offsetHeight){
                //Set the window size to a fixed value
                table_container.style.minHeight = table_container.offsetHeight + "px";
                table_container.style.minWidth = table_container.offsetWidth + "px";
                //Reduce the fontsize a bit so that everything fits
                var cells = document.getElementsByClassName("cell_sub");
                for(var i = 0; i < cells.length; i++){
                    cells[i].style.fontSize = "12px";
                }
            }
        }
        if(callback){
            callback();
        }
    });
}

function initSubcatGrid(mainCategory,callback){
    var subcategoriesObject = {};
    chrome.storage.local.get("categories", function(item){
        if(item.categories){
            var subcategories = item.categories[mainCategory.id].subcategories;

            //If i want to reuse the createButtonGrid function, a suitable object has to be created and passed...
            if(subcategories){
                for (var i = 0; i < subcategories.length; i++){
                    subcategoriesObject[subcategories[i].id] = subcategories[i];
                }
                createButtonGrid(subcategoriesObject, 7, selectSubcategory, document.getElementById("subcategoryTableBody"), callback);
            }
        }
    });
}

function setColorSubcat(){
    chrome.storage.local.get("subcategory", function(item){
        if(item.subcategory){
            var cell = document.getElementById(item.subcategory);
            if(cell){
                cell.classList.add("selectedCell");
            }
        }
    });
}

function selectMainCategory(clickedElement){
    //set color of the selected cell and reset color of the previous cell and situationally remove the selected subcategory
    var selectedId = clickedElement.getAttribute("id");
    chrome.storage.local.get("mainCategory", function(item){
        if(item.mainCategory && (item.mainCategory.id !== selectedId)){
            var cell = document.getElementById(item.mainCategory.id);
            if(cell){
                cell.classList.remove("selectedCell");
            }
            chrome.storage.local.remove("subcategory");

        }
            var newCell = document.getElementById(selectedId);
            newCell.classList.add("selectedCell");
        
    });

    //set the new main category
    var mainCategory = {"name" : clickedElement.getAttribute("name"), 
                        "id" : selectedId};

    chrome.storage.local.set({"mainCategory" : mainCategory}, function(){
        chrome.storage.local.get("categories", function(item){
            disableMain();
            document.getElementById("table_subcategories").classList.remove("noAnimation");
            
            //load and switch to subcat/summary view
            var categories = item.categories[mainCategory.id];
            if(categories.subcategories.length === 1){
                var mainCatName = categories.name;
                var subCatName = categories.subcategories[0].name;

                //If mainCatName == subCatName, then there is no subcategory at all.. 
                if((mainCatName === subCatName)){
                    chrome.storage.local.remove("subcategory",function(){
                        var back_style = document.getElementById("img_back").style;
                        back_style.opacity = "1.0";
                        back_style.visibility = "visible";
                        enableStars()
                        switchToSummary(clickedElement, false);
                    });
                }else{
                    switchToSubcat(mainCategory, setColorSubcat);
                }
            }else{
                switchToSubcat(mainCategory, setColorSubcat);
            }
        });
    });
}

function disableMain(){
    var content_container= document.getElementById("content_container");
    content_container.style.minWidth = content_container.offsetWidth + "px";
    content_container.style.minHeight = content_container.offsetHeight + "px";
    var table_main = document.getElementById("table_mainCategories");
    table_main.style.pointerEvents = "none";
    table_main.style.opacity = "0.0";
    table_main.style.visibility = "hidden";
}

function selectSubcategory(clickedElement){
    chrome.storage.local.get("subcategory", function(item){
        if(item.subcategory){
            var cell = document.getElementById(item.subcategory);
            if (cell){
                cell.classList.remove("selectedCell");
            }
        }
    });

    var subcat = clickedElement.getAttribute("id");
    chrome.storage.local.set({"subcategory" : subcat}, function(item){
        setColorSubcat();
    });
    document.getElementById("summary_container").classList.remove("noAnimation");
    switchToSummary(clickedElement, true);
}

function switchToSubcat(mainCategory,callback){
    //delete old subcat button grid first, in case there was one and create the new one
    var subcat_body = document.getElementById("subcategoryTableBody");
    while(subcat_body.firstChild){
        subcat_body.removeChild(subcat_body.firstChild);
    }
    initSubcatGrid(mainCategory, callback);
    enableStars()

    var img_back = document.getElementById("img_back");
    img_back.style.opacity = "1.0";
    img_back.style.visibility = "visible";

    var table_sub = document.getElementById("table_subcategories");
    table_sub.style.pointerEvents = "auto";

    //if we are just here to create the button grid but dont want to display it, then we wont do that
    chrome.storage.local.get("navigationMeasurement", function(itemNav){
        if(!(itemNav.navigationMeasurement === "sum")){
            chrome.storage.local.set({"navigationMeasurement" : "sub"}, function(){
                table_sub.style.opacity = "1.0";
                table_sub.style.visibility = "visible";
            });
        }
    });
}

function switchToSummary(clickedElement, existsSubcat){
    chrome.storage.local.set({"navigationMeasurement" : "sum"}, function(){
        chrome.storage.local.get("mainCategory", function(itemMain){
            if(itemMain.mainCategory){
                var summary_subcat = document.getElementById("summary_subcat");
                var content_container= document.getElementById("content_container");
                var summary_container = document.getElementById("summary_container");
                var table_container = document.getElementById("table_container");

                //customizeable margin height
                var marginHeight = 100;
                content_container.style.minHeight = table_container.offsetHeight - summary_subcat.offsetHeight - (marginHeight - 20) + "px";
                summary_container.style.marginTop = (summary_subcat.offsetHeight + marginHeight) + "px";

                //Adjusting the layout..
                adjustSummaryLayout(existsSubcat, summary_subcat, content_container, itemMain, clickedElement);

            }
            document.getElementById("table_container").classList.remove("blendIn");
            document.getElementById("summary_container").classList.add("blendIn");
        });
    });
}

function adjustSummaryLayout(existsSubcat, summary_subcat, content_container, itemMain, clickedElement){
    var width = content_container.offsetWidth;
    summary_subcat.style.marginLeft = width/7 + "px"
    summary_subcat.style.width = width/3 + "px"

    var mainCat_text = document.getElementById("summary_mainCat_text");
    mainCat_text.innerText = itemMain.mainCategory.name; 

    var subcat_text = document.getElementById("summary_subcat_text");
    if(existsSubcat){
        subcat_text.addEventListener("click", summarySubClicked);
        subcat_text.classList.add("summary_cell");
        subcat_text.innerText = clickedElement.getAttribute("name");
    }else{
        subcat_text.removeEventListener("click", summarySubClicked);
        subcat_text.innerText = chrome.i18n.getMessage("no_subcat");
        subcat_text.classList.remove("summary_cell");
    }
        var table_container = document.getElementById("table_container");
        table_container.classList.add("toggleAnimation");

        var summary_mainCat = document.getElementById("summary_mainCat");
        summary_mainCat.style.marginLeft = "60px";
        summary_mainCat.style.width = width/3 + "px" 

        var summary_title = document.getElementsByClassName("summary_title");
        for (var i = 0; i < summary_title.length; i++){
            summary_title[i].style.marginBottom = "10px";
        }

        var summary_text = document.getElementsByClassName("summary_text");
        for (var i = 0; i  < summary_text.length; i++){
                summary_text[i].style.maxWidth = width/3.5 + "px";
        }
}

function summarySubClicked(){
    chrome.storage.local.set({"navigationMeasurement" : "sub"}, function(){
        chrome.storage.local.get("subcategory", function(item){
            if(item.subcategory){
                document.getElementById(item.subcategory).classList.remove("selectedCell");
                chrome.storage.local.remove("subcategory", function(){
                    var table_sub = document.getElementById("table_subcategories");
                    var summary_container = document.getElementById("summary_container");
                    var table_container = document.getElementById("table_container");

                    summary_container.classList.remove("blendIn");
                    table_container.classList.add("blendIn");
                    table_sub.classList.remove("noAnimation");
                    table_sub.style.opacity = "1.0";
                    table_sub.style.visibility = "visible";
                });
            }
        });
    });
}

function summaryMainClicked(){
    chrome.storage.local.set({"navigationMeasurement" : "main"}, function(){
        document.getElementById("summary_container").classList.remove("blendIn");

        var table_container = document.getElementById("table_container");
        var table_main = document.getElementById("table_mainCategories");
        table_main.style.pointerEvents = "auto";
        table_container.classList.add("blendIn");
        table_main.style.opacity = "1.0";
        table_main.style.visibility = "visible";

        var table_sub = document.getElementById("table_subcategories");
        table_sub.style.opacity = "0";
        table_sub.style.visibility = "hidden";

        var img_back = document.getElementById("img_back");
        img_back.style.opacity = "0";
        img_back.style.visibility = "hidden";
    });
}

function back(){
    chrome.storage.local.get("navigationMeasurement", function(item){
        var nav = item.navigationMeasurement;
        if(nav){
            switch (nav) {
                case "sub" : {
                    chrome.storage.local.set({"navigationMeasurement" : "main"}, function(){
                        tableMain = document.getElementById("table_mainCategories");
                        tableSub = document.getElementById("table_subcategories");

                        //perform navigation
                        tableMain.classList.remove("noAnimation");
                        tableSub.classList.remove("noAnimation");
                        tableMain.style.pointerEvents = "auto";
                        tableMain.style.opacity = "1.0";
                        tableMain.style.visibility = "visible";
                        tableSub.style.pointerEvents="none";
                        tableSub.style.opacity = "0.0";
                        tableSub.style.visibility = "hidden";

                        var img_back = document.getElementById("img_back");
                        img_back.style.opacity = "0.0";
                        img_back.style.visibility = "hidden";
                    });
                    break;
                }
                case "sum" : {
                    chrome.storage.local.get("subcategory", function(item){
                        if(item.subcategory){
                            summarySubClicked();
                        }else{
                            summaryMainClicked();
                        }
                    });
                }
            } 
        }
    });
}

function home(){
    window.location.href = "../startup_view/startup.html";
}

function enableStars(){
    var stars = document.getElementsByClassName("star");
    for(var i = 0; i < stars.length; i++){
        stars[i].classList.remove("star_disabled");
    }

    document.styleSheets[0].insertRule("#confidence:hover {cursor:pointer}", 0);
    
    var confidence = document.getElementById("confidence");
    confidence.setAttribute("title", chrome.i18n.getMessage("confidence_title_enabled"));
    confidence.classList.remove("confidence_disabled");
}

function submit(status, confidence){
    //a few adjustments to the view
    disableForm();

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.storage.local.set({"finalUrl" : tabs[0].url},function(){
            chrome.storage.local.get("statuses", function(item){
                if(item.statuses){
                    var statusId = item.statuses[status];
                    classify(statusId, confidence, function(){
                        clearStorage(nextSite);
                    });
                }
            });
        });
    });
}

function submitNext(confidence){
    chrome.storage.local.get("mainCategory", function(item){
        if(item.mainCategory){
            submit("success", confidence);
        }
    });
}

function submitUnsure(){
    submit("unsure", 0);
}

function submitNoncomprende(){
    submit("noncomprende", 0)
}

function submitPanic(){
    submit("panic", 0);
}

function lockStars(clickedElement){
    var id = clickedElement.getAttribute("id");
    document.styleSheets[0].insertRule("#confidence > #" + id + ":before," +
                            "#confidence > #" + id + "~ span:before {" +
                            "content: \"\\2605\";" + 
                            "position: absolute;" + 
                            "left: 1;" + 
                            "color: Yellow;}", 0);

}

function disableForm(){
    document.getElementById("img_home").style.pointerEvents = "none";
    document.getElementById("mainCategoryTableBody").style.pointerEvents = "none";
    document.getElementById("subcategoryTableBody").style.pointerEvents = "none";
    document.getElementById("summary_mainCat_text").style.pointerEvents = "none";
    document.getElementById("link_website").style.pointerEvents = "none";
    document.getElementById("loader_container").style.display = "block";
    document.getElementById("summary_subcat_text").style.pointerEvents = "none";
    document.getElementById("img_back").style.pointerEvents = "none";
    
    var sheet = document.styleSheets[0];
    sheet.insertRule("html:not(:hover){max-width: 1000px !important;}", 0);

    var btn_unsure = document.getElementById("btn_unsure");
    btn_unsure.classList.add("button_disabled_selection");
    btn_unsure.removeEventListener("click", submitUnsure);

    var btn_noncomprende = document.getElementById("btn_noncomprende");
    btn_noncomprende.classList.add("button_disabled_selection");
    btn_noncomprende.removeEventListener("click", submitNoncomprende);

    var btn_panic = document.getElementById("btn_exit");
    btn_panic.classList.add("button_disabled_selection");
    btn_panic.removeEventListener("click", submitPanic);

    var confidence = document.getElementById("confidence");
    confidence.classList.add("confidence_disabled");
    confidence.style.pointerEvents="none";
    confidence.removeEventListener("click", submitNext);
}

function setupSubmitSection(){
    var html = document.documentElement;
    html.style.minHeight = html.offsetHeight + "px";

    //confidence and btn_unsure might have to be set to display:none in case the window width gets too small --> otherwise
    //we get unwanted layout changes
    var widthUnsure =  document.getElementById("btn_exit").offsetWidth
                + document.getElementById("btn_noncomprende").offsetWidth
                + document.getElementById("btn_unsure").offsetWidth
                + 40
    var widthNext = widthUnsure + document.getElementById("confidence").offsetWidth;
    
    var sheet = document.styleSheets[0];
    sheet.insertRule("@media only screen and (max-width: " + widthUnsure + "px){#btn_unsure{display:none;}}", 0);
    sheet.insertRule("@media only screen and (max-width: " + widthNext + "px){#confidence{display:none;}}", 0);
    sheet.insertRule("@media only screen and (max-width: " + widthNext + "px){#confidence_title{display:none;}}", 0);
}

function initLanguage(){
    var title = document.getElementById("title");
    title.innerText = chrome.i18n.getMessage("title_selection");

    var img_back = document.getElementById("img_back");
    img_back.setAttribute("title", chrome.i18n.getMessage("back"));
    
    var img_home = document.getElementById("img_home");
    img_home.setAttribute("title", chrome.i18n.getMessage("home"));

    var mainCat_title = document.getElementById("summary_mainCat_title");
    mainCat_title.innerText = chrome.i18n.getMessage("main_category") + ":";

    var mainCat_text = document.getElementById("summary_mainCat_text");
    mainCat_text.setAttribute("title", chrome.i18n.getMessage("edit_mainCat"));

    var subcat_title = document.getElementById("summary_subcat_title");
    subcat_title.innerText = chrome.i18n.getMessage("subcategory") + ":";

    var subcat_text = document.getElementById("summary_subcat_text");
    subcat_text.setAttribute("title", chrome.i18n.getMessage("edit_subcat"));
    
    var btn_exit = document.getElementById("btn_exit");
    btn_exit.innerText = chrome.i18n.getMessage("btn_exit_text");
    btn_exit.setAttribute("title", chrome.i18n.getMessage("btn_exit_title"));

    var btn_unsure = document.getElementById("btn_unsure");
    btn_unsure.innerText = chrome.i18n.getMessage("btn_unsure_text");
    btn_unsure.setAttribute("title", chrome.i18n.getMessage("btn_unsure_title"));
    
    var btn_noncomprende = document.getElementById("btn_noncomprende");
    btn_noncomprende.innerText = chrome.i18n.getMessage("btn_noncomprende_text");
    btn_noncomprende.setAttribute("title", chrome.i18n.getMessage("btn_noncomprende_title"));
    
    var confidence = document.getElementById("confidence");
    confidence.setAttribute("title", chrome.i18n.getMessage("confidence_title_disabled"));
    
    var confidence_title = document.getElementById("confidence_title");
    confidence_title.innerText = chrome.i18n.getMessage("confidence_heading") + ":";
    confidence_title.setAttribute("title", chrome.i18n.getMessage("confidence_title_enabled"));

    chrome.storage.local.get("mainCategory", function(item){
        if(item.mainCategory){
            enableStars()
        }
    });
}