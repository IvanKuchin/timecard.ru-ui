var	agency_psow_number_unique = function()
{
	'use strict';

	var	data_global;
	var	submit_callback_global;

	var	Init = function()
	{
	};

	var	SetGlobalData = function(data_init)
	{
		data_global = data_init;
	};

	var	GetDOM = function()
	{
		var		result = $();

		var		item				= $("<select>")	.addClass("form-control");
		var		option1				= $("<option>")	.append("Уникальные")
													.attr("value", "true");
		var		option2				= $("<option>")	.append("Могут повторяться")
													.attr("value", "false");

		item				.attr("data-id", data_global.companies[0].id)
							.attr("data-script", "agency.cgi")
							.attr("data-action", "AJAX_updatePSoWNumberUnique")
							.attr("data-db_value", data_global.companies[0].psow_number_unique)
							.on("change", system_calls.UpdateInputFieldOnServer);

		if(data_global.companies[0].psow_number_unique == "false") option2.prop("selected", "true")

		item
			.append(option1)
			.append(option2);

		result = result.add(item);

		return	result;
	};

	return {
		Init: Init,
		SetGlobalData: SetGlobalData,
		GetDOM: GetDOM,
	};
};
