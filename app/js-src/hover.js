let mouseX;
let mouseY;
let locked = false;

$(document).mousemove(function (e) {
  mouseX = e.pageX;
  mouseY = e.pageY + 50;
});

function closePopup() {
  $("#popup").css("display", "none");
  locked = false
}

$(".wikilink").hover(async function () {
  locked = true
  // console.log(mouseX, mouseY)
  const url = `/pull/${$(this).text().replaceAll(" ", "-")}`
  setTimeout(() => showBox(url), 1000)

}, async function () {
});

function showBox(url){

  $.get(url, function (data) {
    if (!locked) return
    $("#popup").css({ 'top': mouseY, 'left': mouseX, 'background-color': 'var(--main-bg)' })
    $("#popup").html(`<div><button onclick='closePopup()'>Close X</button></div>` + '<iframe src="' + AGORAURL + url + '" width="960" height="500" frameborder="0"></iframe>').show()
  });
}

$(document).click(closePopup)
