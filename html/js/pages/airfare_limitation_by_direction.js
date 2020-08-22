var	airfare_limitation_by_direction = function()
{
	'use strict';

	var random_global;
	var	data_global;

	var	submit_callback_global;
	var	input_fields_state_global;
	var	zebra_paint_global = true;

	var	remove_button_state_global;
	var	submit_button_state_global;

	var	Init = function()
	{
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__airfare_limitation_by_direction[data-random=\"" + random_global + "\"]").length);
	};

	var SetSubmitCallback = function(f)
	{
		submit_callback_global = f;
	};

	var	AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveAirfareLimitationByDirection .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveAirfareLimitationByDirection").modal("show");
	};

	var	SetGlobalData = function(data_init)
	{
		if(data_init)
			data_global = data_init;
		else
		{
			data_global = {};
			data_global.id = 0;
			data_global.from = [];
			data_global.from[0] = {};
			data_global.from[0].id = 0;
			data_global.from[0].title = "";
			data_global.from[0].abbrev = "";
			data_global.to = [];
			data_global.to[0] = {};
			data_global.to[0].id = 0;
			data_global.to[0].title = "";
			data_global.to[0].abbrev = "";

		}
	};

	var RemoveButton = function(state)
	{
		remove_button_state_global = state;
	};

	var SubmitButton = function(state)
	{
		submit_button_state_global = state;
	};

	var DisableZebraPaint = function(state)
	{
		zebra_paint_global = false;
	};

	var InputFields = function(state)
	{
		input_fields_state_global = state;
	};

	var	CheckValidity = function()
	{
		var	result		= true;
		var	from_tag	= $(".__country_from.__airfare_limitation_by_direction_" + data_global.id);
		var	to_tag		= $(".__country_to.__airfare_limitation_by_direction_" + data_global.id);
		var	limit_tag	= $(".__limit.__airfare_limitation_by_direction_" + data_global.id);

		if(!(from_tag.attr("data-country_id") && from_tag.attr("data-country_id").length))
		{
			result = false;
			system_calls.PopoverError(from_tag, "Необходимо заполнить");
		}
		if(!(to_tag.attr("data-country_id") && to_tag.attr("data-country_id").length))
		{
			result = false;
			system_calls.PopoverError(to_tag, "Необходимо заполнить");
		}
		if(!(limit_tag.val().length))
		{
			result = false;
			system_calls.PopoverError(limit_tag, "Необходимо заполнить");
		}

		return result;
	};

	var	Submit_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	expense_template_id = data_global.id;

		if(CheckValidity(curr_tag))
		{
			// --- add new expense template
			var		cgi_params = 
			{
				action: "AJAX_addAirfareLimitationByDirection",
				from_id: $(".__country_from.__airfare_limitation_by_direction_" + data_global.id).attr("data-country_id"),
				to_id: $(".__country_to.__airfare_limitation_by_direction_" + data_global.id).attr("data-country_id"),
				limit: $(".__limit.__airfare_limitation_by_direction_" + data_global.id).val(),
			};

			curr_tag.button("loading");

			$.getJSON('/cgi-bin/agency.cgi?rand=' + Math.floor(Math.random() * 1435267980867), cgi_params)
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
						// --- install previous value, due to error
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
				.always(function()
				{
					setTimeout(function() { curr_tag.button("reset"); }, 300);
				});

		}
		else
		{
			console.error("ERROR: check airfare limitation by direction validity");
		}
	};

	var	GetDOM = function()
	{
		var		result = $();
		var		id						= data_global.id;
		var		row						= $("<div>").addClass("row __airfare_limitation_by_direction " + (zebra_paint_global ? " highlight_onhover zebra_painting " : "") + " __airfare_limitation_by_direction_" + id);

		var		padding_col				= $("<div>").addClass("col-md-1").append("");
		var		country_from_col		= $("<div>").addClass("col-xs-4 col-md-2");
		var		country_to_col			= $("<div>").addClass("col-xs-4 col-md-2");
		var		col_limit				= $("<div>").addClass("col-xs-3 col-md-2");

		var		country_from_input		= $("<input>").addClass("transparent __country_from __airfare_limitation_by_direction_" + id).attr("placeholder", "Откуда");
		var		country_to_input		= $("<input>").addClass("transparent __country_to __airfare_limitation_by_direction_" + id).attr("placeholder", "Куда");
		var		input_limit				= $("<input>").addClass("transparent __limit __airfare_limitation_by_direction_" + id).attr("placeholder", "Макс стоимость");
		var		country_from_div		= $("<div>").addClass("transparent __country_from __airfare_limitation_by_direction_" + id);
		var		country_to_div			= $("<div>").addClass("transparent __country_to __airfare_limitation_by_direction_" + id);

		var		remove_col				= $("<div>").addClass("col-xs-1 col-md-offset-4 col-md-1");
		var		remove_button			= $("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		var		submit_col				= $("<div>").addClass("col-xs-12 col-md-offset-10 col-md-2");
		var		submit_button			= $("<button>").addClass("btn btn-primary form-control " + submit_button_state_global).append("Сохранить");
		var		temp = [];

		country_from_div	.empty().append(data_global.from[0].title);
		country_to_div		.empty().append(data_global.to[0].title);
		country_from_input	.val(data_global.from[0].title)
							.attr("data-db_value", data_global.from[0].title);
		country_to_input	.val(data_global.to[0].title)
							.attr("data-db_value", data_global.to[0].title);
		input_limit			.val(data_global.limit)
							.attr("data-db_value", data_global.limit);
	
		country_from_input
							.autocomplete({
								source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAirportCountryAutocompleteList",
								select: Country_SelectHandler,
							});
		country_to_input
							.autocomplete({
								source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAirportCountryAutocompleteList",
								select: Country_SelectHandler,
							});



		submit_button		.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>");

		country_from_input	.attr("data-id", id);
		country_to_input	.attr("data-id", id);
		input_limit			.attr("data-id", id);
		remove_button		.attr("data-id", id);
		submit_button		.attr("data-id", id);

		row					.attr("data-random", random_global);
		country_from_input	.attr("data-random", random_global);
		country_to_input	.attr("data-random", random_global);
		input_limit			.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_limit			.attr("data-action", "AJAX_updateAirfareLimitationByDirection");

		input_limit			.on("change", system_calls.UpdateInputFieldOnServer);
		remove_button		.on("click",  AreYouSure_ClickHandler);
		submit_button		.on("click",  Submit_ClickHandler);

		if(input_fields_state_global == "disabled")
		{

			country_from_col.append(country_from_div);
			country_to_col	.append(country_to_div);
		}
		else
		{

			country_from_col.append(country_from_input)	.append($("<label>"));
			country_to_col	.append(country_to_input)	.append($("<label>"));
		}

		col_limit			.append(input_limit)		.append($("<label>"));

		remove_col			.append(remove_button);
		submit_col			.append(submit_button);


		row
			.append(padding_col)
			.append(country_from_col)
			.append(country_to_col)
			.append(col_limit)
			.append(remove_col)
			.append(submit_col);


		result = result.add(row);
		// result = result.add(row_submit);

		return	result;
	};

	var Country_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);

		curr_tag.attr("data-country_id", id);
	};

	return {
		Init: Init,
		SetGlobalData: SetGlobalData,
		SetSubmitCallback: SetSubmitCallback,
		GetDOM: GetDOM,
		RemoveButton: RemoveButton,
		SubmitButton: SubmitButton,
		DisableZebraPaint: DisableZebraPaint,
		InputFields: InputFields,
	};
};
