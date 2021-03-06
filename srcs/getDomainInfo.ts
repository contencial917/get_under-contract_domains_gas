function getDomainInfo() {
	const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
	const TARGET_SHEET = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('バリュー');
	const API_KEY: string = PropertiesService.getScriptProperties().getProperty('API_KEY');
	let domainList: Array<Array<string>> = [];
	try {
			domainList = getMethodApi(TARGET_SHEET, API_KEY);
			writeDomainList(domainList, TARGET_SHEET);
			console.log(`Complete: total_list_number: ${domainList.length}`);
	} catch (e) {
		console.log(e.message);
	}
}

function getDomainInfoDebris() {
	const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
	const TARGET_SHEET = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('バリュー（デブリ）');
	const API_KEY: string = PropertiesService.getScriptProperties().getProperty('API_KEY_DEBRIS');
	let domainList: Array<Array<string>> = [];
	try {
			domainList = getMethodApi(TARGET_SHEET, API_KEY);
			writeDomainList(domainList, TARGET_SHEET);
			console.log(`Complete: total_list_number: ${domainList.length}`);
	} catch (e) {
		console.log(e.message);
	}
}

function getMethodApi(TARGET_SHEET, API_KEY) {
	const VALUE_DOMAIN_URL: string = 'https://api.value-domain.com/v1/domains';
	let options = {
		headers: {
			'Authorization': 'Bearer ' + API_KEY
		},
		method: 'get',
		contentType: 'application/json',
		muteHttpExceptions: true
	};
	let list_number = getListNumber(VALUE_DOMAIN_URL, API_KEY, options);
	try {
		let response = UrlFetchApp.fetch(`${VALUE_DOMAIN_URL}?limit=${list_number}`, options);
		console.log(response.getResponseCode());
		let result = JSON.parse(response.getContentText());
		let domainList: Array<Array<string>> = result['results']
			.filter(function(data) {
				let now = new Date();
				let today = new Date(`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`);
				let expiration_date = new Date(data["expirationdate"];
				return today <= expiration_date;
			})
			.map(function(data, index) {
				autorenew_target = '-';
				if (data['autorenew'] == 1) {
					autorenew_target = `=IF(COUNTIF(\'ドメイン自動更新管理\'!B:B, "${data['domainname']}"), "対象", "対象外")`;
				}
				return [index + 1,
						data['domainname'],
						TARGET_SHEET.getSheetName(),
						data['expirationdate'].replace(/-/g, '/'),
						data['autorenew'],
						autorenew_target]
			});
		return domainList;
	} catch (e) {
		console.log(e.message);
	}
}

function getListNumber(VALUE_DOMAIN_URL: string, API_KEY: string, options: Array<string>) {
	let response = UrlFetchApp.fetch(VALUE_DOMAIN_URL, options);
	let result = JSON.parse(response.getContentText());
	let list_number = result['paging']['max'];
	console.log(list_number);
	return list_number;
}

function writeDomainList(domainList: Array<Array<string>>,  TARGET_SHEET) {
	TARGET_SHEET.clear();
	if (TARGET_SHEET.getFilter())
		TARGET_SHEET.getFilter().remove();
	TARGET_SHEET.getRange('A1').setValue('No');
	TARGET_SHEET.getRange('B1').setValue('ドメイン名');
	TARGET_SHEET.getRange('C1').setValue('取得先');
	TARGET_SHEET.getRange('D1').setValue('有効期限');
	TARGET_SHEET.getRange('E1').setValue('自動更新\nフラグ');
	TARGET_SHEET.getRange('F1').setValue('自動更新\n管理対象');
	TARGET_SHEET.getRange('G1').setValue('Size');
	TARGET_SHEET.getRange('H1').setValue(domainList.length);
	TARGET_SHEET.getRange('I1').setValue(Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd'))
		.setBackground('#efefef');
	TARGET_SHEET.getRange('J1').setValue('=HYPERLINK("https://www.value-domain.com/login.php", "バリューへGo!!!")')
		.setFontWeight('bold');
	TARGET_SHEET.getRange('A1:G1').setBackground('#c9daf8');
	TARGET_SHEET.getRange('A1:H1').setFontWeight('bold');
	TARGET_SHEET.getRange('A1:J1')
		.setHorizontalAlignment('center')
		.setVerticalAlignment('middle')
		.setFontFamily('Meiryo');
	TARGET_SHEET.getRange('G1:H1')
		.setBorder(true, true, true, true, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
	TARGET_SHEET.getRange(2, 1, domainList.length, 6).setValues(domainList).setFontFamily('Meiryo');
	TARGET_SHEET.getRange(2, 1, domainList.length, 1).setHorizontalAlignment('center');
	TARGET_SHEET.getRange(1, 1, TARGET_SHEET.getLastRow(), 6).createFilter();
	TARGET_SHEET.setFrozenRows(1);
	TARGET_SHEET.setRowHeight(1, 40);
	for (let col = 1; col <= 10; col++) {
		if (col == 1)
			TARGET_SHEET.setColumnWidth(col, 50);
		else if (col == 2)
			TARGET_SHEET.setColumnWidth(col, 200);
		else if (col == 7 || col == 8)
			TARGET_SHEET.setColumnWidth(col, 70);
		else if (col == 10)
			TARGET_SHEET.setColumnWidth(col, 150);
		else
			TARGET_SHEET.setColumnWidth(col, 100);
	}
}
