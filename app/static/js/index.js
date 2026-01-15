import {
  __commonJS,
  __esm,
  __toCommonJS,
  __toESM
} from "./chunk-MBB4SMMY.js";

// app/js-src/starring.ts
function initializeStars() {
  document.querySelectorAll(".star-toggle").forEach((button) => {
    button.removeEventListener("click", handleStarClick);
    button.addEventListener("click", handleStarClick);
  });
}
function handleStarClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const button = event.currentTarget;
  const subnodeUri = button.dataset.subnodeUri;
  const isStarred = button.classList.contains("starred");
  const endpoint = isStarred ? `/api/unstar/${subnodeUri}` : `/api/star/${subnodeUri}`;
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }).then((response) => response.json()).then((data) => {
    if (data.status === "success") {
      button.classList.toggle("starred");
      button.innerHTML = isStarred ? "\u2606" : "\u2605";
    } else {
      console.error("Failed to update star status:", data.message);
    }
  }).catch((error) => {
    console.error("Error:", error);
  });
}
async function starExternal(url, title, source) {
  const response = await fetch(`/api/star_external`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title, source })
  });
  return response.json();
}
async function unstarExternal(url) {
  const response = await fetch(`/api/unstar_external`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  return response.json();
}
async function getStarredExternalUrls() {
  const response = await fetch(`/api/starred_external_urls`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}
function initializeExternalStars() {
  getStarredExternalUrls().then((starredUrls) => {
    document.querySelectorAll(".external-star-toggle").forEach((button) => {
      const url = button.dataset.externalUrl;
      if (url && starredUrls.includes(url)) {
        button.classList.add("starred");
        button.innerHTML = "\u2605";
        button.title = "Unstar this resource";
      }
    });
  });
  document.querySelectorAll(".external-star-toggle").forEach((button) => {
    button.removeEventListener("click", handleExternalStarClick);
    button.addEventListener("click", handleExternalStarClick);
  });
}
function handleExternalStarClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const button = event.currentTarget;
  const url = button.dataset.externalUrl;
  const title = button.dataset.externalTitle;
  const source = button.dataset.externalSource;
  const isStarred = button.classList.contains("starred");
  const action = isStarred ? unstarExternal(url) : starExternal(url, title, source);
  action.then((data) => {
    if (data.status === "success") {
      button.classList.toggle("starred");
      button.innerHTML = isStarred ? "\u2606" : "\u2605";
      button.title = isStarred ? "Star this resource" : "Unstar this resource";
    } else {
      console.error("Failed to update external star status:", data.message);
    }
  }).catch((error) => {
    console.error("Error:", error);
  });
}
function initializeNodeStars() {
  document.querySelectorAll(".node-star-toggle").forEach((button) => {
    button.removeEventListener("click", handleNodeStarClick);
    button.addEventListener("click", handleNodeStarClick);
  });
}
function handleNodeStarClick(event) {
  event.stopPropagation();
  event.preventDefault();
  const button = event.currentTarget;
  const nodeUri = button.dataset.nodeUri;
  const isStarred = button.classList.contains("starred");
  const endpoint = isStarred ? `/api/unstar_node/${nodeUri}` : `/api/star_node/${nodeUri}`;
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }).then((response) => response.json()).then((data) => {
    if (data.status === "success") {
      button.classList.toggle("starred");
      button.innerHTML = isStarred ? "\u2606" : "\u2605";
    } else {
      console.error("Failed to update node star status:", data.message);
    }
  }).catch((error) => {
    console.error("Error:", error);
  });
}
var init_starring = __esm({
  "app/js-src/starring.ts"() {
  }
});

// app/js-src/util.ts
function safeJsonParse(value, defaultValue) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
}
function darkenColor(color, percent) {
  if (typeof color !== "string" || !color) {
    return "#000000";
  }
  if (color.startsWith("#")) {
    color = color.slice(1);
  }
  const num = parseInt(color, 16);
  let r = num >> 16;
  let g = num >> 8 & 255;
  let b = num & 255;
  const factor = 1 - percent / 100;
  r = Math.round(r * factor);
  g = Math.round(g * factor);
  b = Math.round(b * factor);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  const darkened = `#${(g | b << 8 | r << 16).toString(16).padStart(6, "0")}`;
  return darkened;
}
var CLIENT_DEFAULTS;
var init_util = __esm({
  "app/js-src/util.ts"() {
    CLIENT_DEFAULTS = {
      user: "agora",
      autoExpandSearch: false,
      autoExpandWikipedia: false,
      autoExpandExactMatch: false,
      autoExpandAll: false,
      autoPull: true,
      showBrackets: false,
      showGraphLabels: true,
      showHypothesis: false,
      autoExpandStoas: false,
      demoTimeoutSeconds: "17",
      showEditSection: false
    };
  }
});

// app/js-src/settings.ts
function initSettings() {
  document.getElementById("user").value = localStorage["user"] || CLIENT_DEFAULTS.user;
  document.getElementById("auto-expand-all").checked = safeJsonParse(localStorage["auto-expand-all"], CLIENT_DEFAULTS.autoExpandAll);
  document.getElementById("auto-expand-search").checked = safeJsonParse(localStorage["auto-expand-search"], CLIENT_DEFAULTS.autoExpandSearch);
  document.getElementById("auto-expand-wikipedia").checked = safeJsonParse(localStorage["auto-expand-wikipedia"], CLIENT_DEFAULTS.autoExpandWikipedia);
  document.getElementById("auto-expand-exact-match").checked = safeJsonParse(localStorage["auto-expand-exact-match"], CLIENT_DEFAULTS.autoExpandExactMatch);
  document.getElementById("auto-pull").checked = safeJsonParse(localStorage["auto-pull"], CLIENT_DEFAULTS.autoPull);
  document.getElementById("show-brackets").checked = safeJsonParse(localStorage["showBrackets"], CLIENT_DEFAULTS.showBrackets);
  const showLabelsCheckbox = document.getElementById("show-graph-labels");
  if (showLabelsCheckbox) {
    const initialShowLabels = safeJsonParse(localStorage["graph-show-labels"], CLIENT_DEFAULTS.showGraphLabels);
    showLabelsCheckbox.checked = initialShowLabels;
    localStorage["graph-show-labels"] = initialShowLabels;
    localStorage["graph-show-labels-full"] = initialShowLabels;
  }
  document.getElementById("show-hypothesis").checked = safeJsonParse(localStorage["show-hypothesis"], CLIENT_DEFAULTS.showHypothesis);
  document.getElementById("auto-expand-stoas").checked = safeJsonParse(localStorage["auto-expand-stoas"], CLIENT_DEFAULTS.autoExpandStoas);
  document.getElementById("demo-timeout-seconds").value = localStorage.getItem("demo-timeout-seconds") || CLIENT_DEFAULTS.demoTimeoutSeconds;
  document.getElementById("show-edit-section").checked = safeJsonParse(localStorage["show-edit-section"], CLIENT_DEFAULTS.showEditSection);
  const applyBracketVisibility = () => {
    const shouldShow = document.getElementById("show-brackets").checked;
    const markers = document.querySelectorAll(".wikilink-marker");
    markers.forEach((marker) => {
      marker.style.display = shouldShow ? "inline" : "none";
    });
  };
  applyBracketVisibility();
  const hypothesisFrame = document.getElementById("hypothesis-frame");
  if (hypothesisFrame && document.getElementById("show-hypothesis").checked) {
    hypothesisFrame.classList.add("visible");
  }
  const editSection = document.querySelector(".edit-section-container");
  if (editSection && !document.getElementById("show-edit-section").checked) {
    editSection.style.display = "none";
  }
  const bracketObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        applyBracketVisibility();
      }
    });
  });
  bracketObserver.observe(document.body, { childList: true, subtree: true });
  const showBracketsCheckbox = document.getElementById("show-brackets");
  if (showBracketsCheckbox) {
    showBracketsCheckbox.addEventListener("change", applyBracketVisibility);
  }
  var clear = document.getElementById("clear-settings");
  clear.addEventListener("click", function() {
    console.log("clearing settings");
    localStorage.clear();
    location.reload();
  });
  document.getElementById("user")?.addEventListener("change", (e) => {
    localStorage["user"] = e.target.value;
  });
  const applyUser = () => {
    const user = document.getElementById("user").value;
    localStorage["user"] = user;
    location.reload();
  };
  document.getElementById("user")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyUser();
    }
  });
  document.getElementById("apply-user")?.addEventListener("click", () => {
    applyUser();
  });
  document.getElementById("apply-settings")?.addEventListener("click", () => {
    localStorage["auto-expand-all"] = document.getElementById("auto-expand-all").checked;
    localStorage["auto-pull"] = document.getElementById("auto-pull").checked;
    localStorage["auto-expand-wikipedia"] = document.getElementById("auto-expand-wikipedia").checked;
    localStorage["auto-expand-exact-match"] = document.getElementById("auto-expand-exact-match").checked;
    localStorage["auto-expand-search"] = document.getElementById("auto-expand-search").checked;
    localStorage["auto-expand-stoas"] = document.getElementById("auto-expand-stoas").checked;
    localStorage["showBrackets"] = document.getElementById("show-brackets").checked;
    localStorage["show-edit-section"] = document.getElementById("show-edit-section").checked;
    const showGraphLabels = document.getElementById("show-graph-labels").checked;
    localStorage["graph-show-labels"] = showGraphLabels;
    localStorage["graph-show-labels-full"] = showGraphLabels;
    const showHypothesis = document.getElementById("show-hypothesis").checked;
    localStorage["show-hypothesis"] = showHypothesis;
    location.reload();
  });
  document.getElementById("demo-timeout-seconds")?.addEventListener("change", (e) => {
    const value = e.target.value;
    localStorage.setItem("demo-timeout-seconds", value);
  });
  const joinBtn = document.getElementById("join-submit-btn");
  const contractCheckbox = document.getElementById("join-contract");
  const hostMeCheckbox = document.getElementById("join-host-me");
  const emailContainer = document.getElementById("join-email-container");
  const repoContainer = document.getElementById("join-repo-container");
  const webUrlContainer = document.getElementById("join-web-url-container");
  const formatContainer = document.getElementById("join-format-container");
  if (hostMeCheckbox) {
    hostMeCheckbox.addEventListener("change", () => {
      if (hostMeCheckbox.checked) {
        if (repoContainer)
          repoContainer.style.display = "none";
        if (webUrlContainer)
          webUrlContainer.style.display = "none";
        if (formatContainer)
          formatContainer.style.display = "none";
      } else {
        if (repoContainer)
          repoContainer.style.display = "block";
        if (webUrlContainer)
          webUrlContainer.style.display = "block";
        if (formatContainer)
          formatContainer.style.display = "block";
      }
    });
  }
  if (contractCheckbox && joinBtn) {
    contractCheckbox.addEventListener("change", () => {
      if (contractCheckbox.checked) {
        joinBtn.removeAttribute("disabled");
        joinBtn.style.opacity = "1";
        joinBtn.style.cursor = "pointer";
      } else {
        joinBtn.setAttribute("disabled", "true");
        joinBtn.style.opacity = "0.6";
        joinBtn.style.cursor = "not-allowed";
      }
    });
  }
  document.body.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("set-user-btn")) {
      const user = target.dataset.user;
      if (user) {
        localStorage.setItem("user", user);
        const userInput = document.getElementById("user");
        if (userInput)
          userInput.value = user;
        if (window.showToast)
          window.showToast(`Now browsing as ${user}!`);
        target.innerText = "Done! (Reloading...)";
        setTimeout(() => location.reload(), 1e3);
      }
    }
  });
  if (joinBtn) {
    joinBtn.addEventListener("click", async () => {
      const statusDiv = document.getElementById("join-status");
      if (!statusDiv)
        return;
      const usernameInput = document.getElementById("join-username");
      const repoInput = document.getElementById("join-repo");
      const formatInput = document.getElementById("join-format");
      const webUrlInput = document.getElementById("join-web-url");
      const messageInput = document.getElementById("join-message");
      const emailInput = document.getElementById("join-email");
      const username = usernameInput.value.trim();
      const message = messageInput ? messageInput.value.trim() : "";
      const hostMe = hostMeCheckbox ? hostMeCheckbox.checked : false;
      const email = emailInput ? emailInput.value.trim() : "";
      let repoUrl = "";
      let format = "markdown";
      let webUrl = "";
      if (hostMe) {
        if (!username || !email) {
          statusDiv.innerText = "Please fill in username and email.";
          statusDiv.style.color = "red";
          return;
        }
      } else {
        repoUrl = repoInput.value.trim();
        format = formatInput ? formatInput.value : "markdown";
        webUrl = webUrlInput ? webUrlInput.value.trim() : "";
        if (!username || !email || !repoUrl) {
          statusDiv.innerText = "Please fill in username, email, and repo URL.";
          statusDiv.style.color = "red";
          return;
        }
      }
      statusDiv.innerText = "Processing...";
      statusDiv.style.color = "inherit";
      joinBtn.setAttribute("disabled", "true");
      try {
        const response = await fetch("/api/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            repo_url: repoUrl,
            format,
            web_url: webUrl,
            message,
            email,
            host_me: hostMe
          })
        });
        const data = await response.json();
        if (response.ok) {
          let successMsg = "";
          if (hostMe && data.password) {
            successMsg = `
                        <div style="background: rgba(0, 255, 0, 0.1); padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid lightgreen; color: inherit;">
                            <h3 style="margin-top: 0; color: lightgreen;">\u{1F389} Welcome, ${data.username}!</h3>
                            <p>Your digital garden has been successfully provisioned.</p>
                            
                            <div style="margin: 15px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid #555;">
                                <div style="margin-bottom: 5px;"><strong>Username:</strong> <code style="user-select: all; font-size: 1.1em;">${data.username}</code></div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <strong>Password:</strong> 
                                    <code style="user-select: all; background: #ffffcc; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 1.2em;">${data.password}</code>
                                    <button id="copy-password-btn" style="cursor: pointer; padding: 2px 8px; font-size: 0.9em;">Copy</button>
                                </div>
                                <div style="margin-top: 10px; color: #ffeb3b; font-weight: bold;">
                                    \u26A0\uFE0F IMPORTANT: Log into the <a href="${data.editor_url}" target="_blank" style="color: inherit; text-decoration: underline;">Editor</a> or <a href="${data.forge_url}" target="_blank" style="color: inherit; text-decoration: underline;">Forge</a> NOW to save this password in your browser!
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                                <a href="${data.editor_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Launch Editor \u{1F402}</a>
                                <a href="${data.forge_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Code Forge \u{1F528}</a>
                                <a href="${data.agora_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Your Agora Profile \u{1F464}</a>
                            </div>
                            
                            <button class="set-user-btn" data-user="${data.username}" style="background: transparent; border: 1px solid currentColor; padding: 5px 10px; cursor: pointer; color: inherit; opacity: 0.8;">Browse Agora as @${data.username}</button>
                        </div>`;
          } else {
            successMsg = `
                        <div style="color: lightgreen;">
                            Success! ${data.message || "You have joined the Agora."}
                            <br><br>
                            <a href="/@${username}" target="_blank" style="color: lightgreen; text-decoration: underline;">View your Agora Profile \u{1F464}</a>
                            <br><br>
                            <button class="set-user-btn" data-user="${username}" style="background: transparent; border: 1px solid currentColor; padding: 5px 10px; cursor: pointer; color: inherit;">Browse Agora as @${username}</button>
                        </div>`;
          }
          statusDiv.innerHTML = successMsg;
          statusDiv.style.color = "inherit";
          const copyBtn = document.getElementById("copy-password-btn");
          if (copyBtn) {
            copyBtn.addEventListener("click", () => {
              navigator.clipboard.writeText(data.password).then(() => {
                copyBtn.innerText = "Copied!";
                setTimeout(() => copyBtn.innerText = "Copy", 2e3);
              });
            });
          }
        } else {
          statusDiv.innerText = "Error: " + (data.error || "Unknown error.");
          statusDiv.style.color = "red";
          joinBtn.removeAttribute("disabled");
        }
      } catch (e) {
        statusDiv.innerText = "Network error: " + e;
        statusDiv.style.color = "red";
        joinBtn.removeAttribute("disabled");
      }
    });
  }
}
var init_settings = __esm({
  "app/js-src/settings.ts"() {
    init_util();
  }
});

