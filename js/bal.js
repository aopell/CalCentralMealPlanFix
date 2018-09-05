// CalDining version

let table = document.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table") || document.querySelector("body > div > div.container.clearfix > div > div > div > div.col3 > div > table")

let swipes = Array.from(table.rows).map(x => x.cells[0]).filter(x => !!Date.parse(x.textContent) && Date.parse(x.textContent) > new Date(Date.now() - new Date().getDay() * 86400000).setHours(0, 0, 0, 0)).length

let r = table.insertRow(0);
let c = r.insertCell(0);
c.colspan = 4;
c.style.color = "#24408e";
c.style.backgroundColor = "#bcda6b";
c.innerHTML = `<b>Meal Swipes used this week: ${swipes}</b>`

if (table.rows[1].textContent.includes("Blue")) {
    r = table.insertRow(1);
    c = r.insertCell(0);
    c.colspan = 4;
    c.style.color = "#24408e";
    c.style.backgroundColor = "#bcda6b";
    c.innerHTML = `<b>Meal Swipes remaining this week: ${12 - swipes}</b>`;
}

r.style.borderBottom = "50px solid white";