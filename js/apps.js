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

    let androidSupportedTechs = [];
    let w11SupportedTechs = [];
    let webSupportedTechs = [];
    let libsSupportedTechs = [];

    let unsupportedTechs = [];

    let customIconsArray = [];
    const appGroups = [
        { techs: ['android'], isSupported: true, control: 'playStore', techsUsed: androidSupportedTechs, apps: [] },
        { techs: ['android_huawei'], isSupported: true, control: 'huaweiStore', techsUsed: androidSupportedTechs, apps: [] },
        { techs: ['android_samsung'], isSupported: true, control: 'samsungStore', techsUsed: androidSupportedTechs, apps: [] },
        { techs: ['android_amazon'], isSupported: true, control: 'amazonStore', techsUsed: androidSupportedTechs, apps: [] },
        { techs: ['windows11'], isSupported: true, control: 'msStore', techsUsed: w11SupportedTechs, apps: [] },
        { techs: ['web'], isSupported: true, control: 'webStore', techsUsed: webSupportedTechs, apps: [] },
        { techs: ['nuget'], isSupported: true, control: 'nugetsStore', techsUsed: libsSupportedTechs, apps: [] },
        { techs: ['js_lib'], isSupported: true, control: 'jsLibStore', techsUsed: libsSupportedTechs, apps: [] },
        { techs: ['out_lib'], isSupported: true, control: 'outLibStore', techsUsed: libsSupportedTechs, apps: [] },
        { techs: ['android'], isSupported: false, control: 'unsupportedAndroid', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['android_amazon'], isSupported: false, control: 'unsupportedAndroidAmazon', techsUsed: unsupportedTechs, title: "<i class='mdi mdi-amazon'></i> Amazon Appstore", beforeControl: 'unsupportedWindows10Mobile', apps: [] },
        { techs: ['android_huawei'], isSupported: false, control: 'unsupportedAndroidHuawei', techsUsed: unsupportedTechs, title: "<i class='mdi mdi-shopping'></i> Huawei AppGallery", beforeControl: 'unsupportedWindows10Mobile', apps: [] },
        { techs: ['android_samsung'], isSupported: false, control: 'unsupportedAndroidSamsung', techsUsed: unsupportedTechs, title: "<i class='mdi mdi-shopping'></i> Samsung Galaxy Store", beforeControl: 'unsupportedWindows10Mobile', apps: [] },
        { techs: ['windows8'], isSupported: false, control: 'unsupportedWindows8', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['windows10'], isSupported: false, control: 'unsupportedWindows10', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['windows10Mobile'], isSupported: false, control: 'unsupportedWindows10Mobile', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['windowsPhone'], isSupported: false, control: 'unsupportedWindowsPhone', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['web'], isSupported: false, control: 'unsupportedWeb', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['windowsXP'], isSupported: false, control: 'unsupportedVB', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['xamarin_forms'], isSupported: false, control: 'unsupportedXamarinForms', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['nuget'], isSupported: false, control: 'unsupportedNuget', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['js_lib'], isSupported: false, control: 'unSuppportedJsLibStore', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['uwp_lib'], isSupported: false, control: 'unsupportedUwpLibStore', techsUsed: unsupportedTechs, apps: [] },
        { techs: ['out_lib'], isSupported: false, control: 'unsupportedOutLibStore', techsUsed: unsupportedTechs, title: "<img class='icons' src='img/icons/out.svg' /> OutSystems", apps: [] }
    ];

    if (!new URLSearchParams(window.location.search).get('isIframe')) {
        const h = document.getElementById('header');
        h.style.display = "block";
        h.classList.add("pt-4");

        [...document.getElementsByClassName('.gallery-block')].forEach((element) => {
            element.style.paddingTop = '60px';
        });
    }

    for (let item in apps) {
        for (let group in appGroups)
            filterElem(apps[item], appGroups[group].techs, appGroups[group].isSupported, appGroups[group].apps);
    }

    for (let group in appGroups) {
        ensureControl(appGroups[group]);
        setApps(appGroups[group].apps.sort(sortByProperty('order')), appGroups[group].control, appGroups[group].techsUsed, customIconsArray);
    }
    hideEmptyControls(appGroups);

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

    function ensureControl(group) {
        if (document.getElementById(group.control) !== null || group.apps.length === 0 || group.title === undefined)
            return;

        let html = `<div class="row row-container full-width"><h4 class="text-center full-width mt-3">${group.title}</h4></div><div id="${group.control}" class="row row-container justify-content-center"></div>`;
        let targetControl = document.getElementById(group.beforeControl);
        let techsContainer = document.getElementById('techsOldStore');

        if (targetControl !== null && targetControl.previousElementSibling !== null)
            targetControl.previousElementSibling.insertAdjacentHTML('beforebegin', html);
        else if (techsContainer !== null)
            techsContainer.insertAdjacentHTML('beforebegin', html);
    }

    function hideEmptyControls(groups) {
        for (let group in groups) {
            let control = document.getElementById(groups[group].control);
            if (control === null || control.children.length > 0)
                continue;

            control.style.display = 'none';

            let heading = control.previousElementSibling;
            if (heading !== null && heading.classList.contains('row-container'))
                heading.style.display = 'none';
        }
    }

    function addTech(techs, tech) {
        if (techs !== undefined)
            techs.push((!Array.isArray(techs)) ? tech.replaceAll(" ", "_").replaceAll("-", "__") : tech);
    }

    function filterElem(item, tech, isSupported, array) {
        let techs = Array.isArray(tech) ? tech : [tech];
        let filteredElems = item.edition.filter(x => techs.includes(x.mainTech) && x.isSupported === isSupported);

        for (let filteredElem in filteredElems)
            array.push(createElem(item, filteredElems[filteredElem]));
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
