const storage = localStorage;

if (!Math.imul) Math.imul = function (opA, opB) {
    opB |= 0;
    var result = (opA & 0x003fffff) * opB;
    if (opA & 0xffc00000) result += (opA & 0xffc00000) * opB | 0;
    return result | 0;
};

const cyrb53 = function (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
    h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const generateId = () => {
    let creationTime = new Date().getTime();
    let expiryTime = creationTime + (30 * 24 * 3600 * 1000); // Change 30 to any number of days you want the CID to be valid.
    let CIDSource = window.location.host + ";" + navigator.userAgent + ";" + navigator.language + ";" + creationTime;

    if (window.localStorage) {
        CIDhashed = localStorage.getItem('CID_HASHED');
        CIDexpiry = localStorage.getItem('CID_EXPIRY');
        if ((CIDhashed === null || CIDexpiry === null)
            || (CIDhashed !== null && CIDexpiry !== null && CIDexpiry >= expiryTime)) {
            localStorage.setItem('CID_HASHED', cyrb53(CIDSource).toString(16));
            localStorage.setItem('CID_EXPIRY', expiryTime);
        }
        return storage.CID_HASHED;
    } else {
        return undefined;
    }
};

const getId = () => {
    if (!storage.CID_HASHED) {
        storage.CID_HASHED = generateId();
    }
    return storage.CID_HASHED;
};

const getExpiry = () => {
    if (!storage.CID_EXPIRY) {
        storage.CID_HASHED = generateId();
    }
    return storage.CID_EXPIRY;
};

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            console.log(c.substring(name.length, c.length));
            return c.substring(name.length, c.length);
        }
    }
}

function setCookie(cname, cvalue, cexpiry) {
    const d = new Date();
    d.setTime(cexpiry);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/" + ";domain=.giannisakritidis.com"; // replace YOURDOMAIN your domain
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function GACookie() {
    for (let i = 0; i < 5; i++) {
        console.log(`Waiting ${i} seconds...`);
        console.log(getCookie('_ga'));
        //setCookie('_ga', getId(), getExpiry()); // comment this line if NOT using GA3
        console.log(getCookie('_ga4'));
        setCookie('_ga4', getId(), getExpiry()); // comment this line if NOT using GA4
        await sleep(i * 1000);
    }
    console.log('Done');
}

GACookie();