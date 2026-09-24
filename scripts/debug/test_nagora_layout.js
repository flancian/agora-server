import { spawn } from 'node:child_process';

async function main() {
  const chrome = spawn('/home/flancian/bin/chromium', [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--window-size=1400,900'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));

    const newRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
    const target = await newRes.json();

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value !== undefined ? JSON.stringify(a.value) : (a.description || '')).join(' ');
        console.log('[BROWSER CONSOLE]', msg.params.type, text);
      } else if (msg.method === 'Log.entryAdded') {
        console.log('[BROWSER LOG]', msg.params.entry.level, msg.params.entry.text);
      } else if (msg.method === 'Fetch.requestPaused') {
        const { requestId, request } = msg.params;
        const newUrl = request.url.replace('https://tar.agor.ai', 'http://127.0.0.1:5017');
        await send('Fetch.continueRequest', { requestId, url: newUrl });
      }
    };

    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
      const msgId = id++;
      return new Promise((resolve) => {
        pending.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Fetch.enable', {
      patterns: [{ urlPattern: 'https://tar.agor.ai/*' }]
    });

    // Pre-populate localStorage so 3-column mode is active
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem('enable-experimental', 'true');
        localStorage.setItem('enable-nagora', 'true');
        localStorage.setItem('nagora-columns', '3');
      `
    });

    console.log('Navigating to http://127.0.0.1:5017/testing ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5017/testing' });

    // Wait 2s for loading skeleton
    await new Promise(r => setTimeout(r, 2000));

    const snapshotFn = `(() => {
      function serializeRect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom };
      }
      const left = document.getElementById('nagora-left-pane');
      const right = document.getElementById('nagora-right-pane');
      const root = document.getElementById('nagora-root');
      const content = document.querySelector('.content');
      const leftIframe = left?.querySelector('.nagora-pane-iframe');
      const rightIframe = right?.querySelector('.nagora-pane-iframe');

      // Detailed offset inspection
      const rootChildren = Array.from(root?.children || []).map(c => ({
        tag: c.tagName,
        id: c.id,
        className: c.className,
        rect: serializeRect(c),
        offsetTop: c.offsetTop,
        marginTop: getComputedStyle(c).marginTop,
        display: getComputedStyle(c).display
      }));

      const leftComputed = left ? {
        position: getComputedStyle(left).position,
        top: getComputedStyle(left).top,
        marginTop: getComputedStyle(left).marginTop,
        paddingTop: getComputedStyle(left).paddingTop,
        alignSelf: getComputedStyle(left).alignSelf,
        offsetTop: left.offsetTop,
        offsetParent: left.offsetParent?.tagName + '#' + left.offsetParent?.id
      } : null;

      const canopyFooter = document.getElementById('agora-canopy-footer');
      const relatedNodes = document.getElementById('related-nodes');
      const playBtn = document.getElementById('mini-cli-play');

      return {
        rootChildren,
        leftComputed,
        playButtonDisplay: playBtn ? getComputedStyle(playBtn).display : null,
        mainCanopyFooter: canopyFooter ? {
          rect: serializeRect(canopyFooter),
          display: getComputedStyle(canopyFooter).display,
          footerText: canopyFooter.querySelector('#footer')?.textContent?.trim().slice(0, 80)
        } : null,
        mainRelatedNodes: relatedNodes ? {
          summary: relatedNodes.querySelector('summary')?.textContent?.trim(),
          rect: serializeRect(relatedNodes),
          open: relatedNodes.open
        } : null,
        sectionOrder: Array.from(document.querySelectorAll('.content .sortable-section')).map(el => ({
          id: el.id,
          section: el.dataset.section,
          top: el.getBoundingClientRect().top
        })),
        leftEmbed: {
          hasFooterInDom: Boolean(leftIframe?.contentDocument?.getElementById('footer')),
          footerDisplay: leftIframe?.contentDocument?.getElementById('footer') ? getComputedStyle(leftIframe.contentDocument.getElementById('footer')).display : 'none',
          hasRelatedInDom: Boolean(leftIframe?.contentDocument?.getElementById('related-nodes')),
          relatedSummary: leftIframe?.contentDocument?.getElementById('related-nodes')?.querySelector('summary')?.textContent?.trim(),
          sectionOrder: Array.from(leftIframe?.contentDocument?.querySelectorAll('.content .sortable-section') || []).map(el => ({
            id: el.id,
            section: el.dataset.section
          }))
        },
        rightEmbed: {
          hasFooterInDom: Boolean(rightIframe?.contentDocument?.getElementById('footer')),
          footerDisplay: rightIframe?.contentDocument?.getElementById('footer') ? getComputedStyle(rightIframe.contentDocument.getElementById('footer')).display : 'none',
          hasRelatedInDom: Boolean(rightIframe?.contentDocument?.getElementById('related-nodes')),
          relatedSummary: rightIframe?.contentDocument?.getElementById('related-nodes')?.querySelector('summary')?.textContent?.trim()
        }
      };
    })()`;

    const evalRes1 = await send('Runtime.evaluate', { expression: snapshotFn, returnByValue: true });
    console.log('--- Loading State Snapshot (2s) ---:\n', JSON.stringify(evalRes1.result.value, null, 2));

    // Wait 5 more seconds for central node and iframes to finish loading
    await new Promise(r => setTimeout(r, 6000));

    const evalRes2 = await send('Runtime.evaluate', { expression: snapshotFn, returnByValue: true });
    console.log('--- Post-Load State Snapshot at scroll 0 (8s) ---:\n', JSON.stringify(evalRes2.result.value, null, 2));

    // Scroll back to top and capture screenshot
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await new Promise(r => setTimeout(r, 400));
    const ssRes = await send('Page.captureScreenshot');
    import('node:fs').then(fs => {
      fs.writeFileSync('/tmp/nagora_post_load_fixed.png', Buffer.from(ssRes.data, 'base64'));
      console.log('Saved screenshot to /tmp/nagora_post_load_fixed.png');
    });

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
