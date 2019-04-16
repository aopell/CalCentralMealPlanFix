class MealSwipesDisplay {
    constructor() {
        this.table = document.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table") || document.querySelector("body > div > div.container.clearfix > div > div > div > div.col3 > div > table")

        this.swipesThisWeek = Array.from(this.table.rows).filter(x => !!Date.parse(x.cells[0].textContent) && Date.parse(x.cells[0].textContent) > new Date(Date.now() - new Date().getDay() * 86400000).setHours(0, 0, 0, 0));
        this.swipes = this.swipesThisWeek.length;

        if (this.table.rows[0].textContent.toLowerCase().includes("blue")) {
            this.swipesRemaining = 12 - this.swipes;
        } else {
            this.swipesRemaining = null;
        }
    }

    show() {
        let r = this.table.insertRow(0);
        let c = r.insertCell(0);
        c.colspan = 4;
        c.style.color = "#24408e";
        c.style.backgroundColor = "#bcda6b";
        c.innerHTML = `<b>Meal Swipes used this week: ${this.swipes}</b>`

        r = this.table.insertRow(1);
        c = r.insertCell(0);
        c.colspan = 4;
        c.style.color = "#24408e";
        c.style.backgroundColor = "#bcda6b";
        c.innerHTML = `<b>Meal Swipes remaining this week: ${this.swipesRemaining || "Unlimited"}</b>`;
        r.firstElementChild.style.borderBottom = "50px solid white";
    }

    highlightRows() {
        for (let s of this.swipesThisWeek) {
            s.style.backgroundColor = "#bcda6b";
            s.style.color = "#24408e";
        }
    }
}

let display = new MealSwipesDisplay();
display.show();
display.highlightRows();