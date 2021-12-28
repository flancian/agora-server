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
    // console.log($(this).text())
    const url = `/pull/${$(this).text().replace(" ", "-")}`
    // const data = await fetch(url).then(res => res.json())
    // console.log(data)
    console.log(mouseX, mouseY)
    await sleep(1000);
    $("#popup").html("").hide()
    $("#popup").css({ 'top': mouseY, 'left': mouseX }).html(`<div><button onclick='closePopup()'>Close X</button></div><iframe src=${url} width=500 height=300></iframe>`).show()
}, function () {
});


