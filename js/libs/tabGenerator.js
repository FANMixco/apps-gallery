/*This code is property of Federico Navarrete and for any commercial use he must be contacted. Also, this part of code cannot be removed.*/
const tabs = `<ul class="nav nav-tabs" role="tablist">{0}</ul>`;
const tabElem = `<li class="nav-item"><a class="nav-link{0}" href="#{1}" role="tab" data-bs-toggle="tab">{2}</a></li>`;

const panes = `<div class="tab-content">{0}</div>`;

const panElem = `<div role="tabpanel" class="tab-pane{0}" id="{1}">{2}</div>`;

const headerElem = `<div class="row row-container full-width"><h4 class="text-center full-width mt-3">{0}</h4></div>`;

const storeElem = `<div id="{0}" class="row row-container justify-content-center"></div>`;

const techsInvolved = `<div id="{0}" class="store row row-container justify-content-center"><h5 class="text-center full-width">{1}</h5></div>`;

const tabContent = `<div class="tab-content">{0}</div>`;

const techsInvolvedStr = 'Technologies involved:';

function createTabs() {
	let print = '';
	for (let tab in tabsOptions.sort(sortByProperty('order')))
		if (tabsOptions[tab].isVisible) {
			let isActive = tabsOptions[tab].isActive ? " active" : "";
			print += tabElem.format(isActive, tabsOptions[tab].id, tabsOptions[tab].name);			
		}
	return `<ul class="nav nav-tabs" role="tablist">${print}</ul>`;
}

function createPanes() {
	let print = '';
	for (let pane in panesOptions.sort(sortByProperty('order'))) {
		let isActive = panesOptions[pane].isActive ? " in active" : "";
		print += panElem.format(isActive, panesOptions[pane].id, '{0}');
		
		let printElem = '';
		let totalDiv = 0;
		for (let div in panesOptions[pane].divs) {
			let divData = panesOptions[pane].divs[div];
	
			if (totalDiv > 0)
				printElem = `${printElem}<hr>`;
			if (divData.divsTitle != '')
				printElem = printElem + headerElem.format(divData.divsTitle);
			
			for (let store in divData.stores) {
				printElem+=headerElem.format(divData.stores[store].subTitle);
				printElem+=storeElem.format(divData.stores[store].id);
			}
			totalDiv++;
		}
		
		let mainTitle = panesOptions[pane].mainTitle != '' ? headerElem.format(panesOptions[pane].mainTitle) : '';
		
		let techsInvolvedFinal = panesOptions[pane].techsInvolvedId != '' ? techsInvolved.format(panesOptions[pane].techsInvolvedId, techsInvolvedStr) : '';
		
		print = print.format(mainTitle + printElem + techsInvolvedFinal);
	}
	return tabContent.format(print);
}