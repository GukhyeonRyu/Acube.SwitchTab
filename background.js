const MULTI_TAB_THRESHOLD = 300

const tabHistory = []
tabIndex = 1
timerId = 0
tabSwitching = false

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

function timeouted(tab) {
  tabIndex = 1
  timerId = 0
  pushHistory(tab.id, tab.windowId)
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

  if (!tabSwitching)
    pushHistory(activeInfo.tabId, activeInfo.windowId)
  else
    tabSwitching = false
});

chrome.tabs.onRemoved.addListener(tabId => {
  removeHistory(tabId)
});

chrome.commands.onCommand.addListener(command => {
  if (command === "switch_tab") {
    if (tabHistory.length < 2)
      return

    lastTab = tabHistory[tabHistory.length - 1 - tabIndex]
    console.log(`Switch to tab ${lastTab.id}(${lastTab.windowId})`)

    if (lastTab != undefined) {
      chrome.windows.update(lastTab.windowId, { focused: true})
      chrome.tabs.update(lastTab.id, { active: true })
    }

    if (timerId != 0)
      clearTimeout(timerId)

    timerId = setTimeout(() => timeouted(lastTab), MULTI_TAB_THRESHOLD)
    tabIndex++
    tabSwitching = true

    if (tabIndex == tabHistory.length)
      tabIndex = 1
  }
});