// app/js-src/draggable.ts
function makeDraggable(container, handle, storageKey, positionType = "top-right") {
  let active = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  let hasBeenPositionedByJs = false;
  const setTranslate = (xPos, yPos, el) => {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  };
  const savedPosition = localStorage.getItem(storageKey);
  if (savedPosition) {
    const pos = JSON.parse(savedPosition);
    xOffset = pos.x;
    yOffset = pos.y;
    container.style.top = "0";
    container.style.left = "0";
    container.style.right = "auto";
    container.style.bottom = "auto";
    setTranslate(xOffset, yOffset, container);
    hasBeenPositionedByJs = true;
  }
  const reposition = () => {
    if (hasBeenPositionedByJs)
      return;
    const rightMargin = 25;
    const bottomMargin = 5;
    const topMargin = 70;
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;
    if (containerWidth === 0 || containerHeight === 0) {
      const originalDisplay = container.style.display;
      const originalVisibility = container.style.visibility;
      container.style.visibility = "hidden";
      container.style.display = "block";
      containerWidth = container.offsetWidth;
      containerHeight = container.offsetHeight;
      container.style.display = originalDisplay;
      container.style.visibility = originalVisibility;
    }
    console.log(`[Draggable] Measured ${storageKey}: ${containerWidth}x${containerHeight}`);
    if (containerWidth === 0)
      containerWidth = 200;
    if (containerHeight === 0)
      containerHeight = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (positionType === "center") {
      xOffset = (viewportWidth - containerWidth) / 2;
      yOffset = (viewportHeight - containerHeight) / 2;
    } else if (positionType === "bottom-right") {
      xOffset = viewportWidth - containerWidth - rightMargin;
      yOffset = viewportHeight - containerHeight - bottomMargin;
    } else if (positionType === "bottom-left") {
      xOffset = 25;
      yOffset = viewportHeight - containerHeight - bottomMargin;
    } else if (positionType === "top-left") {
      xOffset = 2;
      yOffset = topMargin;
    } else {
      xOffset = viewportWidth - containerWidth - rightMargin;
      yOffset = topMargin;
    }
    container.style.position = "fixed";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.right = "auto";
    container.style.bottom = "auto";
    setTranslate(xOffset, yOffset, container);
    localStorage.setItem(storageKey, JSON.stringify({ x: xOffset, y: yOffset }));
    hasBeenPositionedByJs = true;
  };
  const dragStart = (e) => {
    if (!hasBeenPositionedByJs) {
      const rect = container.getBoundingClientRect();
      container.style.top = "0px";
      container.style.left = "0px";
      xOffset = rect.left;
      yOffset = rect.top;
      setTranslate(xOffset, yOffset, container);
      hasBeenPositionedByJs = true;
    }
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }
    active = true;
  };
  const dragEnd = (e) => {
    initialX = currentX;
    initialY = currentY;
    active = false;
    localStorage.setItem(storageKey, JSON.stringify({ x: xOffset, y: yOffset }));
  };
  const drag = (e) => {
    if (active) {
      e.preventDefault();
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, container);
    }
  };
  handle.addEventListener("mousedown", dragStart, false);
  handle.addEventListener("touchstart", dragStart, false);
  document.addEventListener("mouseup", dragEnd, false);
  document.addEventListener("touchend", dragEnd, false);
  document.addEventListener("mousemove", drag, false);
  document.addEventListener("touchmove", drag, { passive: false });
  return { reposition };
}
var init_draggable = __esm({
  "app/js-src/draggable.ts"() {
  }
});

// app/js-src/demo.ts
function initDemoMode() {
  const demoCheckboxes = document.querySelectorAll(".demo-checkbox-input");
  const meditationPopupContainer = document.getElementById("meditation-popup-container");
  const meditationPopupContent = document.getElementById("meditation-popup-content");
  const meditationCloseButton = document.getElementById("meditation-popup-close-btn");
  let demoIntervalId = null;
  let isDraggableInitialized = false;
  const cancelOnInteraction = (event) => {
    if (!event.isTrusted) {
      return;
    }
    if (!(event.target instanceof Element)) {
      return;
    }
    const target = event.target;
    const demoSwitch = target.closest(".demo-switch");
    const burgerMenu = target.closest("#burger");
    if (event.type === "click" && (demoSwitch || burgerMenu)) {
      return;
    }
    const anyCheckedDemoBox = Array.from(demoCheckboxes).some((cb) => cb.checked);
    if (anyCheckedDemoBox) {
      console.log("Deep demo mode cancelled by user interaction.");
      const mainCheckbox = document.getElementById("demo-checkbox");
      if (mainCheckbox) {
        mainCheckbox.checked = false;
        mainCheckbox.dispatchEvent(new Event("change"));
      }
    }
  };
  const cancelDeepDemo = () => {
    if (demoIntervalId) {
      clearInterval(demoIntervalId);
      demoIntervalId = null;
      const timerElement = document.getElementById("demo-timer");
      if (timerElement) {
        timerElement.innerHTML = "";
        timerElement.style.display = "none";
      }
      window.removeEventListener("scroll", cancelOnInteraction);
      window.removeEventListener("click", cancelOnInteraction);
      window.removeEventListener("keypress", cancelOnInteraction);
      console.log("Deep demo mode cancelled.");
    }
  };
  const startDeepDemo = () => {
    hidePopup();
    cancelDeepDemo();
    console.log("Starting deep demo mode.");
    const timeoutSeconds = parseInt(localStorage.getItem("demo-timeout-seconds") || CLIENT_DEFAULTS.demoTimeoutSeconds, 10);
    let countdown = timeoutSeconds;
    const timerElement = document.getElementById("demo-timer");
    if (timerElement) {
      timerElement.style.display = "inline-block";
    }
    const updateTimer = () => {
      if (timerElement) {
        timerElement.innerHTML = `<span>${countdown}s</span>`;
      }
    };
    updateTimer();
    demoIntervalId = window.setInterval(() => {
      countdown--;
      updateTimer();
      if (countdown <= 0) {
        clearInterval(demoIntervalId);
        window.location.href = "/random";
      }
    }, 1e3);
    window.addEventListener("scroll", cancelOnInteraction, { once: true });
    window.addEventListener("click", cancelOnInteraction, { once: true });
    window.addEventListener("keypress", cancelOnInteraction, { once: true });
  };
  const renderClientSideWikilinks = (text) => {
    return text.replace(/\[\[(.*?)\]\]/g, (match, target) => {
      const link = encodeURIComponent(target);
      return `<span class="wikilink-marker">[[</span><a href="/${link}" title="[[${target}]]" class="wikilink">${target}</a><span class="wikilink-marker">]]</span>`;
    });
  };
  const showPopup = () => {
    const messages = [
      "The [[Agora]] is a [[Free Knowledge Commons]]. What will you contribute?",
      "Every [[wikilink]] is a potential connection. Where will you explore next?",
      "This Agora is running on a server somewhere, but the content comes from people like you. It is a [[distributed]] system.",
      "A [[digital garden]] is a space for [[learning in public]]. What will you grow today?",
      "The [[Agora Protocol]] is about composing knowledge, not just collecting it. How can you connect ideas?",
      "Nodes are concepts, subnodes are utterances. What do you have to say?",
      "No 404s here. Every missing page is an invitation to contribute.",
      "This is a [[federated]] system. Your Agora can be part of a larger conversation.",
      "Play is a valid and valuable mode of exploration. What will you discover?",
      "Knowledge is a commons. By sharing what you learn, you enrich everyone."
    ];
    const separator = '<hr class="meditation-divider">';
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    meditationPopupContent.innerHTML = renderClientSideWikilinks(randomMessage);
    meditationPopupContainer.classList.add("active");
    const setupArtifactSection = () => {
      const artifactContainer = document.createElement("div");
      artifactContainer.innerHTML = `${separator}<button id="fetch-artifact-btn">Show random artifact</button>`;
      meditationPopupContent.appendChild(artifactContainer);
      document.getElementById("fetch-artifact-btn")?.addEventListener("click", () => {
        fetchRandomArtifact(artifactContainer);
      }, { once: true });
    };
    if (typeof NODENAME !== "undefined" && NODENAME) {
      const aiMeditationContainer = document.createElement("div");
      aiMeditationContainer.innerHTML = `${separator}Contemplating ${renderClientSideWikilinks("[[" + NODENAME + "]]")}<span class="loading-ellipsis">...</span>`;
      meditationPopupContent.appendChild(aiMeditationContainer);
      fetch(`/api/meditate_on/${encodeURIComponent(NODENAME)}`).then((response) => response.json()).then((data) => {
        if (data.meditation) {
          aiMeditationContainer.innerHTML = separator + data.meditation;
        } else {
          aiMeditationContainer.innerHTML = separator + "Could not generate a meditation at this time.";
        }
      }).catch((error) => {
        console.error("Error fetching AI meditation:", error);
        aiMeditationContainer.innerHTML = separator + "An error occurred while generating a meditation.";
      });
    }
    setupArtifactSection();
    if (!isDraggableInitialized) {
      requestAnimationFrame(() => {
        const meditationDragHandle = document.getElementById("meditation-popup-header");
        if (meditationPopupContainer && meditationDragHandle) {
          const { reposition } = makeDraggable(meditationPopupContainer, meditationDragHandle, "meditation-position", "top-left");
          reposition();
          isDraggableInitialized = true;
        }
      });
    }
  };
  const fetchRandomArtifact = (container) => {
    const separator = '<hr class="meditation-divider">';
    container.innerHTML = `${separator}<em>Loading artifact...</em>`;
    fetch("/api/random_artifact").then((response) => response.json()).then((data) => {
      if (data.content) {
        const promptHTML = `<strong>An artifact from node ${renderClientSideWikilinks(`[[${data.prompt}]]`)}:</strong><br>`;
        const artifactHTML = data.content;
        container.innerHTML = separator + promptHTML + artifactHTML;
      } else {
        container.innerHTML = `${separator}<em>No artifacts found in the database cache.</em>`;
      }
    }).catch((error) => {
      console.error("Error fetching random artifact:", error);
      container.innerHTML = `${separator}<em>An error occurred while fetching an artifact.</em>`;
    });
  };
  const hidePopup = () => {
    meditationPopupContainer.classList.remove("active");
  };
  const setDemoMode = (isChecked) => {
    localStorage.setItem("deep-demo-active", JSON.stringify(isChecked));
    demoCheckboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
    if (isChecked) {
      startDeepDemo();
    } else {
      cancelDeepDemo();
      hidePopup();
    }
  };
  if (demoCheckboxes.length > 0) {
    const isDemoActive = JSON.parse(localStorage.getItem("deep-demo-active") || "false");
    setDemoMode(isDemoActive);
    demoCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        setDemoMode(checkbox.checked);
      });
    });
    meditationCloseButton?.addEventListener("click", () => {
      hidePopup();
    });
  }
  document.getElementById("show-meditation-popup")?.addEventListener("click", () => {
    const meditationPopupContainer2 = document.getElementById("meditation-popup-container");
    if (meditationPopupContainer2.classList.contains("active")) {
      hidePopup();
      return;
    }
    const anyCheckedDemoBox = Array.from(demoCheckboxes).some((cb) => cb.checked);
    if (anyCheckedDemoBox) {
      const mainCheckbox = document.getElementById("demo-checkbox");
      if (mainCheckbox) {
        mainCheckbox.checked = false;
        mainCheckbox.dispatchEvent(new Event("change"));
      }
    }
    showPopup();
  });
}
var init_demo = __esm({
  "app/js-src/demo.ts"() {
    init_draggable();
    init_util();
  }
});

