let mouseX;
let mouseY;
let locked = false;

$(document).mousemove(function (e) {
  mouseX = e.pageX;
  mouseY = e.pageY + 50;
});

function closePopup() {
  $("#popup").css("display", "none");
}

$(".wikilink").hover(async function () {
  locked = true
  // console.log(mouseX, mouseY)
  const url = `/pull/${$(this).text().replaceAll(" ", "-")}`
  setTimeout(() => showBox(url), 1000)

}, async function () {
  locked = false
});

function showBox(url){
  $.get(url, function (data) {
    if (!locked) return
    $("#popup").css({ 'top': mouseY, 'left': mouseX, 'background-color': 'black' })
    $("#popup").html(`<div><button onclick='closePopup()'>Close X</button></div>` + data).show()
  });
}


