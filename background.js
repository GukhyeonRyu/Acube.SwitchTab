const tabHistory = [{}];
currentTab = null;

function removeHistory(tabId) {
  removedIdx = tabHistory.findIndex(history => history.id == tabId)

  if (removedIdx != -1)
    tabHistory.splice(removedIdx, 1)
}

function pushHistory(tabId, windowId) {
  removeHistory(tabId)

  if (currentTab != null)
    tabHistory.push(currentTab)

  currentTab = { id: tabId, windowId: windowId }

  if (tabHistory.length > 50)
    tabHistory.shift();
}

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }).then(tabs => {
      if (tabs.length > 0) {
        console.log(`Active ${tabs[0].id}, ${windowId}`)
        pushHistory(tabs[0].id, windowId)
      }
    });
  }
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  console.log(`Active ${activeInfo.tabId}, ${activeInfo.windowId}`)

  pushHistory(activeInfo.tabId, activeInfo.windowId)
});

chrome.tabs.onRemoved.addListener(tabId => {
  removeHistory(tabId)
});

chrome.commands.onCommand.addListener(command => {
  if (command === "switch_tab") {
    lastTab = tabHistory.pop()
    console.log(`Last tab is ${lastTab.id} ${lastTab.windowId}`)

    if (lastTab != undefined) {
      chrome.windows.update(lastTab.windowId, { focused: true})
      chrome.tabs.update(lastTab.id, { active: true })
    }
  }
});