// app/js-src/music.ts
function initMusicPlayer() {
  const musicPlayerContainer = document.getElementById("music-player-container");
  const musicCheckboxes = document.querySelectorAll(".music-checkbox-input");
  const musicCloseButton = document.getElementById("music-player-close-btn");
  const prevButton = document.getElementById("music-player-prev");
  const pauseButton = document.getElementById("music-player-pause");
  const nextButton = document.getElementById("music-player-next");
  const playlistToggle = document.getElementById("music-player-list-toggle");
  const playlistContainer = document.getElementById("music-player-playlist");
  const trackInfo = document.getElementById("track-info");
  const trackInfoContent = document.getElementById("track-info-content");
  const trackNameSpan = document.getElementById("music-player-track-name");
  const artistNameSpan = document.getElementById("music-player-artist-name");
  const timeDisplay = document.getElementById("music-player-time");
  const autoplayMessage = document.getElementById("music-player-autoplay-message");
  const musicControls = document.getElementById("music-player-controls");
  const canvas = document.getElementById("music-visualizer");
  const canvasCtx = canvas ? canvas.getContext("2d") : null;
  let musicPlayer = null;
  let opusPlayer = null;
  let currentTrackIndex = 0;
  let isPaused = false;
  let playlist = [];
  let lastTimeString = "";
  let currentPlayId = 0;
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let opusSource = null;
  let visualizerFrame = null;
  let activeMidiNotes = {};
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const initAudioContext = () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  };
  const stopMusic = () => {
    if (musicPlayer) {
      try {
        musicPlayer.stop();
      } catch (e) {
        console.warn("Error stopping MIDI player:", e);
      }
      musicPlayer = null;
    }
    if (opusPlayer) {
      opusPlayer.pause();
      opusPlayer.src = "";
    }
    if (visualizerFrame) {
      cancelAnimationFrame(visualizerFrame);
    }
    if (canvasCtx && canvas) {
      canvasCtx.fillStyle = "#000";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
    activeMidiNotes = {};
    console.log("Music stopped.");
  };
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds))
      return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const drawVisualizer = () => {
    if (!canvasCtx || !canvas)
      return;
    visualizerFrame = requestAnimationFrame(drawVisualizer);
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    let currentTime = 0;
    let totalTime = 0;
    let isPlaying = false;
    if (opusPlayer && !opusPlayer.paused) {
      currentTime = opusPlayer.currentTime;
      totalTime = opusPlayer.duration;
      if (!isFinite(totalTime) && Math.random() < 0.01) {
        console.log(`Opus Debug: Duration=${totalTime}, ReadyState=${opusPlayer.readyState}, NetworkState=${opusPlayer.networkState}`);
      }
      isPlaying = true;
    } else if (musicPlayer && musicPlayer.isPlaying()) {
      totalTime = musicPlayer.getSongTime();
      const remaining = musicPlayer.getSongTimeRemaining();
      currentTime = totalTime - remaining;
      isPlaying = true;
      if (remaining <= 0 && totalTime > 0) {
        console.log("Visualizer detected end of MIDI track, advancing.");
        playTrack((currentTrackIndex + 1) % playlist.length);
      }
    }
    if (isPlaying && timeDisplay) {
      const timeString = `${formatTime(currentTime)} / ${formatTime(totalTime)}`;
      if (timeString !== lastTimeString) {
        timeDisplay.textContent = timeString;
        lastTimeString = timeString;
      }
    }
    if (opusPlayer && !opusPlayer.paused && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      const barWidth = WIDTH / dataArray.length * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        const r = barHeight + 25 * (i / dataArray.length);
        const g = 250 * (i / dataArray.length);
        const b = 50;
        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    } else if (musicPlayer && musicPlayer.isPlaying()) {
      const notes = Object.keys(activeMidiNotes).map(Number);
      const barWidth = WIDTH / 88;
      notes.forEach((note) => {
        const velocity = activeMidiNotes[note];
        const x = (note - 21) * barWidth;
        const barHeight = velocity / 127 * HEIGHT;
        canvasCtx.fillStyle = `hsl(${note * 3}, 100%, 50%)`;
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        activeMidiNotes[note] *= 0.9;
        if (activeMidiNotes[note] < 1)
          delete activeMidiNotes[note];
      });
    }
    if (isPlaying && totalTime > 0 && isFinite(totalTime)) {
      const x = currentTime / totalTime * WIDTH;
      canvasCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
      canvasCtx.fillRect(x, 0, 2, HEIGHT);
    }
  };
  const seek = (e) => {
    if (!canvas)
      return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    let totalTime = 0;
    if (opusPlayer && !opusPlayer.paused) {
      totalTime = opusPlayer.duration;
      if (totalTime > 0) {
        opusPlayer.currentTime = percent * totalTime;
      }
    } else if (musicPlayer && musicPlayer.isPlaying()) {
      totalTime = musicPlayer.getSongTime();
      if (totalTime > 0) {
        const target = percent * totalTime;
        console.log(`Seeking MIDI to ${target} / ${totalTime}`);
        musicPlayer.skipToSeconds(target);
        if (!musicPlayer.isPlaying()) {
          console.log("MIDI stopped after seek, resuming.");
          musicPlayer.play();
        }
        activeMidiNotes = {};
      }
    }
  };
  if (canvas) {
    canvas.style.cursor = "pointer";
    canvas.addEventListener("click", seek);
  }
  const playTrack = (trackIndex) => {
    stopMusic();
    isPaused = false;
    if (pauseButton)
      pauseButton.textContent = "\u23F8";
    currentTrackIndex = trackIndex;
    const playId = ++currentPlayId;
    if (!playlist || playlist.length === 0)
      return;
    const track = playlist[trackIndex];
    if (trackNameSpan)
      trackNameSpan.textContent = track.name;
    if (artistNameSpan)
      artistNameSpan.innerHTML = track.artist ? `by <a href="/${track.artist.replace("@", "")}" target="_blank">${track.artist}</a>` : "";
    if (trackInfoContent) {
      trackInfoContent.classList.remove("scrolling-track");
      trackInfoContent.style.removeProperty("--scroll-distance");
    }
    setTimeout(() => {
      if (trackInfo && trackInfoContent && trackInfo.scrollWidth > trackInfo.clientWidth) {
        const distance = trackInfo.scrollWidth - trackInfo.clientWidth + 10;
        trackInfoContent.style.setProperty("--scroll-distance", `-${distance}px`);
        trackInfoContent.classList.add("scrolling-track");
      }
    }, 50);
    drawVisualizer();
    if (playlistContainer && playlistContainer.style.display === "block") {
      renderPlaylist();
    }
    if (track.type === "mid") {
      const ac = initAudioContext();
      import("./lib-AQK4D7UF.js").then(({ default: Soundfont }) => {
        if (playId !== currentPlayId)
          return;
        import("./index.browser-4IYMTPL7.js").then(({ default: MidiPlayer }) => {
          if (playId !== currentPlayId)
            return;
          Soundfont.instrument(ac, "acoustic_grand_piano").then(function(instrument) {
            if (playId !== currentPlayId)
              return;
            const activeNotesDict = {};
            const player = new MidiPlayer.Player(function(event) {
              if (event.name === "Note on" && event.velocity > 0) {
                console.log("Midi Note:", event.noteName, event.velocity);
                instrument.play(event.noteName, ac.currentTime, { gain: event.velocity / 100 * 4 });
                activeMidiNotes[event.noteNumber] = event.velocity;
                activeNotesDict[event.noteNumber] = true;
              } else if (event.name === "Note off" || event.name === "Note on" && event.velocity === 0) {
              }
            });
            player.on("end", function() {
              console.log("Midi file finished, playing next track.");
              playTrack((currentTrackIndex + 1) % playlist.length);
            });
            musicPlayer = player;
            fetch(track.path).then((response) => response.arrayBuffer()).then((arrayBuffer) => {
              if (playId !== currentPlayId)
                return;
              const bytes = new Uint8Array(arrayBuffer);
              let binary = "";
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              const dataUri = `data:audio/midi;base64,${base64}`;
              player.loadDataUri(dataUri);
              if (ac.state === "suspended") {
                if (musicControls)
                  musicControls.style.display = "none";
                if (autoplayMessage) {
                  autoplayMessage.style.display = "block";
                  autoplayMessage.textContent = "\u25B6\uFE0F Click to play";
                }
              } else {
                player.play();
              }
              console.log(`Playing MIDI: ${track.name}`);
            });
          });
        });
      });
    } else if (track.type === "opus" || track.path.endsWith(".opus") || track.path.endsWith(".ogg")) {
      const ac = initAudioContext();
      if (!opusPlayer) {
        opusPlayer = new Audio();
        opusPlayer.crossOrigin = "anonymous";
      }
      opusPlayer.src = track.path;
      opusPlayer.loop = false;
      if (!opusSource && analyser) {
        try {
          opusSource = ac.createMediaElementSource(opusPlayer);
          opusSource.connect(analyser);
          analyser.connect(ac.destination);
        } catch (e) {
          console.warn("Could not connect audio source (maybe already connected):", e);
        }
      }
      const playPromise = opusPlayer.play();
      if (playPromise !== void 0) {
        playPromise.catch((error) => {
          if (error.name === "NotAllowedError") {
            console.warn("Autoplay was prevented.");
            if (musicControls)
              musicControls.style.display = "none";
            if (autoplayMessage) {
              autoplayMessage.style.display = "block";
              autoplayMessage.textContent = "\u25B6\uFE0F Click to play";
            }
          } else {
            console.error("An error occurred during playback:", error);
          }
        });
      }
      opusPlayer.onended = () => {
        console.log("Opus file finished, playing next track.");
        playTrack((currentTrackIndex + 1) % playlist.length);
      };
      console.log(`Playing Opus: ${track.name}`);
    }
  };
  const renderPlaylist = () => {
    if (!playlistContainer)
      return;
    playlistContainer.innerHTML = "";
    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    playlist.forEach((track, index) => {
      const li = document.createElement("li");
      li.style.cursor = "pointer";
      li.style.padding = "4px 0";
      li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      if (index === currentTrackIndex) {
        li.style.fontWeight = "bold";
        li.style.color = "var(--accent-color)";
        li.innerHTML = `\u25B6 ${track.name} <span style="font-size: 0.8em; opacity: 0.7;">(${track.artist})</span>`;
      } else {
        li.innerHTML = `${index + 1}. ${track.name} <span style="font-size: 0.8em; opacity: 0.7;">(${track.artist})</span>`;
      }
      li.addEventListener("click", () => {
        playTrack(index);
      });
      ul.appendChild(li);
    });
    playlistContainer.appendChild(ul);
  };
  const loadPlaylist = () => {
    return fetch(`/api/music/tracks?t=${Date.now()}`).then((res) => res.json()).then((tracks) => {
      let midis = tracks.filter((t) => t.type === "mid");
      let opuses = tracks.filter((t) => t.type === "opus");
      playlist = [];
      midis.sort((a, b) => (a.size || 0) - (b.size || 0));
      if (midis.length > 0) {
        const thresholdIndex = Math.max(5, Math.floor(midis.length * 0.1));
        const candidatesCount = Math.min(midis.length, thresholdIndex);
        const idx = Math.floor(Math.random() * candidatesCount);
        playlist.push(midis[idx]);
        midis.splice(idx, 1);
      }
      if (opuses.length > 0) {
        const idx = Math.floor(Math.random() * opuses.length);
        playlist.push(opuses[idx]);
        opuses.splice(idx, 1);
      }
      shuffle(midis);
      playlist.push(...midis);
      if (opuses.length > 0) {
        shuffle(opuses);
        playlist.push(...opuses);
      }
      console.log("Loaded playlist (Short(10%) -> Opus(Rainbow?) -> Rest-Shuffled):", playlist);
      return playlist;
    });
  };
  const musicDragHandle = document.getElementById("music-player-header");
  let musicDraggable = null;
  if (musicPlayerContainer && musicDragHandle) {
    musicDraggable = makeDraggable(musicPlayerContainer, musicDragHandle, "music-player-position", "top-right");
  }
  const setMusicState = (isPlaying) => {
    localStorage.setItem("ambient-music-active", JSON.stringify(isPlaying));
    musicCheckboxes.forEach((checkbox) => {
      checkbox.checked = isPlaying;
    });
    if (isPlaying) {
      const isPlayerVisible = JSON.parse(localStorage.getItem("music-player-visible") || "true");
      if (musicPlayerContainer && isPlayerVisible) {
        musicPlayerContainer.classList.add("active");
        if (musicDraggable)
          musicDraggable.reposition();
      }
      if (playlist.length === 0) {
        loadPlaylist().then(() => {
          playTrack(currentTrackIndex);
        }).catch((err) => console.error("Failed to load playlist", err));
      } else {
        playTrack(currentTrackIndex);
      }
    } else {
      if (musicPlayerContainer)
        musicPlayerContainer.classList.remove("active");
      stopMusic();
    }
  };
  if (musicCheckboxes.length > 0) {
    const isMusicActive = JSON.parse(localStorage.getItem("ambient-music-active") || "false");
    if (isMusicActive) {
      loadPlaylist().then(() => {
        setMusicState(true);
      });
    }
    musicCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const isPlaying = checkbox.checked;
        if (isPlaying) {
          localStorage.setItem("music-player-visible", "true");
        }
        setMusicState(isPlaying);
      });
    });
    if (musicPlayerContainer) {
      musicPlayerContainer.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("a") || e.target.closest("#music-player-playlist"))
          return;
        if (autoplayMessage && autoplayMessage.style.display === "block") {
          autoplayMessage.click();
        }
      });
    }
    autoplayMessage?.addEventListener("click", () => {
      autoplayMessage.style.display = "none";
      if (musicControls)
        musicControls.style.display = "flex";
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      playTrack(currentTrackIndex);
    });
    musicCloseButton?.addEventListener("click", () => {
      setMusicState(false);
    });
    if (playlistToggle && playlistContainer) {
      playlistToggle.addEventListener("click", () => {
        if (playlistContainer.style.display === "none") {
          renderPlaylist();
          playlistContainer.style.display = "block";
        } else {
          playlistContainer.style.display = "none";
        }
      });
    }
    pauseButton?.addEventListener("click", () => {
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      isPaused = !isPaused;
      if (isPaused) {
        if (musicPlayer && musicPlayer.isPlaying())
          musicPlayer.pause();
        if (opusPlayer && !opusPlayer.paused)
          opusPlayer.pause();
        if (pauseButton)
          pauseButton.textContent = "\u25B6\uFE0F";
      } else {
        const track = playlist[currentTrackIndex];
        if (track && track.type === "mid") {
          if (musicPlayer && !musicPlayer.isPlaying())
            musicPlayer.play();
        } else {
          if (opusPlayer && opusPlayer.paused && opusPlayer.src)
            opusPlayer.play();
        }
        if (pauseButton)
          pauseButton.textContent = "\u23F8";
      }
    });
    nextButton?.addEventListener("click", () => {
      playTrack((currentTrackIndex + 1) % playlist.length);
    });
    prevButton?.addEventListener("click", () => {
      playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);
    });
  }
}
var init_music = __esm({
  "app/js-src/music.ts"() {
    init_draggable();
  }
});

