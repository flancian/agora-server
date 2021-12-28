let mouseX;
let mouseY;

$(document).mousemove(function (e) {
    mouseX = e.pageX + 100;
    mouseY = e.pageY;
});

function closePopup() {
    $("#popup").css("display", "none");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

$(".wikilink").hover(async function () {

    console.log(mouseX, mouseY)
    $("#popup").html("").hide()
    const url = `/pull/${$(this).text().replaceAll(" ", "-")}`

    $.get(url, function (data) {
      $("#popup").css({ 'top': mouseY, 'left': mouseX, 'background-color': 'black'})
      $("#popup").html(`<div><button onclick='closePopup()'>Close X</button></div>` + data).show()
    });

    await sleep(1000);

}, function () {
    $("#popup").html("").hide()
});


