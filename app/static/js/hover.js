let mouseX;
let mouseY;
$(document).mousemove(function (e) {
    mouseX = e.pageX + 100;
    mouseY = e.pageY;
});

function closePopup() {
    $("#popup").css("display", "none");
}


$(".wikilink").hover(async function () {
    // console.log($(this).text())
    const url = `/node/${$(this).text().replace(" ", "-")}`
    // const data = await fetch(url).then(res => res.json())
    // console.log(data)
    console.log(mouseX, mouseY)
    $("#popup").html("").hide()
    $("#popup").css({ 'top': mouseY, 'left': mouseX }).html(`<div><button onclick='closePopup()'>Close X</button></div><iframe src=${url}  width=800 height=500></iframe>`).show()
}, function () {
});


