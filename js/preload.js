log = (message) => console.log("[CCI] " + message);

let mealPlanType = "Meal Plan";

/**
 * Creates a DOM element
 * @returns {HTMLElement} A DOM element
 * @param {string} tag - The HTML tag name of the type of DOM element to create
 * @param {string[]} classList - CSS classes to apply to the DOM element
 * @param {Object} properties - Properties to apply to the DOM element
 * @param {HTMLElement[]} children - Elements to append as children to the created element
 */
function createElement(tag, classList, properties, children) {
    let element = document.createElement(tag);
    if (classList) {
        for (let c of classList) {
            element.classList.add(c);
        }
    }
    if (properties) {
        for (let property in properties) {
            element[property] = properties[property];
        }
    }
    if (children) {
        for (let child of children) {
            element.appendChild(child);
        }
    }
    return element;
}

class Cal1CardWidget {
    constructor({ debitBalance = '', debitSummary = '', flexBalance = '', flexSummary = '', mealPlanName = '', mealBalance = '', mealSummary = '', usedSwipes = '', usedFlex = '', usedDebit = '', mealSwipeTransactions = [], flexTransactions = [], debitTransactions = [] } = {}) {
        let sunday = new Date();
        sunday.setDate(sunday.getDate() - sunday.getDay());
        sunday.setHours(0, 0, 0, 0);
        this.element = document.createElement("div");
        this.element.innerHTML = createFromTemplate(debitBalance, flexBalance, mealPlanName, mealBalance, usedSwipes, usedFlex, usedDebit, mealSwipeTransactions, flexTransactions, debitTransactions);
        this.element = this.element.firstElementChild;
        this.element.querySelector("#debit-summary").title = debitSummary;
        this.element.querySelector("#flex-summary").title = flexSummary;
        this.element.querySelector("#meal-summary").title = mealSummary;
        this.element.querySelector("#open-overlay-button").addEventListener("click", f => showOverlay({ mealSwipeTransactions, flexTransactions, debitTransactions }));
    }

    static createEmpty() {
        let widget = new Cal1CardWidget();

        widget.element.querySelector(".cc-cal1card [data-cc-spinner-directive]").outerHTML = "";
        let button = widget.element.querySelector(".cc-cal1card .cc-button");
        button.textContent = "Show Card Information";
        button.href = "https://services.housing.berkeley.edu/c1c/dyn/login.asp";
        button.title = "You must authenticate with CalDining and reload to see Cal 1 Card info on CalCentral";
        button.addEventListener(e => {
            setTimeout(() => {
                widget.outerHTML = "";
                finances();
            }, 5000);
        });

        return widget;
    }
}

function backgroundPageFetch(url, init, bodyReadType) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "fetch", url: url, params: init, bodyReadType: bodyReadType }, function (response) {
            if (!response.success) {
                reject(response.error);
                return;
            }

            delete response.success;

            let bodyReadError = response.bodyReadError;
            delete response.bodyReadError;

            let bodyContent = response[bodyReadType];
            let readBodyTask = new Promise((readBodyResolve, readBodyReject) => {
                if (bodyReadError) {
                    if (bodyReadError === true) {
                        readBodyReject();
                    } else {
                        readBodyReject(bodyReadError);
                    }
                } else {
                    readBodyResolve(bodyContent);
                }
            });
            response[bodyReadType] = () => readBodyTask;

            resolve(response);
        });
    });
}

