const tabHistory = []
tabIndex = 1

function removeHistory(tabId) {
  removedIdx = tabHistory.findIndex(history => history.id == tabId)

  if (removedIdx != -1)
    tabHistory.splice(removedIdx, 1)
}

function pushHistory(tabId, windowId) {
  removeHistory(tabId)
  tabHistory.push({ id: tabId, windowId: windowId })

  if (tabHistory.length > 50)
    tabHistory.shift();
}

function popHistory(index) {
  return tabHistory.splice(tabHistory.length - 1 - index)[0]
}

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }).then(tabs => {
      if (tabs.length > 0) {
        console.log(`Activated ${tabs[0].id}(${windowId})`)
        pushHistory(tabs[0].id, windowId)
      }
    });
  }
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  console.log(`Active ${activeInfo.tabId}, ${activeInfo.windowId}`)

  pushHistory(activeInfo.tabId, activeInfo.windowId)
  console.log(tabHistory)
});

chrome.tabs.onRemoved.addListener(tabId => {
  removeHistory(tabId)
});

chrome.commands.onCommand.addListener(command => {
  if (command === "switch_tab") {
    if (tabHistory.length >= tabIndex)

    lastTab = tabHistory[tabHistory.length - 1 - tabIndex]
    console.log(`Switch to tab ${lastTab.id}(${lastTab.windowId})`)

    if (lastTab != undefined) {
      chrome.windows.update(lastTab.windowId, { focused: true})
      chrome.tabs.update(lastTab.id, { active: true })
    }
  }
});