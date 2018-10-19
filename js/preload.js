log = (message) => console.log("[CCI] " + message);

let debitTransactions = [];
let mealSwipeTransactions = [];
let flexTransactions = [];
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

function createCal1CardWidget({ debitBalance, debitSummary, flexBalance, flexSummary, mealPlanName, mealBalance, mealSummary, usedSwipes, usedFlex, usedDebit }) {
    let sunday = new Date();
    sunday.setDate(sunday.getDate() - sunday.getDay());
    sunday.setHours(0, 0, 0, 0);
    let e = document.createElement("div");
    e.innerHTML = `<div class="cc-cal1card cc-widget"><div class="cc-cal1card-logo cc-widget-title"><h2 class="cc-left">Cal 1 Card</h2><a class="cc-right cc-button cc-widget-title-button ng-scope" href="http://cal1card.berkeley.edu">Manage Card</a></div><div data-cc-spinner-directive><ul class="cc-widget-list"><li class="cc-clearfix-container"><div><div class="cc-cal1card-header"><strong>Debit Account Balance</strong></div><span class="cc-left cc-cal1card-amount">$${debitBalance}</span><div id="debit-link" class="cc-right"><abbr id="debit-summary">${usedDebit} this week</abbr><br><a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=c1c">View Debit Transactions</a></div></div></li><li class="cc-clearfix-container"><div><div class="cc-cal1card-header"><strong>Flex Dollars Balance</strong></div><span class="cc-left cc-cal1card-amount">$${flexBalance}</span><div id="flex-link" class="cc-right"><abbr id="flex-summary">${usedFlex} this week</abbr><br><a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=50">View Flex Dollar Transactions</a></div></div></li><li class="cc-clearfix-container"><div><div class="cc-cal1card-header"><strong>${mealPlanName} Balance</strong></div><span class="cc-left cc-cal1card-amount">${mealBalance} <span style="font-size:12px">swipes</span></span><div id="meal-link" class="cc-right"><abbr id="meal-summary">${usedSwipes} swipes used this week</abbr><br><a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=rb">View Meal Swipe History</a></div></div></li><li></li></ul></div></div>`;
    e = e.firstElementChild;
    e.querySelector("#debit-summary").title = debitSummary;
    e.querySelector("#flex-summary").title = flexSummary;
    e.querySelector("#meal-summary").title = mealSummary;
    return e;
}

