const tabHistory = [];
currentTab = -1;

function removeHistory(tabId)
{
  removedIdx = tabHistory.indexOf(tabId)

  if (removedIdx != -1)
    tabHistory.splice(removedIdx, 1)
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  removeHistory(activeInfo.tabId)
  tabHistory.push(currentTab)
  currentTab = activeInfo.tabId

  if (tabHistory.length > 50)
    tabHistory.shift();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removeHistory(tabId)
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch_tab") {
    lastTab = tabHistory.pop()

    if (lastTab >= 0)
      chrome.tabs.update(lastTab, { active: true })
  }
});
