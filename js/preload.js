log = (message) => console.log("[CCI] " + message);

log("Running preload.js");

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

function finances() {
    log("Running finances function");
    if(document.querySelector(".meal-plan-info-added")) return;
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
                tempdiv.appendChild(document.createElement("div"));
                tempdiv.lastElementChild.innerHTML = balText;
                console.log(tempdiv);
                let table = tempdiv.firstElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody");
                let flexBalance = tempdiv.lastElementChild.querySelector("#content_window > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(7) > td:nth-child(1) > b").textContent;

                let section = 0;

                console.dir(table);
                for (let row of table.children) {
                    log(`Running on: ${row.textContent}`);
                    switch (section) {
                        case 0:
                            if (row.textContent.match("Debit")) {
                                log("Switching to Section 1");
                                section = 1;
                            }
                            break;
                        case 1:
                            if (row.textContent.match("Meal")) {
                                section = 2;
                                log("Switching to Section 2");
                                mealPlanType = row.textContent.replace(" Activity", "");
                                break;
                            }
                            if (row.firstElementChild.tagName == "TH") break;
                            debitTransactions.push({
                                date: new Date(Date.parse(row.children[0].textContent)),
                                amount: (() => {
                                    let result = row.children[1].textContent.match(/(\(?)\$(\d+\.\d\d)/);
                                    return result[2] * (result[1] ? 1 : -1);
                                })(),
                                balance: row.children[2].textContent.match(/(\(?)\$(\d+\.\d\d)/)[2],
                                location: row.children[3].textContent
                            });
                            break;
                        case 2:
                            if (row.textContent.match("Flex")) {
                                section = 3;
                                log("Switching to Section 3");
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
                                    return result[2] * (result[1] ? 1 : -1);
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
                let nextSunday = new Date(sunday.valueOf());
                nextSunday.setDate(nextSunday.getDate() + 7);

                let swipesThisWeek = mealSwipeTransactions.filter(x => x.date > sunday);

                function createContainer(title, subtitle, value, linkText, linkDestination, linkHover) {
                    return createElement("li", ["cc-clearfix-container"], {}, [
                        createElement("div", ["cc-cal1card-header"], {}, [
                            createElement("strong", [], { textContent: title })
                        ]),
                        createElement("div", ["cc-cal1card-yourbalance"], { textContent: subtitle }),
                        createElement("span", ["cc-left", "cc-cal1card-amount", "ng-binding"], { textContent: value }),
                        createElement(linkDestination ? "a" : "span", ["cc-right", "cc-outbound-link"], { href: linkDestination, textContent: linkText, target: "_blank", title: linkHover })
                    ]);
                }

                // log(swipesThisWeek);
                let cal1List = document.querySelector("#cc-main-content > div.cc-clearfix-container.ng-scope > div > div > div.medium-6.large-4.columns.ng-scope > div:nth-child(2) > div > div:nth-child(2) > ul");
                cal1List.removeChild(cal1List.lastElementChild);
                cal1List.appendChild(
                    createContainer(
                        mealPlanType,
                        `Available meal swipes for week of ${sunday.getMonth() + 1}/${sunday.getDate()}:`,
                        mealPlanType.toLocaleLowerCase().includes("blue") ? (12 - swipesThisWeek.length) : "Unlimited",
                        `${swipesThisWeek.length} swipes used this week`,
                        "https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=rb",
                        swipesThisWeek.reverse().reduce((a, b) => a + `${b.date.getMonth() + 1}/${b.date.getDate()} ${b.date.getHours() == 12 ? 12 : b.date.getHours() % 12}:${b.date.getMinutes()} ${b.date.getHours() / 12 >= 1 ? "PM" : "AM"} - ${b.location}\n`, "")
                    )
                );
                cal1List.appendChild(
                    createContainer(
                        "Meal Plan Flex Dollars",
                        "Your current balance:",
                        `$${flexBalance}`,
                        "View Transactions",
                        "https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=50",
                        "View flex dollar transaction history"
                    )
                );
                cal1List.parentElement.parentElement.appendChild(createElement("span", ["meal-plan-info-added"], { style: "visibility: 'hidden'" }));
            })
        })
    });
}