function finances(runAgain = true) {
    console.debug("[CCI] Running finances function");
    if (document.querySelector(".meal-plan-info-added")) return;
    debitTransactions = [];
    mealSwipeTransactions = [];
    flexTransactions = [];
    mealPlanType = "Meal Plan";
    fetch("https://services.housing.berkeley.edu/c1c/dyn/login.asp?view=CD").then(response => {
        fetch("https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=Full").then(response => response.text()).then(text => {
            let tempdiv = document.createElement("div");
            tempdiv.appendChild(document.createElement("div"));
            tempdiv.firstElementChild.innerHTML = text;
            fetch("https://services.housing.berkeley.edu/c1c/dyn/balance.asp").then(response => response.text()).then(balText => {
                try {
                    tempdiv.appendChild(document.createElement("div"));
                    tempdiv.lastElementChild.innerHTML = balText;

                    let table = tempdiv.firstElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody");
                    let flexBalance = tempdiv.lastElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(7) > td:nth-child(1) > b").textContent;
                    let debitBalance = tempdiv.lastElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(5) > td:nth-child(1) > b").textContent;

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
                                debitTransactions.push({
                                    date: new Date(Date.parse(row.children[0].textContent)),
                                    amount: (() => {
                                        let result = row.children[1].textContent.match(/(\(?)\$(\d+\.\d\d)/);
                                        return (result[2] * (result[1] ? 1 : -1)).toFixed(2);
                                    })(),
                                    balance: row.children[2].textContent.match(/(\(?)\$(\d+\.\d\d)/)[2],
                                    location: row.children[3].textContent
                                });
                                break;
                            case 2:
                                if (row.textContent.match("Flex")) {
                                    section = 3;
                                    break;
                                }
                                if (row.firstElementChild.tagName == "TH") break;
                                mealSwipeTransactions.push({
                                    date: new Date(Date.parse(row.children[0].textContent)),
                                    swipes: +row.children[1].textContent,
                                    location: row.children[3].textContent
                                });
                                break;
                            case 3:
                                if (row.firstElementChild.tagName == "TH") break;
                                flexTransactions.push({
                                    date: new Date(Date.parse(row.children[0].textContent)),
                                    amount: (() => {
                                        let result = row.children[1].textContent.match(/(\(?)\$(\d+\.\d\d)/);
                                        return (result[2] * (result[1] ? 1 : -1)).toFixed(2);
                                    })(),
                                    balance: row.children[2].textContent.match(/(\(?)\$(\d+\.\d\d)/)[2],
                                    location: row.children[3].textContent
                                });
                                break;
                        }
                    }

                    // log(debitTransactions);
                    // log(mealSwipeTransactions);
                    // log(flexTransactions);

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

                    let widget = createCal1CardWidget({
                        debitBalance: `${debitBalance}${debitBalance.split('.').length > 1 && debitBalance.split('.')[1].length == 1 ? "0" : ""}`,
                        flexBalance: `${flexBalance}${flexBalance.split('.').length > 1 && flexBalance.split('.')[1].length == 1 ? "0" : ""}`,
                        mealBalance: mealPlanType.toLocaleLowerCase().includes("blue") ? (12 - swipesThisWeek.length) : "Unlimited",
                        mealPlanName: mealPlanType,
                        mealSummary: swipesThisWeek.reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)} - ${getMeal(b.date)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}: ${swipesThisWeek.length} swipes\n`),
                        usedSwipes: swipesThisWeek.length,
                        debitSummary: debitTransactions.filter(x => x.date > sunday).reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)}: ${Number.parseFloat(b.amount) > 0 ? '+' : '-'}$${Math.abs(b.amount).toFixed(2)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}:\n`),
                        usedDebit: `${debitThisWeek > 0 ? '+' : '-'}$${Math.abs(debitThisWeek).toFixed(2)}`,
                        flexSummary: flexTransactions.filter(x => x.date > sunday).reverse().reduce((a, b) => a + `${getPrettyDateTimeString(b.date)}: ${Number.parseFloat(b.amount) > 0 ? '+' : '-'}$${Math.abs(b.amount).toFixed(2)} @ ${b.location}\n`, `Week of ${sunday.getMonth() + 1}/${sunday.getDate()} to ${nextSaturday.getMonth() + 1}/${nextSaturday.getDate()}:\n`),
                        usedFlex: `${flexThisWeek > 0 ? '+' : '-'}$${Math.abs(flexThisWeek).toFixed(2)}`
                    });

                    let col = document.querySelector("#cc-main-content > div.cc-clearfix-container.ng-scope > div > div > div.medium-6.large-4.columns.ng-scope");
                    col.appendChild(createElement("div", ["ng-scope"], {}, [widget]));
                }
                catch (ex) {
                    if (runAgain) {
                        console.warn("[CCI] Caught error, retrying. Error below:");
                        console.warn(ex);
                        setTimeout(() => {
                            finances(false);
                        }, 2000);
                    } else {
                        log("Second failure, aborting");
                        console.error(ex);
                        let col = document.querySelector("#cc-main-content > div.cc-clearfix-container.ng-scope > div > div > div.medium-6.large-4.columns.ng-scope");
                        col.appendChild(createElement("div", ["ng-scope"], {}, [createCal1CardWidget()]));
                        col.querySelector(".cc-cal1card [data-cc-spinner-directive]").outerHTML = "";
                        let button = col.querySelector(".cc-cal1card .cc-button");
                        button.textContent = "Show Card Information";
                        button.href = "https://services.housing.berkeley.edu/c1c/dyn/login.asp";
                        button.title = "You must authenticate with CalDining and reload to see Cal 1 Card info on CalCentral";
                    }
                }
            })
        })
    });

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
}