async function finances(runAgain = true) {
    if (document.querySelector(".meal-plan-info-added")) return;
    debitTransactions = [];
    mealSwipeTransactions = [];
    flexTransactions = [];
    mealPlanType = "Meal Plan";

    let tempdiv = document.createElement("div");
    tempdiv.appendChild(document.createElement("div"));
    tempdiv.appendChild(document.createElement("div"));

    // Log in
    await backgroundPageFetch("https://services.housing.berkeley.edu/c1c/dyn/login.asp?view=CD", {}, "text");
    let allTransactions = await (await backgroundPageFetch("https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=Full", {}, "text")).text();
    let balances = await (await backgroundPageFetch("https://services.housing.berkeley.edu/c1c/dyn/balance.asp", {}, "text")).text();
    tempdiv.firstElementChild.innerHTML = allTransactions;
    tempdiv.lastElementChild.innerHTML = balances;

    try {
        let table = tempdiv.firstElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody");

        let flexBalance = 0;
        let debitBalance = 0;
        for (let row of Array.from(tempdiv.lastElementChild.querySelectorAll("table table table tr>td:first-child")).filter(x => x.children.length > 0)) {
            let text = row.textContent.toLowerCase();
            if (text.includes("cal 1 card debit")) {
                debitBalance += Number.parseFloat(text.match(/:\D*(\d+(\.\d{1,2})?)/)[1]);
            } else if (text.includes("flex")) {
                flexBalance += Number.parseFloat(text.match(/\d+(\.\d{1,2})?/)[0]);
            }
        }

        let { mealSwipeTransactions, flexTransactions, debitTransactions } = loadData(table);

        let sunday = new Date();
        sunday.setDate(sunday.getDate() - sunday.getDay());
        sunday.setHours(0, 0, 0, 0);
        let nextSaturday = new Date(sunday.valueOf());
        nextSaturday.setDate(nextSaturday.getDate() + 6);
        let nextSunday = new Date(sunday.valueOf());
        nextSunday.setDate(nextSunday.getDate() + 7);

        let swipesThisWeek = mealSwipeTransactions.filter(x => x.date > sunday);
        let debitThisWeek = debitTransactions.filter(x => x.date > sunday).reduce((a, b) => a + Number.parseFloat(b.amount), 0);
        let flexThisWeek = flexTransactions.filter(x => x.date > sunday).reduce((a, b) => a + Number.parseFloat(b.amount), 0);

        let widget = new Cal1CardWidget({
            debitBalance: (+debitBalance).toFixed(2),
            flexBalance: (+flexBalance).toFixed(2),
            mealBalance: mealPlanType.toLocaleLowerCase().includes("blue") ? (12 - swipesThisWeek.length) : "Unlimited",
            mealPlanName: mealPlanType,
            mealSummary: swipesThisWeek.reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)} - ${getMeal(b.date)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}: ${swipesThisWeek.length} swipes\n`),
            usedSwipes: swipesThisWeek.length,
            debitSummary: debitTransactions.filter(x => x.date > sunday).reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)}: ${Number.parseFloat(b.amount) > 0 ? '+' : '-'}$${Math.abs(b.amount).toFixed(2)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}:\n`),
            usedDebit: `${debitThisWeek > 0 ? '+' : '-'}$${Math.abs(debitThisWeek).toFixed(2)}`,
            flexSummary: flexTransactions.filter(x => x.date > sunday).reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)}: ${Number.parseFloat(b.amount) > 0 ? '+' : '-'}$${Math.abs(b.amount).toFixed(2)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}:\n`),
            usedFlex: `${flexThisWeek > 0 ? '+' : '-'}$${Math.abs(flexThisWeek).toFixed(2)}`,
            mealSwipeTransactions,
            flexTransactions,
            debitTransactions
        });

        let col = document.querySelector("#cc-main-content > div.cc-clearfix-container.ng-scope > div > div > div.medium-6.large-4.columns.ng-scope");
        col.appendChild(createElement("div", ["ng-scope"], {}, [widget.element]));
    }
    catch (ex) {
        if (runAgain) {
            console.warn("[CCI] Caught error, retrying. Error:", ex);
            setTimeout(() => {
                finances(false);
            }, 2000);
        } else {
            log("Second failure, aborting");
            console.error(ex);
            let col = document.querySelector("#cc-main-content > div.cc-clearfix-container.ng-scope > div > div > div.medium-6.large-4.columns.ng-scope");
            let widget = Cal1CardWidget.createEmpty();
            col.appendChild(createElement("div", ["ng-scope"], {}, [widget.element]));
        }
    }
}

function getMeal(date) {
    if (date.getDay() % 6) { // Weekday
        return date.getHours() >= 16 ? "Dinner" : (date.getHours() >= 10 ? "Lunch" : "Breakfast");
    } else { // Weekend
        return date.getHours() >= 16 ? "Dinner" : "Brunch";
    }
}

function getPrettyDateTimeString(date) {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours() == 12 ? 12 : date.getHours() % 12}:${date.getMinutes() < 10 ? "0" : ""}${date.getMinutes()} ${date.getHours() / 12 >= 1 ? "PM" : "AM"}`;
}

/**
 * Removes " 2" and " S2" from end of string
 * @param {string} text Input string to clean
 */
function clean(text) {
    if (text === "Crossroad S2") {
        return "Crossroads";
    } else if (text.endsWith(" 2")) {
        return text.substring(0, text.length - 2);
    } else if (text.endsWith(" S2")) {
        return text.substring(0, text.length - 3);
    }

    return text;
}

function loadData(table) {
    debitTransactions = [];
    mealSwipeTransactions = [];
    flexTransactions = [];

    let section = 0;

    for (let row of table.children) {
        switch (section) {
            case 0:
                if (row.textContent.match("Debit")) {
                    section = 1;
                }
                break;
            case 1:
                if (row.textContent.match("Meal")) {
                    section = 2;
                    mealPlanType = row.textContent.replace(" Activity", "");
                    break;
                }
                if (row.firstElementChild.tagName == "TH") break;
                try {
                    debitTransactions.push({
                        date: new Date(Date.parse(row.children[0].textContent)),
                        amount: (() => {
                            let result = row.children[1].textContent.match(/(\(?)\$(\d+\.\d\d)/);
                            return (result[2] * (result[1] ? 1 : -1)).toFixed(2);
                        })(),
                        balance: row.children[2].textContent.match(/(\(?)\$(\d+\.\d\d)/)[2],
                        location: clean(row.children[3].textContent)
                    });
                } catch (e) { console.warn("Caught error: %o", e) }
                break;
            case 2:
                if (row.textContent.match("Flex")) {
                    section = 3;
                    break;
                }
                if (row.firstElementChild.tagName == "TH") break;
                try {
                    mealSwipeTransactions.push({
                        date: new Date(Date.parse(row.children[0].textContent)),
                        swipes: +row.children[1].textContent,
                        location: clean(row.children[3].textContent)
                    });
                } catch (e) { console.warn("Caught error: %o", e) }
                break;
            case 3:
                if (row.firstElementChild.tagName == "TH") break;
                try {
                    flexTransactions.push({
                        date: new Date(Date.parse(row.children[0].textContent)),
                        amount: (() => {
                            let result = row.children[1].textContent.match(/(\(?)\$(\d+\.\d\d)/);
                            return (result[2] * (result[1] ? 1 : -1)).toFixed(2);
                        })(),
                        balance: row.children[2].textContent.match(/(\(?)\$(\d+\.\d\d)/)[2],
                        location: clean(row.children[3].textContent)
                    });
                } catch (e) { console.warn("Caught error: %o", e) }
                break;
        }
    }

    return {
        mealSwipeTransactions,
        flexTransactions,
        debitTransactions
    };
}