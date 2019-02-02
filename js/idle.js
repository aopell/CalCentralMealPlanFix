let interval = setInterval(async () => {
    let link = document.querySelector('a[href="/finances"]');
    if (link) {
        clearInterval(interval);
        link.addEventListener("click", async () => await finances());

        if (location.href.endsWith("/finances")) {
            await finances();
        }
    }
}, 1000);
