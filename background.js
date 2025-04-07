const MULTI_TAB_THRESHOLD = 300

let tabHistory = []

chrome.storage.local.get("tabHistory").then(async (result) => {
  tabHistory = result.tabHistory;

  if (tabHistory == undefined) {
    tabHistory = []
    await chrome.storage.local.set({ tabHistory });
  }

  console.log("tabHistory reloaded"); // 이곳에서 'tabHistory' 값을 사용할 수 있어
  console.log(tabHistory)
});

tabIndex = 1
timerId = 0
tabSwitching = false

async function removeHistory(tabId) {
  removedIdx = tabHistory.findIndex(history => history.id == tabId)

  if (removedIdx != -1)
    tabHistory.splice(removedIdx, 1)

  await chrome.storage.local.set({ tabHistory });
}

async function pushHistory(tabId, windowId) {
  removeHistory(tabId)
  tabHistory.push({ id: tabId, windowId: windowId })

  if (tabHistory.length > 50)
    tabHistory.shift();

  await chrome.storage.local.set({ tabHistory });
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
  console.log(`Removed ${tabId}`)
  
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
      tabIndex = 0
  }
});