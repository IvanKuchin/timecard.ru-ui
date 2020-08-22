var	agency_bt_allowance_obj = function()
{
	'use strict';

	var random_global;
	var	data_global;
	var	details_area_state_global = "";
	var expand_button_state_global = "";
	var remove_button_state_global = "";
	var	reset_form_button_global = "hidden";
	var	reset_form_callback_global;
	var	submit_button_global = "hidden";

	var	submit_callback_global;

	var	Init = function()
	{
		var		temp = new Date();
		
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__bt_allowance[data-random=\"" + random_global + "\"]").length);

		system_calls.SetCurrentScript("agency.cgi");
	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init 				== "undefined") data_init = {};
		if(typeof data_init.id				== "undefined") data_init.id = "0";
		if(typeof data_init.country			== "undefined") data_init.country = "";
		if(typeof data_init.amount			== "undefined") data_init.amount		= "";

		data_global = data_init;
	};

	var	GetID		= function() { return data_global.id; };

	var	CheckNewBTAllowanceValidity = function(submit_button)
	{
		var	result = true;
		var	country					= $("input.__bt_allowance_country[data-random=\"" + random_global + "\"]");
		var	amount					= $("input.__bt_allowance_amount[data-random=\"" + random_global + "\"]");
		var	message = "";
		
		if(!country.attr("data-country_id") || country.attr("data-country_id").length === 0)
		{
			message = "Необходимо выбрать страну из выпадающего списка";
			system_calls.PopoverError(country, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}

		if(amount.val().length === 0)
		{
			message = "Необходимо указать размер надбавки";
			system_calls.PopoverError(amount, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}


		return result;
	};

	var SubmitNewBTAllowance_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	country_tag = $("input.__bt_allowance_country[data-random=\"" + random_global + "\"]");
		var	amount_tag = $("input.__bt_allowance_amount[data-random=\"" + random_global + "\"]");

		var action = curr_tag.attr("data-action");

		if(action.length)
		{
			if(CheckNewBTAllowanceValidity(curr_tag))
			{
				curr_tag.button("loading");

				$.getJSON(
					'/cgi-bin/agency.cgi',
					{
						action:		action,
						country_id:	country_tag.attr("data-country_id"),
						amount:		amount_tag.val(),
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							if(typeof(submit_callback_global) == "function")
							{
								submit_callback_global();
							}
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					})
					.always(function(data)
					{
						setTimeout(function(){ curr_tag.button("reset"); }, 500);
					});
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Исправьте данные надбавки");
			}
		}
		else
		{
			system_calls.PopoverError(curr_tag, "не указано действие");
		}
	};

	var DefaultExpand = function()
	{
		details_area_state_global = "out";
	};

	var ExpandButton = function(state)
	{
		expand_button_state_global = state;
	};

	var RemoveButton = function(state)
	{
		remove_button_state_global = state;
	};

	var SubmitButton = function(state)
	{
		submit_button_global = state;
	};

	var ResetFormButton = function(state, reset_form_callback)
	{
		reset_form_button_global = state;
		reset_form_callback_global = reset_form_callback;
	};

	var SetSubmitCallback = function(f)
	{
		submit_callback_global = f;
	};

	var	GetDOM = function()
	{
		var		result = $();

		var		row	 				= $("<div>")	.addClass("row __bt_allowance highlight_onhover zebra_painting bt_allowance_" + data_global.id);
		var		open_button			= $("<i>")		.addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover " + expand_button_state_global);
		var		input_country		= $("<input>")	.addClass("transparent __bt_allowance_country bt_allowance" + data_global.id).attr("placeholder", "Страна");
		var		input_amount		= $("<input>")	.addClass("transparent __bt_allowance_amount bt_allowance" + data_global.id).attr("placeholder", "Сумма");
		var		remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		var		open_col	 		= $("<div>")	.addClass("col-xs-2 col-md-1");
		var		country_col	 		= $("<div>")	.addClass("col-xs-4 col-md-2 __bt_allowance_collapsible_country_" + random_global);
		var		amount_col	 		= $("<div>")	.addClass("col-xs-4 col-md-2 __bt_allowance_collapsible_amount_" + random_global);
		var		remove_col			= $("<div>")	.addClass("col-xs-2 col-md-offset-6 col-md-1");
		var		reset_form_button	= $("<button>")	.addClass("btn btn-default form-control " + reset_form_button_global).append("Сбросить");
		var		submit_button		= $("<button>")	.addClass("btn btn-primary form-control " + submit_button_global).append("Сохранить");
		var		temp = [];

		// --- render collapsible part
		var		row_collapsible 	= $("<div>")	.addClass("row collapse " + details_area_state_global);
		var		row_submit 			= $("<div>")	.addClass("row __bt_allowance_submit bt_allowance" + data_global.id);
		var		reset_form_col 		= $("<div>")	.addClass("col-xs-6 col-md-offset-8 col-md-2");
		var		submit_col 			= $("<div>")	.addClass("col-xs-6 col-md-2");

		var		col_main_fields		= $("<div>")	.addClass("col-xs-12");
		var		col_custom_fields	= $("<div>")	.addClass("col-xs-12");

		row_collapsible		.attr("id", "collapsible_bt_allowance_" + data_global.id)
							.append($("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20").append("<p>"));

		row_collapsible		.append($("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20").append("<p>"));

		open_button			.attr("data-target", "collapsible_bt_allowance_" + data_global.id)
							.attr("data-toggle", "collapse");


		// --- render main info part
		input_country		.val(data_global.countries ? data_global.countries[0].title : "")
							.attr("data-db_value", data_global.countries ? data_global.countries[0].title : "")
							.attr("data-script", "agency.cgi");
		input_amount		.val(data_global.amount)
							.attr("data-db_value", data_global.amount)
							.attr("data-script", "agency.cgi");

		input_country		.autocomplete({
							source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getCountryAutocompleteList",
							select: Country_SelectHandler,
							});

		open_button 		.attr("data-id", data_global.id);
		input_country		.attr("data-id", data_global.id);
		input_amount		.attr("data-id", data_global.id);
		remove_button		.attr("data-id", data_global.id);
		reset_form_button	.attr("data-id", data_global.id);
		submit_button		.attr("data-id", data_global.id);

		row					.attr("data-random", random_global);
		open_button			.attr("data-random", random_global);
		input_country		.attr("data-random", random_global);
		input_amount		.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		reset_form_button	.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_country		.attr("data-action", "AJAX_updateBTAllowanceCountry");
		input_amount		.attr("data-action", "AJAX_updateBTAllowanceAmount");
		remove_button		.attr("data-action", "AJAX_deleteBTAllowance");
		submit_button		.attr("data-action", "AJAX_addBTAllowance");

		open_button			.on("click",  TriggerCollapsible_ClickHandler);
		input_country		.on("change", system_calls.UpdateInputFieldOnServer);
		input_amount		.on("change", system_calls.UpdateInputFieldOnServer);
		remove_button		.on("click",  RemoveBTAllowance_AreYouSure_ClickHandler);
		reset_form_button	.on("click",  reset_form_callback_global);
		submit_button		.on("click",  SubmitNewBTAllowance_ClickHandler);

		open_col			.append(open_button);
		country_col			.append(input_country)	.append($("<label>"));
		amount_col			.append(input_amount)	.append($("<label>"));
		remove_col			.append(remove_button);
		reset_form_col		.append(reset_form_button);
		submit_col			.append(submit_button);

		row
			.append(open_col)
			.append(country_col)
			.append(amount_col)
			.append(remove_col);

		row_submit
			.append(reset_form_col)
			.append(submit_col);

		result = result.add(row);
		result = result.add(row_collapsible);
		result = result.add(row_submit);

		return	result;
	};

	var	TriggerCollapsible_ClickHandler = function(e)
	{
		var		collapsible_tag_id = $(this).attr("data-target");
		$("#" + collapsible_tag_id).collapse("toggle");
	};

	var	RemoveBTAllowance_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveBTAllowance .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveBTAllowance").modal("show");
	};


	var	Country_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);

		curr_tag.attr("data-country_id", id);
	};

	return {
		Init: Init,
		GetID: GetID,
		SetGlobalData: SetGlobalData,
		DefaultExpand: DefaultExpand,
		ExpandButton: ExpandButton,
		RemoveButton: RemoveButton,
		ResetFormButton: ResetFormButton,
		SubmitButton: SubmitButton,
		SetSubmitCallback: SetSubmitCallback,
		GetDOM: GetDOM,
	};
};


var	agency_bt_allowance_arr = (function()
{
	var	CraftBTAllowanceObjects = function(agency)
	{
		var	obj_arr = [];

		if((typeof(agency) != "undefined") && (typeof(agency.allowances) != "undefined"))
		{
			agency.allowances.forEach(function(item)
			{
				let		temp = new agency_bt_allowance_obj();

				temp.SetGlobalData(item);
				temp.Init();
				temp.ExpandButton("hidden");

				obj_arr.push(temp);
			});
		}
		else
		{
			system_calls.PopoverError("bt_allowance_list", "Ошибка в объекте agency");
		}

		return obj_arr;
	};

	return {
		CraftBTAllowanceObjects: CraftBTAllowanceObjects,
	};
})();
