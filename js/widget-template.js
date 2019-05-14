var openOverlay = null;

function createFromTemplate(debitBalance = '', flexBalance = '', mealPlanName = '', mealBalance = '', usedSwipes = '', usedFlex = '', usedDebit = '') {
    return `
        <div class="cc-cal1card cc-widget">
        <div class="cc-cal1card-logo cc-widget-title">
            <h2 class="cc-left">Cal 1 Card</h2><a class="cc-right cc-button
                    cc-widget-title-button ng-scope" href="http://cal1card.berkeley.edu">Manage Card</a>
        </div>
        <div data-cc-spinner-directive>
            <ul class="cc-widget-list">
                <li class="cc-clearfix-container">
                    <div>
                        <div class="cc-cal1card-header"><strong>Debit Account Balance</strong></div><span
                            class="cc-left cc-cal1card-amount">$${debitBalance}</span>
                        <div id="debit-link" class="cc-right">
                            <abbr id="debit-summary">${usedDebit} this week</abbr>
                            <br />
                            <a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=c1c">View
                                Debit Transactions</a>
                        </div>
                    </div>
                <li class="cc-clearfix-container">
                    <div>
                        <div class="cc-cal1card-header"><strong>Flex Dollars
                                Balance</strong></div><span class="cc-left
                                    cc-cal1card-amount">$${flexBalance}</span>
                        <div id="flex-link" class="cc-right">
                            <abbr id="flex-summary">${usedFlex} this week</abbr>
                            <br />
                            <a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=50">View
                                Flex Dollar Transactions</a>
                        </div>
                    </div>
                <li class="cc-clearfix-container">
                    <div>
                        <div class="cc-cal1card-header"><strong>${mealPlanName}
                                Balance</strong></div><span class="cc-left
                                        cc-cal1card-amount">${mealBalance}
                            <span style="font-size:12px">swipes</span></span>
                        <div id="meal-link" class="cc-right">
                            <abbr id="meal-summary">${usedSwipes} swipes used this week</abbr>
                            <br />
                            <a href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=rb">View
                                Meal Swipe History</a>
                        </div>
                    </div>
                <li>
                    <a style=";margin-top:-5px;"
                        href="#" id="open-overlay-button">View stats
                        from the last 365 days </a>
                </li>
                <li>
                    <a style="margin-bottom:-10px;"
                        href="https://services.housing.berkeley.edu/c1c/dyn/bals.asp?pln=Full" target="_blank">View all
                        transactions in the last 365 days </a>
                </li>
            </ul>
        </div>
    </div>
    `;
}