// app/js-src/graph.ts
async function renderGraph(containerId, dataUrl) {
  const container = document.getElementById(containerId);
  if (!container)
    return;
  container.innerHTML = "";
  const { default: ForceGraph } = await import("./force-graph-Z3W24SKM.js");
  const darkPalette = {
    bg: "rgba(0, 0, 0, 0)",
    edge: "rgba(150, 150, 150, 1)",
    particle: "rgba(150, 150, 150, 0.4)",
    text: "#bfbfbf",
    nodeBg: "rgba(50, 50, 50, 1)"
  };
  const lightPalette = {
    bg: "rgba(0, 0, 0, 0)",
    edge: "rgba(50, 50, 50, 1)",
    particle: "rgba(50, 50, 50, 0.4)",
    text: "#000000",
    nodeBg: "#f0f0f0"
  };
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const palette = currentTheme === "dark" ? darkPalette : lightPalette;
  const defaultShowLabels = containerId === "graph";
  const storageKey = containerId === "full-graph" ? "graph-show-labels-full" : "graph-show-labels";
  const showLabels = safeJsonParse(localStorage.getItem(storageKey), defaultShowLabels);
  console.log("loading graph...");
  fetch(dataUrl).then((res) => res.json()).then((data) => {
    setTimeout(() => {
      const Graph = ForceGraph()(container);
      const graphContainer = container.closest(".graph-container");
      const cooldownTime = data.nodes.length > 200 ? 25e3 : 5e3;
      Graph.height(graphContainer.getBoundingClientRect().height).width(container.getBoundingClientRect().width).backgroundColor(palette.bg).onNodeClick((node) => {
        let url = node.id;
        location.assign(url);
      }).graphData(data).nodeId("id").nodeVal("val").nodeAutoColorBy("group");
      if (showLabels) {
        Graph.nodeCanvasObject((node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2);
          ctx.fillStyle = palette.nodeBg;
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          let color = node.color;
          if (currentTheme === "light") {
            color = darkenColor(color, 40);
          }
          ctx.fillStyle = color;
          ctx.fillText(label, node.x, node.y);
          node.__bckgDimensions = bckgDimensions;
        }).nodePointerAreaPaint((node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
        });
      } else {
        Graph.nodeRelSize(2);
      }
      Graph.linkDirectionalArrowLength(3).linkDirectionalParticles(1).linkDirectionalParticleSpeed(5e-3).linkDirectionalParticleColor(() => palette.particle).linkColor(() => palette.edge);
      Graph.zoom(3);
      Graph.cooldownTime(cooldownTime);
      Graph.onEngineStop(() => Graph.zoomToFit(100));
    }, 0);
  }).catch((error) => console.error("Error fetching or rendering graph:", error));
}
var init_graph = __esm({
  "app/js-src/graph.ts"() {
    init_util();
  }
});

// app/js-src/pull.ts
function pullNode(button) {
  const node = button.value;
  const pullRecursive2 = JSON.parse(localStorage.getItem("pull-recursive") || "true");
  const embedContainer = document.querySelector(`#${node}.pulled-node-embed`);
  if (!embedContainer)
    return;
  if (pullRecursive2) {
    embedContainer.innerHTML = `<iframe src="/embed/${node}" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>`;
  } else {
    fetch(`/pull/${node}`).then((response) => response.text()).then((data) => {
      embedContainer.innerHTML = data;
    });
  }
}
function pullUrl(button) {
  const url = button.value;
  const iframe = document.createElement("iframe");
  iframe.className = "stoa2-iframe";
  iframe.setAttribute("allow", "camera; microphone; fullscreen; display-capture; autoplay");
  iframe.src = url;
  button.after(iframe);
}
function pullTweet(button) {
  const tweet = button.value;
  const blockquote = document.createElement("blockquote");
  blockquote.className = "twitter-tweet";
  blockquote.setAttribute("data-theme", "dark");
  blockquote.innerHTML = `<a href="${tweet}"></a>`;
  button.after(blockquote);
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://platform.twitter.com/widgets.js";
  script.charset = "utf-8";
  button.after(script);
}
function renderMastodonPost(post) {
  const date = new Date(post.created_at).toLocaleString();
  let media = "";
  if (post.media_attachments.length > 0) {
    media = post.media_attachments.map((attachment) => {
      if (attachment.type === "image") {
        return `<a href="${attachment.url}" target="_blank"><img src="${attachment.preview_url}" alt="${attachment.description || "Mastodon image"}" class="mastodon-embed-image"></a>`;
      }
      return "";
    }).join("");
  }
  return `
        <div class="mastodon-embed-container">
            <div class="mastodon-embed-header">
                <img src="${post.account.avatar}" class="mastodon-embed-avatar">
                <div class="mastodon-embed-author">
                    <strong>${post.account.display_name}</strong>
                    <span>@${post.account.acct}</span>
                </div>
            </div>
            <div class="mastodon-embed-content">
                ${post.content}
            </div>
            <div class="mastodon-embed-media">
                ${media}
            </div>
            <div class="mastodon-embed-footer">
                <a href="${post.url}" target="_blank">${date}</a>
            </div>
        </div>
    `;
}
async function pullMastodonStatus(button) {
  const toot = button.value;
  let domain, post;
  const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig;
  const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig;
  let m;
  if (m = web_regex.exec(toot)) {
    domain = m[1];
    post = m[2];
  } else if (m = user_regex.exec(toot)) {
    domain = m[1];
    post = m[2];
  } else {
    return;
  }
  try {
    const req = `${domain}/api/v1/statuses/${post}`;
    const response = await fetch(req);
    const data = await response.json();
    const embedHTML = renderMastodonPost(data);
    button.insertAdjacentHTML("afterend", embedHTML);
  } catch (error) {
    console.error("Error fetching Mastodon status:", error);
    button.insertAdjacentHTML("afterend", '<div class="error">Could not load Mastodon post.</div>');
  }
}
function initPullButtons() {
  const selectors = [
    ".pull-node",
    ".pull-url",
    ".pull-tweet",
    ".pull-mastodon-status"
  ];
  document.querySelectorAll(selectors.join(", ")).forEach((element) => {
    element.addEventListener("click", function(e) {
      const button = e.currentTarget;
      if (button.classList.contains("pulled")) {
        const nextElement = button.nextElementSibling;
        if (nextElement) {
          nextElement.remove();
        }
        if (button.classList.contains("pull-tweet")) {
          const script = button.nextElementSibling;
          if (script && script.tagName === "SCRIPT") {
            script.remove();
          }
        }
        if (button.classList.contains("pull-node")) {
          const embedContainer = document.querySelector(`#${button.value}.pulled-node-embed`);
          if (embedContainer) {
            embedContainer.innerHTML = "";
          }
        }
        button.innerText = "pull";
        button.classList.remove("pulled");
      } else {
        button.innerText = "pulling";
        if (button.classList.contains("pull-node")) {
          pullNode(button);
        } else if (button.classList.contains("pull-url")) {
          pullUrl(button);
        } else if (button.classList.contains("pull-tweet")) {
          pullTweet(button);
        } else if (button.classList.contains("pull-mastodon-status")) {
          pullMastodonStatus(button).then(() => {
            button.innerText = "fold";
          });
        }
        if (!button.classList.contains("pull-mastodon-status")) {
          button.innerText = "fold";
        }
        button.classList.add("pulled");
      }
    });
  });
}
var init_pull = __esm({
  "app/js-src/pull.ts"() {
  }
});

