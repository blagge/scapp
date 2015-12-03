/*
 * scapp - sample calculator app.
 * Andreas Nagy, 2015.
 *
 * Loading script for integration into exisiting websites.
 * Reloads files and starts the application.
 * Just embed this tag:
 * <script id="scapp-base" type="text/javascript" src="http://URL_ZUM_SCAPP_LOADER/scapp-loader.js"></script>
 */

// global namespace
var SCAPP = SCAPP || {};

/*
 * Loader object definition
 */

// Loader constructor
SCAPP.loader = function () {
    var self = this;

    self.head = document.getElementsByTagName("head")[0];
    self.rootElement;
    self.baseUrl;
    self.calculator;
};

// Pseudo random string generation
SCAPP.loader.prototype.S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

// Pseudo random string generation
// creates a website-unique id, so this loader could be used more than once per website
SCAPP.loader.prototype.randomId = function () {
    var self = this;

    return self.S4() + self.S4();
};

// Method for loading scripts.
// Creates new script element and appends it to the document's head.
// Calls callback on ready state.
SCAPP.loader.prototype.loadScript = function (url, callback) {
    var self = this;

    // create new script element
    var scriptEl = document.createElement("script");
    scriptEl.type = "text/javascript";
    // set onload callback
    if (scriptEl.readyState) { // IE implementation
        scriptEl.onreadystatechange = function () {
            if (scriptEl.readyState === "loaded" || scriptEl.readyState === "complete") {
                scriptEl.onreadystatechange = null;
                callback();
            }
        };
    } else { // All other browsers =)
        scriptEl.onload = function () {
            callback();
        };
    }
    scriptEl.src = url;
    self.head.appendChild(scriptEl);
};

// Method for loading cascading style sheets.
// Creates new link element and appends it to the document's head.
SCAPP.loader.prototype.loadStyle = function (url) {
    var self = this;

    if (document.createStyleSheet) {
        document.createStyleSheet(url);
    } else {
        var styleEl = document.createElement("link");
        styleEl.type = "text/css";
        styleEl.media = "screen";
        styleEl.rel = "stylesheet";
        styleEl.href = url;
        self.head.appendChild(styleEl);
    }
};

// Method for loading files async.
// Calls callback on ready state.
SCAPP.loader.prototype.loadFile = function (url, callback) {
    var self = this;

    var ajax = null;
    if (window.XMLHttpRequest) { // Chrome, Firefox, Opera, Safari, IE 7
        ajax = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) { // IE6 and lower
        try {
            ajax = new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (e) {
            try {
                ajax = new ActiveXObject("Msxml2.XMLHTTP.3.0");
            }
            catch (e) {
            }
        }
    }
    if (ajax === null) {
        console.log("Your browser does not support ajax!");
    }
    ajax.open("GET", url, true);
    ajax.send(null);
    ajax.onreadystatechange = function () {
        if (ajax.readyState === 4 || ajax.readyState === "complete") {
            callback(ajax.responseText, ajax.status);
        }
    };
};

// First step.
// Adds style sheet to the document and starts to load the html base structure.
SCAPP.loader.prototype.start = function () {
    var self = this;

    // current script tag
    var script = document.currentScript || (function () {
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
    })();
    // find base element to be replaced
    var rootId = script.getAttribute("data-replace");
    self.rootElement = document.getElementById(rootId);

    if (self.rootElement) { // found? -> start building scapp
        // base url for request to the server containing scapp files
        self.baseUrl = self.rootElement.src.substring(0, self.rootElement.src.lastIndexOf("/") + 1);

        // load style sheet
        self.loadStyle(self.baseUrl + "scapp/css/style.css");

        // load html -> loading scapp will be done in the callback (self.htmlDone)
        self.loadFile(self.baseUrl + "scapp/scapp.html", function (data, status) {
            // wrap up object variable by function to keep object scope
            self.htmlLoaded(data, status);
        });

    } else { // no replacable element found
        console.log("Did not find the element to be replaced for scapp");
        console.log("script: " + script);
        console.log("replace.id: " + rootId);
    }
};

// Second step.
// Appends the elements to the DOM after loading all data.
// The main Appliction (scapp.js) will now be loaded and run.
SCAPP.loader.prototype.htmlLoaded = function (data, status) {
    var self = this;

    // fallback
    var htmlData = "<div class=\"scapp-error\">Unknown error while loading scapp!</div>";
    if (data) {
        htmlData = data;
    }
    var scappEl = document.createElement("div");
    scappEl.id = "scapp-base-" + self.randomId();
    scappEl.innerHTML = htmlData;

    // replace script tag with newly loaded root element
    self.rootElement.parentNode.replaceChild(scappEl, self.rootElement);
    self.rootElement = scappEl;

    // script.files
    self.loadScript(self.baseUrl + "scapp/js/scapp.js", function () {
        self.scriptLoaded();
    });
};

// Third and last step.
// Start scapp.
SCAPP.loader.prototype.scriptLoaded = function () {
    var self = this;

    var calc = new SCAPP.calculator(self.rootElement.id);
};

var scappLoader = new SCAPP.loader();
scappLoader.start();