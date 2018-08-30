log("Document Idle")
setTimeout(() => {
    document.querySelector('a[href="/finances"]').addEventListener("click", finances);

    if(location.href.endsWith("/finances")) {
        finances();
    }
}, 500);
