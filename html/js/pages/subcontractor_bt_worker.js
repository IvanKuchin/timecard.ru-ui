// importScripts("/js/pages/common.js");

onmessage = function(e)
{
	'use strict';

	var	allowances = [];

	var	httpRequest;
	var	objGeoRegion = {};

	function ParseBulkData()
	{
		if(httpRequest.readyState === XMLHttpRequest.DONE) {
		  if(httpRequest.status === 200) {
		  	var		data = JSON.parse(httpRequest.responseText);
		  	var		obj2Send = {};

			obj2Send.allowances = data.allowances;

			postMessage(obj2Send);

		    close();
		  } else {
		    console.debug('ParseBulkData: ERROR: XMLHttpRequest returned not 200');
		  }
		}

	}

	httpRequest = new XMLHttpRequest();
	if(httpRequest)
	{
		let	sow_id = e.data;
		httpRequest.onreadystatechange = ParseBulkData;
		httpRequest.open('GET', "/cgi-bin/subcontractor.cgi?action=AJAX_getBTWorkerData&sow_id=" + sow_id + "&rand=" + Math.random() * 1234567890);
		httpRequest.send();
	}
	else
	{
		console.error("ERROR: creating XMLHttpRequest");
	}
};


