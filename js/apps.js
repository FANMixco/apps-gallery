/*This code is Federico Navarrete's property and for any commercial use he must be contacted. Also, this part of code cannot be removed.*/

let apps, panesOptions, tabsOptions;

window.addEventListener('DOMContentLoaded', () => {
    fetchData('js/i18n/en-us/apps.min.json')
        .then(data => {
            apps = data.apps;
            panesOptions = data.panesOptions;
            tabsOptions = data.tabsOptions;
            load();
        }).catch((e) => { console.error(e); });
});

function load() {
    const cardTemplate = `<div class="card border-0 transform-on-hover" style="padding-right: 0px; padding-left: 0px;"><img src="img/apps/{0}.png" alt="{1}" loading="lazy" class="card-img-top"><div class="card-body"><h6><a href="#" class="text-decoration-none">{2}</a></h6><p class="card-text">{3}<a tabindex="0" data-bs-trigger="focus" data-bs-html="true" data-bs-placement="top" data-bs-toggle="popover" data-bs-container="body" title="{4}" data-bs-content="{5}" role="button" class="popMore btn btn-warning btn-circle text-white"><i class="fas fa-ellipsis-h"></i></a></p></div></div>`;

    const galleryTitle = "Federico Navarrete — Projects Gallery";
    const https = 'https://';

    const galleryFooter = `Some icons were created by <a href="${https}www.flaticon.com/authors/freepik" title="Freepik" target="_blank" rel="noreferrer">Freepik</a> - <a href="${https}www.flaticon.com/" title="Flaticon" target="_blank" rel="noreferrer">www.flaticon.com</a>. &copy; <a class="text-warning" href="${https}federiconavarrete.com" target="_blank">Federico Navarrete</a> &amp; <a class="text-warning" href="${https}supernovaic.com" target="_blank">Supernova IC</a> {0}.`;

    const iconSpan = "<span class='oneLineIcon' style='width: auto;' {0}>{1}</span>";

    document.getElementById('galleryApps').innerHTML += createTabs() + createPanes();

    document.getElementById('galleryTitle').innerHTML += galleryTitle;

    let cYear = new Date().getFullYear();

    cYear === 2019 ? `${cYear}` : `2019 - ${cYear}`;

    document.getElementById('galleryFooter').innerHTML += galleryFooter.format(cYear);

    let androidSupported = [];
    let androidHuaweiSupported = [];
    let androidSamsungSupported = [];
    let androidAmazonSupported = [];
    let androidSupportedTechs = [];
    let w11Supported = [];
    let w11SupportedTechs = [];
    let webSupported = [];
    let webSupportedTechs = [];
    let nugetSupported = [];
    let libsSupportedTechs = [];
    let jsLibSupported = [];
    let outLibSupported = [];

    let androidUnsupported = [];
    let w10UnsupportedMobile = [];
    let w10Unsupported = [];
    let wXPUnsupported = [];
    let wpUnsupported = [];
    let w8Unsupported = [];
    let webUnsupported = [];
    let nugetUnsupported = [];
    let xamarinFormsUnsupported = [];
    let unsupportedTechs = [];
    let jsLibUnsupported = [];
    let uwpLibUnsupported = [];

    let customIconsArray = [];

    if (!new URLSearchParams(window.location.search).get('isIframe')) {
        const h = document.getElementById('header');
        h.style.display = "block";
        h.classList.add("pt-4");

        [...document.getElementsByClassName('.gallery-block')].forEach((element) => {
            element.style.paddingTop = '60px';
        });
    }

    for (let item in apps) {
        filterElem(apps[item], 'android', true, androidSupported);

        filterElem(apps[item], 'android_huawei', true, androidHuaweiSupported);

        filterElem(apps[item], 'android_samsung', true, androidSamsungSupported);

        filterElem(apps[item], 'android_amazon', true, androidAmazonSupported);

        filterElem(apps[item], 'windows11', true, w11Supported);

        filterElem(apps[item], 'android', false, androidUnsupported);

        filterElem(apps[item], 'windows10', false, w10Unsupported);

        filterElem(apps[item], 'windows10Mobile', false, w10UnsupportedMobile);

        filterElem(apps[item], 'windowsPhone', false, wpUnsupported);

        filterElem(apps[item], 'windows8', false, w8Unsupported);

        filterElem(apps[item], 'web', true, webSupported);

        filterElem(apps[item], 'web', false, webUnsupported);

        filterElem(apps[item], 'windowsXP', false, wXPUnsupported);

        filterElem(apps[item], 'nuget', true, nugetSupported);

        filterElem(apps[item], 'js_lib', true, jsLibSupported);

        filterElem(apps[item], 'out_lib', true, outLibSupported);

        filterElem(apps[item], 'nuget', false, nugetUnsupported);

        filterElem(apps[item], 'xamarin_forms', false, xamarinFormsUnsupported);

        filterElem(apps[item], 'uwp_lib', false, uwpLibUnsupported);

        filterElem(apps[item], 'js_lib', false, jsLibUnsupported);
    }

    setApps(androidSupported.sort(sortByProperty('order')), "playStore", androidSupportedTechs, customIconsArray);
    setApps(androidHuaweiSupported.sort(sortByProperty('order')), "huaweiStore", androidSupportedTechs, customIconsArray);
    setApps(androidSamsungSupported.sort(sortByProperty('order')), "samsungStore", androidSupportedTechs, customIconsArray);
    setApps(androidAmazonSupported.sort(sortByProperty('order')), "amazonStore", androidSupportedTechs, customIconsArray);
    setApps(w11Supported.sort(sortByProperty('order')), "msStore", w11SupportedTechs, customIconsArray);
    setApps(webSupported.sort(sortByProperty('order')), "webStore", webSupportedTechs, customIconsArray);
    setApps(nugetSupported.sort(sortByProperty('order')), "nugetsStore", libsSupportedTechs, customIconsArray);
    setApps(jsLibSupported.sort(sortByProperty('order')), "jsLibStore", libsSupportedTechs, customIconsArray);
    setApps(outLibSupported.sort(sortByProperty('order')), "outLibStore", libsSupportedTechs, customIconsArray);

    setApps(xamarinFormsUnsupported.sort(sortByProperty('order')), "unsupportedXamarinForms", unsupportedTechs, customIconsArray);
    setApps(androidUnsupported.sort(sortByProperty('order')), "unsupportedAndroid", unsupportedTechs, customIconsArray);
    setApps(w8Unsupported.sort(sortByProperty('order')), "unsupportedWindows8", unsupportedTechs, customIconsArray);
    setApps(w10Unsupported.sort(sortByProperty('order')), "unsupportedWindows10", unsupportedTechs, customIconsArray);
    setApps(w10UnsupportedMobile.sort(sortByProperty('order')), "unsupportedWindows10Mobile", unsupportedTechs, customIconsArray);
    setApps(wpUnsupported.sort(sortByProperty('order')), "unsupportedWindowsPhone", unsupportedTechs, customIconsArray);
    setApps(webUnsupported.sort(sortByProperty('order')), "unsupportedWeb", unsupportedTechs, customIconsArray);
    setApps(wXPUnsupported.sort(sortByProperty('order')), "unsupportedVB", unsupportedTechs, customIconsArray);
    setApps(nugetUnsupported.sort(sortByProperty('order')), "unsupportedNuget", unsupportedTechs, customIconsArray);

    setApps(jsLibUnsupported.sort(sortByProperty('order')), "unSuppportedJsLibStore", libsSupportedTechs, customIconsArray);
    setApps(uwpLibUnsupported.sort(sortByProperty('order')), "unsupportedUwpLibStore", unsupportedTechs, customIconsArray);

    setTechUsed(androidSupportedTechs, "techsPlayStore", customIconsArray);
    setTechUsed(w11SupportedTechs, "techsMSStore", customIconsArray);
    setTechUsed(webSupportedTechs, "techsWebStore", customIconsArray);
    setTechUsed(unsupportedTechs, "techsOldStore", customIconsArray);
    setTechUsed(libsSupportedTechs, "techsLibsStore", customIconsArray);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });

    function setTechUsed(techs, container, customIcons) {
        const result = {}

        for (let i = 0; i < techs.length; i++) result[techs[i]] = (result[techs[i]] || 0) + 1;

        let sortable = [];

        for (let item in result) sortable.push([item, result[item]]);

        sortable.sort(function (a, b) {
            return b[1] - a[1];
        });

        let conclusions = "";

        for (let item in sortable) conclusions += (!sortable[item][0].includes("id_")) ? getTechPrint(sortable[item][0], `×${sortable[item][1]}`, 3) : getTechPrint(customIcons.filter(x => x.id == sortable[item][0]), `×${sortable[item][1]}`, 3);

        document.getElementById(`${container}`).innerHTML += conclusions;
    }

    function getTechPrint(tech, extra, noSpaces) {
        let totalSpaces = "";
        for (let i = 0; i <= noSpaces; i++)
            totalSpaces += "&nbsp;";

        if (!Array.isArray(tech))
            return `${iconSpan.format("", `<i class="${tech}"></i>${extra}`)}${totalSpaces}`;
        else {
            let tooltip = '';
            if (tech[0].tooltip)
                tooltip = `data-bs-toggle="tooltip" title="${tech[0].tooltip}"`;

            switch (tech[0].type) {
                case "text":
                    return `${iconSpan.format(tooltip, `<span class='storeIcon'>${tech[0].text}</span>${extra}`)}${totalSpaces}`;
                case "mix-left-icon":
                    return `${iconSpan.format(tooltip, `<i class="${tech[0].icon}"></i><span class='storeIcon'>${tech[0].text}</span>${extra}`)}${totalSpaces}`;
                case "mix-right-icon":
                    return `${iconSpan.format(tooltip, `<span class='storeIcon'>${tech[0].text}</span><i class="${tech[0].icon}"></i>${extra}`)}${totalSpaces}`;
                case "mix-left-img":
                    return `${iconSpan.format(tooltip, `<img class='icons' src='img/icons/${tech[0].icon}' alt='icon' /><span class='storeIcon'>${tech[0].text}</span>${extra}`)}${totalSpaces}`;
                case "mix-right-img":
                    return `${iconSpan.format(tooltip, `<span class='storeIcon'>${tech[0].text}</span><img class='icons' src='img/icons/${tech[0].icon}' alt='icon' />${extra}`)}${totalSpaces}`;
                case "img":
                    return `${iconSpan.format(tooltip, `<img class='icons' src='img/icons/${tech[0].icon}' alt='icon' />${extra}`)}${totalSpaces}`;
                case "icon":
                    return `${iconSpan.format(tooltip, `<i class="${tech[0].icon}"></i>${extra}`)}${totalSpaces}`;
            }
        }
    }

    function setApps(appCollection, control, techs, customIcons) {
        for (let item in appCollection) {
            let content = '';
            if (appCollection[item].storeLink !== '')
                content += `<a href="${https}${appCollection[item].storeLink}" class="btn btn-info btn-circle text-white" target="_blank"><i class="fas fa-download"></i></a>`;
            if (appCollection[item].link !== '' && appCollection[item].isSupported)
                content += `<a href="${https}${appCollection[item].link}" class="btn btn-success btn-circle text-white" target="_blank"><i class="fas fa-globe"></i></a>`;
            else if (appCollection[item].secondaryLink !== undefined && !appCollection[item].isSupported)
                if (appCollection[item].secondaryLink !== '')
                    content += `<a href="${https}${appCollection[item].secondaryLink}" class="btn btn-secondary btn-circle text-white" target="_blank"><i class="fas fa-globe"></i></a>`;
            if (appCollection[item].preview !== '')
                content += `<a href="${https}${appCollection[item].preview}" class="btn btn-danger btn-circle text-white" target="_blank"><i class="fas fa-images"></i></a>`;

            let years = appCollection[item].yearStart;

            if (appCollection[item].yearStart !== appCollection[item].yearEnd) {
                years += appCollection[item].yearEnd !== null ? ` - ${appCollection[item].yearEnd}` : " - now";
            }

            let tooltip = `${years}<br><br>${appCollection[item].description}`;

            let technologies = '';
            for (let technology in appCollection[item].technologies) {
                if (!Array.isArray(appCollection[item].technologies[technology])) {
                    technologies += getTechPrint(appCollection[item].technologies[technology], '', 1);
                    addTech(techs, appCollection[item].technologies[technology]);
                }
                else {
                    technologies += getTechPrint(appCollection[item].technologies[technology], '', 1);
                    addTech(techs, appCollection[item].technologies[technology][0].id);

                    if (customIcons !== undefined)
                        if (_.findWhere(customIcons, appCollection[item].technologies[technology][0]) == null)
                            customIcons.push(appCollection[item].technologies[technology][0]);
                }
            }

            tooltip += `<br><br><b>Technologies:<b><br><br><div class='iconsDiv'>${technologies.replaceAll('"', "'")}</div>`;

            document.getElementById(`${control}`).innerHTML += cardTemplate.format(appCollection[item].logo, appCollection[item].app, appCollection[item].app, content, appCollection[item].app, tooltip);
        }
    }

    function addTech(techs, tech) {
        if (techs !== undefined)
            techs.push((!Array.isArray(techs)) ? tech.replaceAll(" ", "_").replaceAll("-", "__") : tech);
    }

    function filterElem(item, tech, isSupported, array) {
        let filteredElem = item.edition.filter(x => x.mainTech == tech && x.isSupported === isSupported)[0];

        if (filteredElem !== undefined) array.push(createElem(item, filteredElem));
    }

    function createElem(item, edition) {
        return {
            app: item.app,
            link: item.link,
            description: item.description,
            logo: item.logo,
            preview: edition.preview,
            storeLink: edition.storeLink,
            technologies: edition.technologies,
            yearStart: edition.yearStart,
            yearEnd: edition.yearEnd,
            technologies: edition.technologies,
            isSupported: edition.isSupported,
            secondaryLink: edition.link,
            order: edition.order
        };
    }
}

function gAnalytics() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());

    gtag('config', 'G-WQKJ9Y00XJ');
}

function googleTranslateElementInit() {
    new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'es,nl,de,fr,it,en,pt', autoDisplay: false, layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
}

gAnalytics();
googleTranslateElementInit();