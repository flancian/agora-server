let mouseX;
let mouseY;
let locked = false;

document.addEventListener('mousemove', (e) => {
  mouseX = e.pageX;
  mouseY = e.pageY + 50;
});

function closePopup() {
  const popup = document.querySelector("#popup");
  if (popup) {
    popup.style.display = "none";
  }
  locked = false;
}

document.querySelectorAll(".wikilink").forEach(link => {
  link.addEventListener('mouseenter', async (e) => {
    locked = true;
    const url = `/pull/${e.target.textContent.replaceAll(" ", "-")}`;
    setTimeout(() => showBox(url), 1000);
  });
});

function showBox(url) {
  fetch(url)
    .then(response => response.text())
    .then(data => {
      if (!locked) return;
      const popup = document.querySelector("#popup");
      if (popup) {
        popup.style.top = `${mouseY}px`;
        popup.style.left = `${mouseX}px`;
        popup.style.backgroundColor = 'var(--main-bg)';
        popup.innerHTML = `<div><button onclick='closePopup()'>Close X</button></div><iframe src="${AGORAURL}${url}" width="960" height="500" frameborder="0"></iframe>`;
        popup.style.display = 'block';
      }
    });
}

document.addEventListener('click', closePopup);