// app/js-src/main.ts
var main_exports = {};
var autoExpandAll, autoExpandSearch, autoExpandWikipedia, autoPull, autoExec, pullRecursive;
var init_main = __esm({
  "app/js-src/main.ts"() {
    init_starring();
    init_settings();
    init_util();
    init_draggable();
    init_demo();
    init_music();
    init_graph();
    init_pull();
    autoExpandAll = JSON.parse(localStorage["auto-expand-all"] || "false");
    autoExpandSearch = JSON.parse(localStorage["auto-expand-search"] || "false");
    autoExpandWikipedia = JSON.parse(localStorage["auto-expand-wikipedia"] || "false");
    autoPull = JSON.parse(localStorage.getItem("auto-pull") ?? "true");
    autoExec = JSON.parse(localStorage["auto-exec"] || "true");
    pullRecursive = JSON.parse(localStorage["pull-recursive"] || "true");
    document.addEventListener("DOMContentLoaded", async function() {
      console.log("DomContentLoaded");
      initSettings();
      initMusicPlayer();
      function applyDismissals() {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("dismissed-")) {
            if (localStorage.getItem(key) === "true") {
              const infoBoxId = key.substring("dismissed-".length);
              const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
              if (infoBox) {
                infoBox.classList.add("hidden");
                infoBox.style.display = "none";
              }
            }
          }
        }
      }
      applyDismissals();
      document.body.addEventListener("click", function(event) {
        const target = event.target;
        if (target.classList.contains("dismiss-button")) {
          const infoBoxId = target.getAttribute("info-box-id");
          const parentDiv = target.parentElement;
          if (parentDiv) {
            console.log("Dismissing info box: " + infoBoxId);
            parentDiv.classList.add("hidden");
            localStorage.setItem(`dismissed-${infoBoxId}`, "true");
            parentDiv.addEventListener("transitionend", function() {
              parentDiv.style.display = "none";
            }, { once: true });
          }
        }
      });
      const starObserver = new MutationObserver((mutations) => {
        let needsUpdate = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && node.querySelector(".star-toggle")) {
                needsUpdate = true;
                break;
              }
            }
          }
          if (needsUpdate)
            break;
        }
        if (needsUpdate) {
          console.log("New subnodes detected, re-initializing stars.");
          initializeStars();
        }
      });
      starObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      const scrollToggle = document.getElementById("scroll-toggle");
      const nav = document.querySelector("nav");
      if (scrollToggle && nav) {
        const updateScrollButton = () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            scrollToggle.innerHTML = "\u25B2";
            scrollToggle.title = "Scroll to top";
          } else {
            scrollToggle.innerHTML = "\u25BC";
            scrollToggle.title = "Scroll to bottom";
          }
        };
        window.addEventListener("scroll", updateScrollButton);
        scrollToggle.addEventListener("click", () => {
          if (scrollToggle.innerHTML === "\u25B2") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }
        });
      }
      const hypothesisFrame = document.getElementById("hypothesis-frame");
      const dragHandle = document.getElementById("hypothesis-drag-handle");
      let hypothesisDraggable = null;
      if (hypothesisFrame && dragHandle) {
        hypothesisDraggable = makeDraggable(hypothesisFrame, dragHandle, "hypothesis-position", "bottom-right");
        if (hypothesisFrame.classList.contains("visible")) {
          hypothesisDraggable.reposition();
        }
      }
      const hypothesisCloseBtn = document.getElementById("hypothesis-close-btn");
      const showHypothesisCheckbox = document.getElementById("show-hypothesis");
      const showHypothesisNavbar = document.getElementById("show-hypothesis-navbar");
      if (hypothesisCloseBtn) {
        hypothesisCloseBtn.addEventListener("click", () => {
          syncHypothesisState(false);
        });
      }
      const syncHypothesisState = (isVisible) => {
        if (hypothesisFrame) {
          hypothesisFrame.classList.toggle("visible", isVisible);
          if (isVisible && hypothesisDraggable)
            hypothesisDraggable.reposition();
        }
        if (showHypothesisCheckbox) {
          showHypothesisCheckbox.checked = isVisible;
        }
        if (showHypothesisNavbar) {
          showHypothesisNavbar.checked = isVisible;
        }
        localStorage.setItem("show-hypothesis", isVisible.toString());
      };
      if (showHypothesisCheckbox) {
        showHypothesisCheckbox.addEventListener("change", () => {
          syncHypothesisState(showHypothesisCheckbox.checked);
        });
      }
      if (showHypothesisNavbar) {
        showHypothesisNavbar.addEventListener("change", () => {
          syncHypothesisState(showHypothesisNavbar.checked);
        });
      }
      const annotateButton = document.getElementById("annotate-button");
      if (annotateButton && hypothesisFrame) {
        annotateButton.addEventListener("click", () => {
          const isVisible = hypothesisFrame.classList.contains("visible");
          syncHypothesisState(!isVisible);
        });
      }
      const annotationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            const hasHighlights = Array.from(mutation.addedNodes).some((node) => node.nodeName.toLowerCase() === "hypothesis-highlight" || node.querySelector?.("hypothesis-highlight"));
            if (hasHighlights) {
              const hypothesisFrame2 = document.getElementById("hypothesis-frame");
              const showHypothesisCheckbox2 = document.getElementById("show-hypothesis");
              if (hypothesisFrame2 && !hypothesisFrame2.classList.contains("visible")) {
                console.log("Hypothesis highlight detected, showing panel.");
                hypothesisFrame2.classList.add("visible");
                if (showHypothesisCheckbox2) {
                  showHypothesisCheckbox2.checked = true;
                }
                localStorage.setItem("show-hypothesis", "true");
              }
              break;
            }
          }
        }
      });
      annotationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      const themeCheckboxes = document.querySelectorAll(".theme-checkbox-input");
      const currentTheme = localStorage.getItem("theme");
      const setTheme = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        themeCheckboxes.forEach((checkbox) => {
          checkbox.checked = theme === "dark";
        });
        if (document.getElementById("graph")) {
          renderGraph("graph", "/graph/json/" + NODENAME);
        }
        const fullGraphContainer = document.getElementById("full-graph");
        if (fullGraphContainer) {
          const activeTab = document.querySelector(".graph-size-tab.active");
          if (activeTab) {
            const size = activeTab.getAttribute("data-size");
            renderGraph("full-graph", `/graph/json/top/${size}`);
          }
        }
      };
      if (currentTheme === "light") {
        setTheme("light");
      } else {
        setTheme("dark");
      }
      themeCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          setTheme(checkbox.checked ? "dark" : "light");
        });
      });
      document.querySelectorAll(["#burger"]).forEach((element) => {
        console.log(`Clicked ${element.id}`);
        element.addEventListener("click", function() {
          const overlay2 = document.getElementById("overlay");
          const joinOverlay2 = document.getElementById("join-overlay");
          if (joinOverlay2 && joinOverlay2.classList.contains("active")) {
            joinOverlay2.classList.remove("active");
          }
          overlay2.classList.toggle("active");
          if (overlay2.classList.contains("active")) {
            document.body.classList.add("overlay-open");
          } else {
            document.body.classList.remove("overlay-open");
          }
          const overlayContent = overlay2.querySelector(".overlay-content");
          if (overlayContent) {
            overlayContent.scrollTop = 0;
          }
        });
      });
      document.querySelectorAll(["#join", "#join2", "#open-join-overlay"]).forEach((element) => {
        console.log(`Clicked ${element.id}`);
        element.addEventListener("click", function(e) {
          if (element.tagName === "A") {
            e.preventDefault();
          }
          const overlay2 = document.getElementById("overlay");
          const joinOverlay2 = document.getElementById("join-overlay");
          if (overlay2 && overlay2.classList.contains("active")) {
            overlay2.classList.remove("active");
          }
          joinOverlay2.classList.toggle("active");
          if (joinOverlay2.classList.contains("active")) {
            document.body.classList.add("overlay-open");
          } else {
            document.body.classList.remove("overlay-open");
          }
          const overlayContent = joinOverlay2.querySelector(".overlay-content");
          if (overlayContent) {
            overlayContent.scrollTop = 0;
          }
        });
      });
      const overlay = document.getElementById("overlay");
      if (overlay) {
        overlay.addEventListener("click", function(event) {
          if (event.target === overlay) {
            this.classList.remove("active");
            document.body.classList.remove("overlay-open");
          }
        });
      }
      const joinOverlay = document.getElementById("join-overlay");
      if (joinOverlay) {
        joinOverlay.addEventListener("click", function(event) {
          if (event.target === joinOverlay) {
            this.classList.remove("active");
            document.body.classList.remove("overlay-open");
          }
        });
      }
      const setupIframeNavigationWatcher = (container) => {
        const iframe = container.querySelector("iframe");
        const overlay2 = container.querySelector(".iframe-url-overlay");
        if (!iframe || !overlay2)
          return;
        let isInitialLoad = true;
        iframe.addEventListener("load", () => {
          if (isInitialLoad) {
            isInitialLoad = false;
          } else {
            overlay2.style.display = "none";
          }
        });
      };
      document.querySelectorAll(".iframe-container").forEach(setupIframeNavigationWatcher);
      const iframeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains("iframe-container")) {
              setupIframeNavigationWatcher(node);
            }
            node.querySelectorAll?.(".iframe-container").forEach(setupIframeNavigationWatcher);
          });
        });
      });
      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      const addIframeListener = (iframe) => {
        console.log("Adding listener to iframe:", iframe.src || "no src");
        try {
          iframe.addEventListener("load", () => {
            console.log("Iframe load event triggered:", iframe.src);
          });
        } catch (err) {
          console.error("Error adding listener:", err);
        }
      };
      console.log("Initial iframes:", document.querySelectorAll("iframe").length);
      document.querySelectorAll("iframe").forEach(addIframeListener);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === "IFRAME") {
              console.log("Added iframe: ", node.nodeName);
              addIframeListener(node);
            }
          });
        });
      });
      console.log("Starting observer");
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      console.log("Observer started");
      const setupNavbarLayoutEngine = () => {
        const toggleContainer = document.querySelector(".toggle-container");
        const searchButton = document.getElementById("mini-cli-exec");
        const wideToggleContainer = document.querySelector(".navigation-content");
        const searchContainer = document.querySelector(".search-container");
        const actionBar = document.querySelector(".action-bar");
        if (!toggleContainer || !searchButton || !wideToggleContainer || !searchContainer || !actionBar) {
          return;
        }
        const mediaQuery = window.matchMedia("(max-width: 60em)");
        const handleLayoutChange = (e) => {
          if (e.matches) {
            searchContainer.appendChild(toggleContainer);
            actionBar.insertBefore(searchButton, actionBar.firstChild);
          } else {
            wideToggleContainer.appendChild(toggleContainer);
            searchContainer.insertBefore(searchButton, searchContainer.firstChild);
          }
        };
        mediaQuery.addEventListener("change", handleLayoutChange);
        handleLayoutChange(mediaQuery);
      };
      setupNavbarLayoutEngine();
      const handleScrollHints = () => {
        document.querySelectorAll(".navigation-content, .action-bar, #footer").forEach((element) => {
          const el = element;
          const parent = el.parentElement;
          if (!parent)
            return;
          const isScrollable = el.scrollWidth > el.clientWidth;
          if (isScrollable) {
            const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
            parent.classList.toggle("scrolled-to-end", isAtEnd);
          } else {
            parent.classList.add("scrolled-to-end");
          }
        });
      };
      document.querySelectorAll(".navigation-content, .action-bar, #footer").forEach((element) => {
        element.addEventListener("scroll", handleScrollHints);
      });
      window.addEventListener("resize", handleScrollHints);
      handleScrollHints();
      const miniCliExec = document.querySelector("#mini-cli-exec");
      if (miniCliExec) {
        miniCliExec.addEventListener("click", () => {
          console.log("exec mini-cli");
          let val = document.querySelector("#mini-cli").value;
          document.querySelector("#mini-cli").parentElement.submit();
        });
      }
      const miniCliGo = document.querySelector("#mini-cli-go");
      if (miniCliGo) {
        miniCliGo.addEventListener("click", () => {
          console.log("go mini-cli executes");
          miniCliGo.textContent = "\u{1F3F9} Going...";
          miniCliGo.disabled = true;
          let val = document.querySelector("#mini-cli").value;
          window.location.href = "/go/" + val;
        });
      }
      initDemoMode();
      window.showToast = function(message, duration = 3e3) {
        console.log("Showing toast:", message);
        let container = document.getElementById("toast-container");
        if (!container) {
          console.warn("Toast container missing, creating one.");
          container = document.createElement("div");
          container.id = "toast-container";
          document.body.appendChild(container);
        }
        const toastElement = document.createElement("div");
        toastElement.className = "toast";
        toastElement.innerHTML = message;
        container.appendChild(toastElement);
        setTimeout(() => {
          toastElement.classList.add("toast-visible");
        }, 10);
        setTimeout(() => {
          toastElement.classList.remove("toast-visible");
          toastElement.addEventListener("transitionend", () => {
            toastElement.remove();
          }, { once: true });
        }, duration);
      };
      const showToast = window.showToast;
      const miniCliRetry = document.querySelector("#mini-cli-retry");
      if (miniCliRetry) {
        miniCliRetry.addEventListener("click", () => {
          console.log("retry mini-cli executes");
          const url = new URL(window.location.href);
          url.searchParams.set("t", new Date().getTime());
          window.location.href = url.href;
        });
      }
      const expandAllButton = document.querySelector("#expand-all");
      if (expandAllButton) {
        expandAllButton.addEventListener("click", (e) => {
          const button = e.currentTarget;
          const isExpanded = button.dataset.state === "expanded";
          if (isExpanded) {
            console.log("collapse all executes: collapsing top-level details");
            document.querySelectorAll("details[open]").forEach((detail) => {
              if (!detail.parentElement.closest("details")) {
                const summary = detail.querySelector(":scope > summary");
                if (summary) {
                  summary.click();
                }
              }
            });
            button.innerHTML = "\u229E expand";
            button.title = "Expand all sections";
            button.dataset.state = "collapsed";
          } else {
            console.log("expand all executes: expanding top-level details");
            document.querySelectorAll("details:not([open]):not(.edit-section-container)").forEach((detail) => {
              if (!detail.parentElement.closest("details")) {
                const summary = detail.querySelector(":scope > summary");
                if (summary) {
                  summary.click();
                }
              }
            });
            button.innerHTML = "\u229F collapse";
            button.title = "Collapse all sections";
            button.dataset.state = "expanded";
          }
        });
      }
      window.addEventListener("keydown", function(e) {
        if (e.ctrlKey && e.altKey && e.keyCode == 83) {
          const miniCli = document.querySelector("#mini-cli");
          miniCli.focus();
          miniCli.value = "";
        }
      });
      document.querySelectorAll(".pull-url").forEach((element) => {
        element.addEventListener("click", function(e) {
          console.log("in pull-url!");
          if (this.classList.contains("pulled")) {
            this.innerText = "pull";
            this.nextElementSibling.remove();
            this.classList.remove("pulled");
          } else {
            this.innerText = "pulling";
            let url = this.value;
            console.log("pull url : " + url);
            const iframe = document.createElement("iframe");
            iframe.className = "stoa2-iframe";
            iframe.setAttribute("allow", "camera; microphone; fullscreen; display-capture; autoplay");
            iframe.src = url;
            this.after(iframe);
            this.innerText = "fold";
            this.classList.add("pulled");
          }
        });
      });
      document.querySelector("#pull-stoa")?.addEventListener("click", function(e) {
        console.log("clicked stoa button");
        if (this.classList.contains("pulled")) {
          this.innerText = "pull";
          this.nextElementSibling.remove();
          document.querySelector("#stoa-iframe").innerHTML = "";
          this.classList.remove("pulled");
        } else {
          this.innerText = "pulling";
          let node = this.value;
          document.querySelector("#stoa-iframe").innerHTML = '<iframe id="stoa-iframe" name="embed_readwrite" src="https://doc.anagora.org/' + node + '?edit"></iframe>';
          this.innerText = "fold";
          this.classList.add("pulled");
        }
      });
      async function statusContent(self) {
        let toot = self.value;
        let domain, post;
        const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig;
        const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig;
        let m;
        console.log("testing type of presumed mastodon embed: " + toot);
        if (m = web_regex.exec(toot)) {
          console.log("found status of type /web/");
          domain = m[1];
          post = m[2];
        }
        if (m = user_regex.exec(toot)) {
          console.log("found status of type /@user/");
          domain = m[1];
          post = m[2];
        }
        let req = domain + "/api/v1/statuses/" + post;
        console.log("req for statusContent: " + req);
        try {
          const response = await fetch(req);
          const data = await response.json();
          console.log("status: " + data["url"]);
          let actual_url = data["url"];
          console.log("actual url for mastodon status: " + actual_url);
          let oembed_req = domain + "/api/oembed?url=" + actual_url;
          const oembedResponse = await fetch(oembed_req);
          const oembedData = await oembedResponse.json();
          console.log("oembed: " + oembedData["html"]);
          self.insertAdjacentHTML("afterend", oembedData["html"]);
        } catch (error) {
          console.error("Error fetching Mastodon status:", error);
        }
        self.innerText = "pulled";
      }
      setTimeout(loadAsyncContent, 10);
      async function loadAsyncContent() {
        var content = document.querySelector("#async-content");
        var node;
        let response;
        if (content != null) {
          node = content.getAttribute("src");
          console.log("loading " + node + " async");
        } else {
          node = NODENAME;
          console.log("loading " + node + " sync");
        }
        setTimeout(autoPullAsync, 1e3);
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("dismissed-")) {
            if (localStorage.getItem(key) === "true") {
              const infoBoxId = key.substring("dismissed-".length);
              const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
              if (infoBox) {
                infoBox.classList.add("hidden");
                infoBox.style.display = "none";
              }
            }
          }
        }
        var details = document.querySelectorAll("details.url");
        details.forEach((item) => {
          item.addEventListener("toggle", async (event) => {
            if (item.open) {
              console.log("Details have been shown");
              let embed = item.querySelector(".stoa-iframe, .edit-iframe");
              if (embed) {
                let url = embed.getAttribute("src");
                if (embed.classList.contains("edit-iframe")) {
                  const user = localStorage.getItem("user") || "flancian";
                  let nodeUri = url.split("/").pop();
                  if (nodeUri && !nodeUri.includes(".")) {
                    nodeUri += ".md";
                  }
                  url = `https://edit.anagora.org/@${user}/${nodeUri}`;
                }
                const iframeHTML = `<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="${url}" style="width: 100%;" height="700px"></iframe>`;
                const overlayHTML = `<a href="${url}" target="_blank" class="iframe-url-overlay" title="Open in new tab">${url}</a>`;
                embed.innerHTML = `<div class="iframe-container">${iframeHTML}${overlayHTML}</div>`;
              }
            } else {
              console.log("Details have been hidden");
              let embed = item.querySelector(".stoa-iframe, .edit-iframe");
              if (embed) {
                console.log("Embed found, here we would fold.");
                embed.innerHTML = "";
              }
            }
          });
        });
        var details = document.querySelectorAll("details.search");
        details.forEach((item) => {
          item.addEventListener("toggle", async (event) => {
            let searchEmbed;
            if (item.open) {
              console.log("Details have been shown");
              searchEmbed = item.querySelector(".pulled-search-embed");
              if (searchEmbed) {
                let qstr = searchEmbed.id;
                console.log("Search embed found, here we would pull.");
                const response2 = await fetch(AGORAURL + "/fullsearch/" + qstr);
                searchEmbed.innerHTML = await response2.text();
              }
            } else {
              console.log("Details have been hidden");
              searchEmbed = item.querySelector(".pulled-search-embed");
              if (searchEmbed) {
                console.log("Search embed found, here we would fold.");
                searchEmbed.innerHTML = "";
              }
            }
          });
        });
        const genaiContainer = document.querySelector("details.genai");
        if (genaiContainer) {
          const tabs = genaiContainer.querySelectorAll(".ai-provider-tab");
          const nodeId = NODENAME;
          const spinner = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Generating text...</em></p></center><br />`;
          const loadContent = async (provider, embedDiv) => {
            if (!embedDiv || embedDiv.innerHTML.trim() !== "")
              return;
            embedDiv.innerHTML = spinner;
            let endpoint = "";
            if (provider === "mistral") {
              endpoint = "/api/complete/";
            } else if (provider === "gemini") {
              endpoint = "/api/gemini_complete/";
            }
            if (endpoint) {
              try {
                const response2 = await fetch(AGORAURL + endpoint + encodeURIComponent(nodeId));
                const data = await response2.json();
                const promptDetails = document.createElement("details");
                const promptSummary = document.createElement("summary");
                promptSummary.textContent = "View Full Prompt";
                promptDetails.appendChild(promptSummary);
                const promptPre = document.createElement("pre");
                promptPre.textContent = data.prompt;
                promptDetails.appendChild(promptPre);
                embedDiv.innerHTML = "";
                embedDiv.appendChild(promptDetails);
                const answerDiv = document.createElement("div");
                answerDiv.innerHTML = data.answer;
                embedDiv.appendChild(answerDiv);
                embedDiv.classList.add("visible");
              } catch (error) {
                embedDiv.innerHTML = `<p>Error loading content: ${error}</p>`;
              }
            }
          };
          genaiContainer.addEventListener("toggle", (event) => {
            if (genaiContainer.open) {
              const activeTab = genaiContainer.querySelector(".ai-provider-tab.active");
              if (activeTab) {
                const provider = activeTab.getAttribute("data-provider");
                const embed = genaiContainer.querySelector(`.ai-embed[data-provider="${provider}"]`);
                loadContent(provider, embed);
              }
            }
          });
          tabs.forEach((tab) => {
            tab.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              const details2 = genaiContainer;
              if (!details2.open) {
                details2.open = true;
              }
              tabs.forEach((t) => t.classList.remove("active"));
              tab.classList.add("active");
              const provider = tab.getAttribute("data-provider");
              const embeds = genaiContainer.querySelectorAll(".ai-embed");
              embeds.forEach((embed) => {
                if (embed.dataset.provider === provider) {
                  embed.style.display = "block";
                  loadContent(provider, embed);
                } else {
                  embed.style.display = "none";
                }
              });
            });
          });
        }
        if (autoExpandSearch) {
          document.querySelectorAll("details.search").forEach(function(element) {
            console.log("auto expanding search");
            const summary = element.querySelector("summary");
            if (summary && !element.open) {
              summary.click();
            }
          });
        }
        document.querySelectorAll("details.auto-expand").forEach(function(element) {
          console.log("processing .auto-expand");
          const summary = element.querySelector("summary");
          if (summary && !element.open) {
            summary.click();
          }
        });
        if (safeJsonParse(localStorage["auto-expand-stoas"], false)) {
          document.querySelectorAll("details.stoa").forEach(function(element) {
            console.log("auto expanding stoas");
            if (!element.open) {
              element.open = true;
            }
          });
        }
        if (autoExpandWikipedia) {
          const observer2 = new MutationObserver((mutations, obs) => {
            const wikipediaDetails = document.querySelector("details.wiki");
            if (wikipediaDetails) {
              console.log("auto expanding wikipedia");
              const summary = wikipediaDetails.querySelector("summary");
              if (summary && !wikipediaDetails.open) {
                summary.click();
              }
              obs.disconnect();
            }
          });
          observer2.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
        if (content != null) {
          const slowLoadDelay = 3e3;
          const slowLoadTimer = setTimeout(() => {
            showToast(`\u{1F331} Warming up the Agora... (this might take a moment)`);
          }, slowLoadDelay);
          try {
            response = await fetch(AGORAURL + "/node/" + node);
          } finally {
            clearTimeout(slowLoadTimer);
          }
          if (response.headers.get("X-Agora-Cold-Start") === "true") {
            setTimeout(() => {
              showToast(`\u{1F64F} Apologies for the delay; that was a cold start.`);
            }, 1e3);
          }
          content.outerHTML = await response.text();
        }
        setTimeout(bindEvents, 10);
      }
      async function autoPullAsync() {
        console.log("auto pulling resources");
      }
      async function bindEvents() {
        if (document.querySelector(".not-found") && autoPull) {
          const wikiDetails = document.querySelector("#wp-wt-container .wiki");
          if (wikiDetails && !wikiDetails.hasAttribute("open")) {
            showToast("Empty node: auto-expanding Wikipedia");
            wikiDetails.setAttribute("open", "");
          }
        }
        initializeStars();
        initializeNodeStars();
        initializeExternalStars();
        applyDismissals();
        const updatePullAllButtonVisibility = () => {
          const pullAllButton = document.getElementById("pull-all-in-node");
          if (!pullAllButton)
            return;
          const pullableSelectors = ".pull-node, .pull-mastodon-status, .pull-tweet, .pull-search, .pull-url";
          const pullableElements = document.querySelectorAll(pullableSelectors);
          if (pullableElements.length > 0) {
            pullAllButton.style.display = "inline-block";
          } else {
            pullAllButton.style.display = "none";
          }
        };
        updatePullAllButtonVisibility();
        const user = localStorage.getItem("user") || "flancian";
        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }
        const sortSubnodes = () => {
          const subnodesContainer = document.querySelector(".node[open]");
          if (!subnodesContainer)
            return;
          const allSubnodes = Array.from(subnodesContainer.querySelectorAll("details.subnode[data-author]"));
          if (allSubnodes.length < 2)
            return;
          const userSubnodes = allSubnodes.filter((subnode) => subnode.dataset.author === user);
          if (userSubnodes.length === 0)
            return;
          const firstSubnode = subnodesContainer.querySelector("details.subnode[data-author]");
          if (firstSubnode) {
            userSubnodes.reverse().forEach((subnode) => {
              firstSubnode.parentNode.insertBefore(subnode, firstSubnode);
            });
          }
          console.log(`Animating ${userSubnodes.length} subnodes for user ${user}.`);
          userSubnodes.forEach((subnode) => {
            subnode.classList.add("subnode-arrived");
            setTimeout(() => {
              subnode.classList.remove("subnode-arrived");
            }, 100);
          });
        };
        sortSubnodes();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("dismissed-")) {
            if (localStorage.getItem(key) === "true") {
              const infoBoxId = key.substring("dismissed-".length);
              const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
              if (infoBox) {
                infoBox.classList.add("hidden");
                infoBox.style.display = "none";
              }
            }
          }
        }
        var details = document.querySelectorAll("details.node");
        details.forEach((item) => {
          item.addEventListener("toggle", (event) => {
            if (item.open) {
              console.log("Details have been shown");
              let nodeEmbed = item.querySelector(".node-embed");
              if (nodeEmbed) {
                let node = nodeEmbed.id;
                console.log("Node embed found, here we would pull.");
                nodeEmbed.innerHTML = '<iframe src="' + AGORAURL + "/" + node + '" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>';
              }
            } else {
              console.log("Details have been hidden");
              let nodeEmbed = item.querySelector(".node-embed");
              if (nodeEmbed) {
                console.log("Node embed found, here we would fold.");
                nodeEmbed.innerHTML = "";
              }
            }
          });
        });
        document.querySelectorAll(".pushed-subnodes-embed").forEach(async function(element) {
          let node = NODENAME;
          let arg = ARG;
          let id = ".pushed-subnodes-embed";
          console.log("auto pulling pushed subnodes, will write to id: " + id);
          let response;
          if (arg != "") {
            response = await fetch(AGORAURL + "/push/" + node + "/" + arg);
          } else {
            response = await fetch(AGORAURL + "/push/" + node);
          }
          const data = await response.text();
          document.querySelector(id).innerHTML = data;
        });
        document.querySelectorAll(".context").forEach(async function(element) {
          let node = NODENAME;
          let id = ".context";
          console.log("auto pulling context, will write to id: " + id);
          const response = await fetch(AGORAURL + "/context/" + node);
          const data = await response.text();
          document.querySelector(id).innerHTML = data;
          console.log("auto pulled context");
          renderGraph("graph", "/graph/json/" + node);
          document.getElementById("graph-toggle-labels")?.addEventListener("click", () => {
            const currentSetting = safeJsonParse(localStorage.getItem("graph-show-labels"), true);
            localStorage.setItem("graph-show-labels", JSON.stringify(!currentSetting));
            renderGraph("graph", "/graph/json/" + node);
          });
          console.log("graph loaded.");
        });
        initPullButtons();
        document.querySelectorAll(".pull-pleroma-status").forEach((element) => {
          element.addEventListener("click", function(e) {
            let toot = this.value;
            const iframe = document.createElement("iframe");
            iframe.src = toot;
            iframe.className = "mastodon-embed";
            iframe.style.maxWidth = "100%";
            iframe.width = "400";
            iframe.setAttribute("allowfullscreen", "allowfullscreen");
            this.after(document.createElement("br"));
            this.after(iframe);
            const script = document.createElement("script");
            script.src = "https://freethinkers.lgbt/embed.js";
            script.async = true;
            this.after(script);
            this.innerText = "pulled";
          });
        });
        document.querySelector("#pull-all")?.addEventListener("click", function(e) {
          console.log("auto pulling all!");
          document.querySelectorAll(".pull-node").forEach((element) => {
            if (!element.classList.contains("pulled")) {
              console.log("auto pulling nodes");
              element.click();
            }
          });
          document.querySelectorAll(".pull-mastodon-status").forEach((element) => {
            if (!element.classList.contains("pulled")) {
              console.log("auto pulling activity");
              element.click();
            }
          });
          document.querySelectorAll(".pull-tweet").forEach((element) => {
            if (!element.classList.contains("pulled")) {
              console.log("auto pulling tweet");
              element.click();
            }
          });
          document.querySelectorAll(".pull-search").forEach((element) => {
            if (!element.classList.contains("pulled")) {
              console.log("auto pulling search");
              element.click();
            }
          });
          document.querySelectorAll(".pull-url").forEach((element) => {
            if (!element.classList.contains("pulled")) {
              console.log("auto pulling url");
              element.click();
            }
          });
          var details2 = document.querySelectorAll("details.related summary, details.pulled summary, details:not([open]):is(.node) summary, details.stoa > summary, details.search > summary");
          details2.forEach((item) => {
            console.log("trying to click details");
            item.click();
          });
        });
        document.querySelector("#fold-all")?.addEventListener("click", function(e) {
          document.querySelectorAll(".pull-node").forEach((element) => {
            if (element.classList.contains("pulled")) {
              console.log("auto folding nodes");
              element.click();
            }
          });
          document.querySelectorAll(".pull-mastodon-status").forEach((element) => {
            if (element.classList.contains("pulled")) {
              console.log("auto folding activity");
              element.click();
            }
          });
          document.querySelectorAll(".pull-tweet").forEach((element) => {
            if (element.classList.contains("pulled")) {
              console.log("auto folding tweet");
              element.click();
            }
          });
          document.querySelectorAll(".pull-search").forEach((element) => {
            if (element.classList.contains("pulled")) {
              console.log("auto folding search");
              element.click();
            }
          });
          document.querySelectorAll(".pull-url").forEach((element) => {
            if (element.classList.contains("pulled")) {
              console.log("auto pulling url");
              element.click();
            }
          });
          var details2 = document.querySelectorAll("details[open] > summary");
          details2.forEach((item) => {
            console.log("trying to click details");
            item.click();
          });
        });
        document.querySelectorAll("#join2").forEach((element) => {
          console.log(`Clicked ${element.id}`);
          element.addEventListener("click", function() {
            const overlay2 = document.getElementById("overlay");
            overlay2.classList.toggle("active");
          });
        });
        const nodePullButton = document.querySelector("#pull-all-in-node");
        if (nodePullButton) {
          nodePullButton.addEventListener("click", (e) => {
            const button = e.currentTarget;
            const nodeElement = button.closest(".node");
            if (!nodeElement)
              return;
            const isPulled = button.dataset.state === "pulled";
            if (isPulled) {
              nodeElement.querySelectorAll(".pull-node.pulled, .pull-mastodon-status.pulled, .pull-tweet.pulled, .pull-search.pulled, .pull-url.pulled").forEach((element) => {
                element.click();
              });
              button.innerHTML = "\u{1F9F2} Pull All";
              button.dataset.state = "folded";
            } else {
              nodeElement.querySelectorAll(".pull-node:not(.pulled), .pull-mastodon-status:not(.pulled), .pull-tweet:not(.pulled), .pull-search:not(.pulled), .pull-url:not(.pulled)").forEach((element) => {
                element.click();
              });
              button.innerHTML = "\u2715 Fold All";
              button.dataset.state = "pulled";
            }
          });
        }
        if (autoPull) {
          setTimeout(() => {
            const pullButton = document.querySelector("#pull-all-in-node");
            if (pullButton && pullButton.dataset.state !== "pulled") {
              console.log("Auto-pulling all content in node.");
              pullButton.click();
            }
          }, 500);
        }
        if (autoExpandAll) {
          setTimeout(() => {
            const expandButton = document.querySelector("#expand-all");
            if (expandButton && expandButton.dataset.state !== "expanded") {
              console.log("Auto-expanding all sections.");
              expandButton.click();
            }
          }, 500);
        }
        const fullGraphDetails = document.getElementById("full-graph-details");
        if (fullGraphDetails) {
          const tabs = fullGraphDetails.querySelectorAll(".graph-size-tab");
          let graphInstance;
          let labelsVisible = true;
          const loadGraph = (size) => {
            const url = size === "all" ? "/graph./json/all" : `/graph/json/top/${size}`;
            renderGraph("full-graph", url);
          };
          fullGraphDetails.addEventListener("toggle", () => {
            if (fullGraphDetails.open) {
              const activeTab = fullGraphDetails.querySelector(".graph-size-tab.active");
              if (activeTab) {
                const size = activeTab.getAttribute("data-size");
                loadGraph(size);
              }
            }
          });
          tabs.forEach((tab) => {
            tab.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!fullGraphDetails.open) {
                fullGraphDetails.open = true;
              }
              tabs.forEach((t) => t.classList.remove("active"));
              tab.classList.add("active");
              const size = tab.getAttribute("data-size");
              loadGraph(size);
            });
          });
          document.getElementById("full-graph-toggle-labels")?.addEventListener("click", () => {
            const currentSetting = safeJsonParse(localStorage.getItem("graph-show-labels-full"), false);
            localStorage.setItem("graph-show-labels-full", JSON.stringify(!currentSetting));
            const activeTab = fullGraphDetails.querySelector(".graph-size-tab.active");
            if (activeTab) {
              const size = activeTab.getAttribute("data-size");
              loadGraph(size);
            }
          });
        }
        document.getElementById("mini-cli-cachez")?.addEventListener("click", (e) => {
          const button = e.currentTarget;
          const originalText = button.innerHTML;
          button.innerHTML = "\u{1F9E0} Flushing...";
          button.disabled = true;
          fetch("/api/clear-in-memory-cache", {
            method: "POST"
          }).then((response) => {
            if (response.ok) {
              button.innerHTML = "\u{1F9E0} Flushed!";
            } else {
              button.innerHTML = "\u{1F9E0} Error!";
            }
            setTimeout(() => {
              button.innerHTML = originalText;
              button.disabled = false;
            }, 2e3);
          }).catch((error) => {
            console.error("Error flushing in-memory cache:", error);
            button.innerHTML = "\u{1F9E0} Error!";
            setTimeout(() => {
              button.innerHTML = originalText;
              button.disabled = false;
            }, 2e3);
          });
        });
        document.getElementById("mini-cli-invalidate-sqlite")?.addEventListener("click", (e) => {
          const button = e.currentTarget;
          const originalText = button.innerHTML;
          button.innerHTML = "\u{1F4BE} Flushing...";
          button.disabled = true;
          fetch("/invalidate-sqlite", {
            method: "POST"
          }).then((response) => {
            if (response.ok) {
              button.innerHTML = "\u{1F4BE} Flushed!";
            } else {
              button.innerHTML = "\u{1F4BE} Error!";
            }
            setTimeout(() => {
              button.innerHTML = originalText;
              button.disabled = false;
            }, 2e3);
          }).catch((error) => {
            console.error("Error invalidating SQLite:", error);
            button.innerHTML = "\u{1F4BE} Error!";
            setTimeout(() => {
              button.innerHTML = originalText;
              button.disabled = false;
            }, 2e3);
          });
        });
        const initializeCollapsibleContent = () => {
          document.querySelectorAll(".collapsible-content").forEach((content) => {
            if (content.dataset.processed)
              return;
            const button = document.querySelector(`.show-more-button[data-target="${content.id}"]`);
            if (button) {
              if (content.scrollHeight > content.clientHeight) {
                button.style.display = "block";
              } else {
                content.classList.add("expanded");
              }
            }
            content.dataset.processed = "true";
          });
        };
        initializeCollapsibleContent();
        const collapsibleObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
              initializeCollapsibleContent();
              break;
            }
          }
        });
        collapsibleObserver.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll(".show-more-button").forEach((button) => {
          button.addEventListener("click", (event) => {
            const targetId = event.target.dataset.target;
            const content = document.getElementById(targetId);
            if (content) {
              content.classList.add("expanded");
              event.target.style.display = "none";
            }
          });
        });
        const loadTimeMs = performance.now();
        const loadTimeS = (loadTimeMs / 1e3).toFixed(1);
        showToast(`Welcome!`);
        showToast(`Agora loaded in ${loadTimeS}s.`);
      }
      function setOverlayPosition() {
        const nav2 = document.querySelector("nav");
        const overlays = document.querySelectorAll(".overlay");
        if (nav2 && overlays.length > 0) {
          const navHeight = nav2.offsetHeight;
          overlays.forEach((overlay2) => {
            overlay2.style.top = navHeight + "px";
            overlay2.style.height = `calc(100% - ${navHeight}px)`;
          });
        }
      }
      window.addEventListener("load", setOverlayPosition);
      window.addEventListener("resize", setOverlayPosition);
      const webContainer = document.querySelector("details.web");
      if (webContainer) {
        const tabs = webContainer.querySelectorAll(".web-provider-tab");
        const loadContent = (provider, embedDiv) => {
          if (!embedDiv || embedDiv.innerHTML.trim() !== "")
            return;
          const tabElement = webContainer.querySelector(`.web-provider-tab[data-provider="${provider}"]`);
          const url = tabElement.dataset.url;
          const externalLink = tabElement.dataset.url;
          embedDiv.innerHTML = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Checking embeddability...</em></p></center><br />`;
          fetch(`/api/check_embeddable?url=${encodeURIComponent(url)}`).then((response) => response.json()).then((data) => {
            if (data.embeddable) {
              const iframeHTML = `<iframe src="${url}" style="max-width: 99.5%;" width="99.5%" height="700em" allowfullscreen="allowfullscreen"></iframe>`;
              const overlayHTML = `<a href="${url}" target="_blank" class="iframe-url-overlay" title="Open in new tab">${url}</a>`;
              embedDiv.innerHTML = `<div class="iframe-container">${iframeHTML}${overlayHTML}</div>`;
            } else {
              embedDiv.innerHTML = `

                              <div class="subnode node">

                                  This provider has disabled embedding for security reasons, often to prevent an attack called 'clickjacking' where a malicious site might try to trick you into clicking something on the embedded page.

                                  <br/><br/>

                                  You can <a href="${externalLink}" target="_blank">open the search results in a new tab</a> instead.

                              </div>

                          `;
            }
          });
        };
        webContainer.addEventListener("toggle", (event) => {
          if (webContainer.open) {
            const activeTab = webContainer.querySelector(".web-provider-tab.active");
            if (activeTab) {
              const provider = activeTab.getAttribute("data-provider");
              const embed = webContainer.querySelector(`.web-embed[data-provider="${provider}"]`);
              loadContent(provider, embed);
            }
          }
        });
        tabs.forEach((tab) => {
          tab.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const details = webContainer;
            if (details.open && tab.classList.contains("active")) {
              const url = tab.dataset.url;
              if (url) {
                window.open(url, "_blank");
              }
              return;
            }
            if (!details.open) {
              details.open = true;
            }
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            const provider = tab.getAttribute("data-provider");
            const embeds = webContainer.querySelectorAll(".web-embed");
            embeds.forEach((embed) => {
              if (embed.dataset.provider === provider) {
                embed.style.display = "block";
                loadContent(provider, embed);
              } else {
                embed.style.display = "none";
              }
            });
          });
        });
      }
      const wpWtContainer = document.getElementById("wp-wt-container");
      if (wpWtContainer) {
        fetch("/exec/wp/" + NODENAME).then((response) => response.text()).then((html) => {
          if (html.trim()) {
            const placeholder = wpWtContainer.querySelector(".node");
            if (placeholder) {
              placeholder.classList.add("fade-out");
              placeholder.addEventListener("animationend", () => {
                wpWtContainer.innerHTML = html;
                const newContent = wpWtContainer.querySelector(".node");
                if (newContent) {
                  newContent.classList.add("fade-in");
                }
                initializeExternalStars();
                const autoExpandWikipedia2 = localStorage.getItem("auto-expand-wikipedia") === "true";
                const autoExpandExactMatch = safeJsonParse(localStorage.getItem("auto-expand-exact-match"), CLIENT_DEFAULTS.autoExpandExactMatch);
                const isEmptyNode = document.querySelector(".not-found") !== null;
                const wikiTitleElement = wpWtContainer.querySelector('.external-star-toggle[data-external-source="wikipedia"]');
                const wikiTitle = wikiTitleElement ? wikiTitleElement.getAttribute("data-external-title") : null;
                const isExactMatch = wikiTitle && wikiTitle.toLowerCase() === NODENAME.toLowerCase();
                const shouldAutoPull = autoExpandWikipedia2 || isEmptyNode && autoPull || isExactMatch && autoExpandExactMatch;
                if (shouldAutoPull) {
                  const details = wpWtContainer.querySelector(".wiki");
                  if (details) {
                    console.log("Checking toast conditions:", { isEmptyNode, autoPull, autoExpandWikipedia: autoExpandWikipedia2, isExactMatch, autoExpandExactMatch });
                    if (isEmptyNode && autoPull) {
                      showToast("Empty node: auto-expanding Wikipedia");
                    } else if (isExactMatch && autoExpandExactMatch) {
                      showToast("Exact match: auto-expanding Wikipedia");
                    } else if (autoExpandWikipedia2) {
                      showToast("Auto-expanding Wikipedia (per setting)");
                    }
                    details.setAttribute("open", "");
                  }
                }
                wpWtContainer.querySelectorAll(".wiki-provider-tab").forEach((tab) => {
                  tab.addEventListener("click", (e) => {
                    e.preventDefault();
                    const details = wpWtContainer.querySelector(".wiki");
                    if (details && details.hasAttribute("open") && tab.classList.contains("active")) {
                      const linkElement = tab.nextElementSibling?.querySelector("a");
                      if (linkElement && linkElement.href) {
                        window.open(linkElement.href, "_blank");
                      }
                      return;
                    }
                    if (details && !details.hasAttribute("open")) {
                      details.setAttribute("open", "");
                    }
                    wpWtContainer.querySelectorAll(".wiki-provider-tab").forEach((t) => t.classList.remove("active"));
                    tab.classList.add("active");
                    const provider = tab.dataset.provider;
                    wpWtContainer.querySelectorAll(".wiki-embed").forEach((embed) => {
                      if (embed.dataset.provider === provider) {
                        embed.style.display = "block";
                      } else {
                        embed.style.display = "none";
                      }
                    });
                  });
                });
                applyDismissals();
              }, { once: true });
            } else {
              wpWtContainer.innerHTML = html;
              applyDismissals();
            }
          }
        });
      }
      document.querySelectorAll(".go-url").forEach((element) => {
        element.addEventListener("click", function() {
          let url = this.value;
          this.innerText = "going";
          window.location.href = url;
        });
      });
      const currentUser = localStorage.getItem("user");
      if (currentUser && currentUser !== "agora") {
        setTimeout(() => {
          const safeUser = currentUser.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          showToast(`Browsing as <strong>@${safeUser}</strong> <a href="#" id="toast-change-user" style="font-size: 0.85em; text-decoration: underline;">(change)</a>`);
          setTimeout(() => {
            const link = document.getElementById("toast-change-user");
            if (link) {
              link.addEventListener("click", (e) => {
                e.preventDefault();
                const overlay2 = document.getElementById("overlay");
                if (overlay2) {
                  overlay2.classList.add("active");
                  document.body.classList.add("overlay-open");
                }
              });
            }
          }, 50);
        }, 1e3);
      }
      if (autoExec) {
        console.log("autoexec is enabled");
        document.querySelectorAll(".context-all").forEach(function(element) {
          const detailsElement = element.closest("details");
          if (detailsElement) {
            detailsElement.addEventListener("toggle", () => {
              if (detailsElement.open) {
                const placeholder = document.getElementById("full-graph-placeholder");
                if (placeholder) {
                  placeholder.addEventListener("click", async () => {
                    const container = document.getElementById("full-graph-container");
                    const spinner = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Loading graph... (please wait)</em></p></center><br />`;
                    container.innerHTML = spinner;
                    try {
                      const response = await fetch(AGORAURL + "/context/all");
                      container.innerHTML = await response.text();
                    } catch (error) {
                      container.innerHTML = `<p>Error loading graph: ${error}</p>`;
                    }
                  }, { once: true });
                }
              }
            });
          }
        });
        console.log("dynamic execution for node begins: " + NODENAME);
        const req_wikipedia = AGORAURL + "/exec/wp/" + encodeURI(NODENAME);
        console.log("req for Wikipedia: " + req_wikipedia);
        try {
          const response = await fetch(req_wikipedia);
          const data = await response.text();
          const wikiSearchElement = document.querySelector(".wiki-search");
          if (data && wikiSearchElement) {
            console.log("Got some data from Wikipedia, showing data");
            wikiSearchElement.style.display = "";
            wikiSearchElement.innerHTML = data;
            initializeExternalStars();
          } else {
            console.log("got empty data from Wikipedia, hiding div");
            if (wikiSearchElement) {
              wikiSearchElement.style.display = "none";
            }
          }
        } catch (error) {
          console.error("Error fetching Wikipedia data:", error);
        }
        let req_wiktionary = AGORAURL + "/exec/wt/" + encodeURI(NODENAME);
        console.log("req for Wiktionary: " + req_wiktionary);
        try {
          const response = await fetch(req_wiktionary);
          const data = await response.text();
          const wiktionaryElement = document.querySelector(".wiktionary-search");
          if (data && wiktionaryElement) {
            wiktionaryElement.innerHTML = data;
          } else {
            console.log("got empty data from Wiktionary, hiding div");
            if (wiktionaryElement) {
              wiktionaryElement.style.display = "none";
            }
          }
        } catch (error) {
          console.error("Error fetching Wiktionary data:", error);
        }
      }
      const featureLinkDialog = document.getElementById("feature-link-dialog");
      if (featureLinkDialog) {
        const dialog = document.getElementById("not-implemented-dialog");
        const closeButton = document.getElementById("close-dialog-btn");
        if (dialog && closeButton) {
          featureLinkDialog.addEventListener("click", function(ev) {
            ev.preventDefault();
            dialog.showModal();
          });
          closeButton.addEventListener("click", function() {
            dialog.close();
          });
          dialog.addEventListener("click", function(e) {
            if (e.target === dialog) {
              dialog.close();
            }
          });
        }
      }
    });
  }
});

// node_modules/regenerator-runtime/runtime.js
var require_runtime = __commonJS({
  "node_modules/regenerator-runtime/runtime.js"(exports, module) {
    var runtime = function(exports2) {
      "use strict";
      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined2;
      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
      function define(obj, key, value) {
        Object.defineProperty(obj, key, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        });
        return obj[key];
      }
      try {
        define({}, "");
      } catch (err) {
        define = function(obj, key, value) {
          return obj[key] = value;
        };
      }
      function wrap(innerFn, outerFn, self, tryLocsList) {
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []);
        generator._invoke = makeInvokeMethod(innerFn, self, context);
        return generator;
      }
      exports2.wrap = wrap;
      function tryCatch(fn, obj, arg) {
        try {
          return { type: "normal", arg: fn.call(obj, arg) };
        } catch (err) {
          return { type: "throw", arg: err };
        }
      }
      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed";
      var ContinueSentinel = {};
      function Generator() {
      }
      function GeneratorFunction() {
      }
      function GeneratorFunctionPrototype() {
      }
      var IteratorPrototype = {};
      define(IteratorPrototype, iteratorSymbol, function() {
        return this;
      });
      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
      if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        IteratorPrototype = NativeIteratorPrototype;
      }
      var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = GeneratorFunctionPrototype;
      define(Gp, "constructor", GeneratorFunctionPrototype);
      define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
      GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction");
      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function(method) {
          define(prototype, method, function(arg) {
            return this._invoke(method, arg);
          });
        });
      }
      exports2.isGeneratorFunction = function(genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor ? ctor === GeneratorFunction || (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
      };
      exports2.mark = function(genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;
          define(genFun, toStringTagSymbol, "GeneratorFunction");
        }
        genFun.prototype = Object.create(Gp);
        return genFun;
      };
      exports2.awrap = function(arg) {
        return { __await: arg };
      };
      function AsyncIterator(generator, PromiseImpl) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);
          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;
            if (value && typeof value === "object" && hasOwn.call(value, "__await")) {
              return PromiseImpl.resolve(value.__await).then(function(value2) {
                invoke("next", value2, resolve, reject);
              }, function(err) {
                invoke("throw", err, resolve, reject);
              });
            }
            return PromiseImpl.resolve(value).then(function(unwrapped) {
              result.value = unwrapped;
              resolve(result);
            }, function(error) {
              return invoke("throw", error, resolve, reject);
            });
          }
        }
        var previousPromise;
        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new PromiseImpl(function(resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }
          return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
        this._invoke = enqueue;
      }
      defineIteratorMethods(AsyncIterator.prototype);
      define(AsyncIterator.prototype, asyncIteratorSymbol, function() {
        return this;
      });
      exports2.AsyncIterator = AsyncIterator;
      exports2.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
        if (PromiseImpl === void 0)
          PromiseImpl = Promise;
        var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
        return exports2.isGeneratorFunction(outerFn) ? iter : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
      };
      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;
        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }
          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            }
            return doneResult();
          }
          context.method = method;
          context.arg = arg;
          while (true) {
            var delegate = context.delegate;
            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);
              if (delegateResult) {
                if (delegateResult === ContinueSentinel)
                  continue;
                return delegateResult;
              }
            }
            if (context.method === "next") {
              context.sent = context._sent = context.arg;
            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }
              context.dispatchException(context.arg);
            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }
            state = GenStateExecuting;
            var record = tryCatch(innerFn, self, context);
            if (record.type === "normal") {
              state = context.done ? GenStateCompleted : GenStateSuspendedYield;
              if (record.arg === ContinueSentinel) {
                continue;
              }
              return {
                value: record.arg,
                done: context.done
              };
            } else if (record.type === "throw") {
              state = GenStateCompleted;
              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      }
      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];
        if (method === undefined2) {
          context.delegate = null;
          if (context.method === "throw") {
            if (delegate.iterator["return"]) {
              context.method = "return";
              context.arg = undefined2;
              maybeInvokeDelegate(delegate, context);
              if (context.method === "throw") {
                return ContinueSentinel;
              }
            }
            context.method = "throw";
            context.arg = new TypeError("The iterator does not provide a 'throw' method");
          }
          return ContinueSentinel;
        }
        var record = tryCatch(method, delegate.iterator, context.arg);
        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }
        var info = record.arg;
        if (!info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }
        if (info.done) {
          context[delegate.resultName] = info.value;
          context.next = delegate.nextLoc;
          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined2;
          }
        } else {
          return info;
        }
        context.delegate = null;
        return ContinueSentinel;
      }
      defineIteratorMethods(Gp);
      define(Gp, toStringTagSymbol, "Generator");
      define(Gp, iteratorSymbol, function() {
        return this;
      });
      define(Gp, "toString", function() {
        return "[object Generator]";
      });
      function pushTryEntry(locs) {
        var entry = { tryLoc: locs[0] };
        if (1 in locs) {
          entry.catchLoc = locs[1];
        }
        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }
        this.tryEntries.push(entry);
      }
      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }
      function Context(tryLocsList) {
        this.tryEntries = [{ tryLoc: "root" }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }
      exports2.keys = function(object) {
        var keys = [];
        for (var key in object) {
          keys.push(key);
        }
        keys.reverse();
        return function next() {
          while (keys.length) {
            var key2 = keys.pop();
            if (key2 in object) {
              next.value = key2;
              next.done = false;
              return next;
            }
          }
          next.done = true;
          return next;
        };
      };
      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];
          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }
          if (typeof iterable.next === "function") {
            return iterable;
          }
          if (!isNaN(iterable.length)) {
            var i = -1, next = function next2() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next2.value = iterable[i];
                  next2.done = false;
                  return next2;
                }
              }
              next2.value = undefined2;
              next2.done = true;
              return next2;
            };
            return next.next = next;
          }
        }
        return { next: doneResult };
      }
      exports2.values = values;
      function doneResult() {
        return { value: undefined2, done: true };
      }
      Context.prototype = {
        constructor: Context,
        reset: function(skipTempReset) {
          this.prev = 0;
          this.next = 0;
          this.sent = this._sent = undefined2;
          this.done = false;
          this.delegate = null;
          this.method = "next";
          this.arg = undefined2;
          this.tryEntries.forEach(resetTryEntry);
          if (!skipTempReset) {
            for (var name in this) {
              if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
                this[name] = undefined2;
              }
            }
          }
        },
        stop: function() {
          this.done = true;
          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;
          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }
          return this.rval;
        },
        dispatchException: function(exception) {
          if (this.done) {
            throw exception;
          }
          var context = this;
          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;
            if (caught) {
              context.method = "next";
              context.arg = undefined2;
            }
            return !!caught;
          }
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;
            if (entry.tryLoc === "root") {
              return handle("end");
            }
            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");
              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }
              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },
        abrupt: function(type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }
          if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
            finallyEntry = null;
          }
          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;
          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }
          return this.complete(record);
        },
        complete: function(record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }
          if (record.type === "break" || record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }
          return ContinueSentinel;
        },
        finish: function(finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },
        "catch": function(tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;
              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }
              return thrown;
            }
          }
          throw new Error("illegal catch attempt");
        },
        delegateYield: function(iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName,
            nextLoc
          };
          if (this.method === "next") {
            this.arg = undefined2;
          }
          return ContinueSentinel;
        }
      };
      return exports2;
    }(typeof module === "object" ? module.exports : {});
    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      if (typeof globalThis === "object") {
        globalThis.regeneratorRuntime = runtime;
      } else {
        Function("r", "regeneratorRuntime = r")(runtime);
      }
    }
  }
});

// app/js-src/util.js
var util_exports = {};
var import_runtime, u;
var init_util2 = __esm({
  "app/js-src/util.js"() {
    import_runtime = __toESM(require_runtime());
    u = {};
    u.replaceStrings = (str) => {
      const wikireg = /\[\[(.*?)\]\]/g;
      const out = str.matchAll(wikireg);
      for (const rep of out) {
        const slug = rep[1];
        const wiki = rep[0];
        const f = slug.toLowerCase().replace(/ /g, "-");
        str = str.replace(wiki, `<a href='/${f}'>${wiki}</a>`);
      }
      return str;
    };
    u.downloadPage = async (userId, pageName) => {
      console.log("downloading", pageName);
      let route = `${config.ctznhost}/${userId}-${pageName}`;
      let res = await fetch(route);
      res.text();
    };
    window.Util = u;
  }
});

// app/js-src/index.ts
init_main();
init_util2();
