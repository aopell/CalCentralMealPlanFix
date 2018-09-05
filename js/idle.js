let interval = setInterval(() => {
    let link = document.querySelector('a[href="/finances"]');
    if (link) {
        link.addEventListener("click", finances);

        if (location.href.endsWith("/finances")) {
            finances();
        }
        clearInterval(interval);
    }
}, 500);
