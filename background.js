var port = null;

function connectBackend() {
    port = browser.runtime.connectNative("rofi_interface");

    port.onMessage.addListener((response) => {
        console.log("Received: " + response);
        if(response != "") {
            browser.tabs.get(parseInt(response)).then(raiseTab, onError);
        }
    });

    port.onDisconnect.addListener((p) => {
        console.log("Backend disconnected!");
        port = null;
        setTimeout(connectBackend, 1000); // retry in 1s
    });
}

connectBackend();

function onError(error) {
    console.log(error);
}

function raiseTab(tab) {
    browser.tabs.update(tab.id, {active:true});
    browser.windows.update(tab.windowId, {focused:true});
}

function sendTabList(tabs) {
    browser.windows.getCurrent().then(function (win) {
        var activetab = tabs.findIndex(function (t) { return (t.active && win.id == t.windowId); });
        console.log(activetab);
        var tabdata = tabs.map(function (t) { return { id: t.id, window: t.windowId, title: t.title, url: t.url } });
        if(port) {
            port.postMessage({ active: activetab, tabs: tabdata });
        }
    });
}

browser.commands.onCommand.addListener(function(command) {
  if (command == "switch-tab") {
    console.log("Querying tabs");
    browser.tabs.query({}).then(sendTabList, onError);
  }
});

