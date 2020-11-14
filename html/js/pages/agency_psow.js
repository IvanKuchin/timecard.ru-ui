var	agency_psow_obj = function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	DB_FORMAT_GLOBAL = "YYYY-MM-DD";
	var	DEFAULT_DATE = "2001-01-01";
	var random_global;
	var	data_global;
	var	rand_global;
	var	details_area_state_global = "in";
	var base_row_state_global = "hidden";
	var expand_button_state_global = "hidden";
	var remove_button_state_global = "hidden";
	var	submit_button_global = "hidden";

	var	submit_callback_global;

	var	Init = function()
	{
		var		temp = new Date();
		DEFAULT_DATE = system_calls.GetFormattedDateFromSeconds(temp.getTime()/1000, DB_FORMAT_GLOBAL);
		
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__psow[data-random=\"" + random_global + "\"]").length);

	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init 					== "undefined") data_init						= {};
		if(typeof data_init.id					== "undefined") data_init.id					= "0";
		if(typeof data_init.contract_sow_id		== "undefined") data_init.contract_sow_id		= "0";
		if(typeof data_init.cost_center_id		== "undefined") data_init.cost_center_id		= "0";
		if(typeof data_init.company_position_id	== "undefined") data_init.company_position_id	= "0";
		if(typeof data_init.start_date			== "undefined") data_init.start_date			= DEFAULT_DATE;
		if(typeof data_init.end_date			== "undefined") data_init.end_date	 			= DEFAULT_DATE;
		if(typeof data_init.sign_date			== "undefined") data_init.sign_date	 			= DEFAULT_DATE;
		if(typeof data_init.number				== "undefined") data_init.number				= "";
		if(typeof data_init.company_positions	== "undefined") { data_init.company_positions	= []; data_init.company_positions.push( {title:""} ); }
		if(typeof data_init.company_positions[0].title == "undefined") data_init.company_positions[0].title = "";

		data_global = data_init;
	};

	var	GetID = function()
	{
		return data_global.id;
	};

	var	GetCostCenterID = function()
	{
		return data_global.cost_center_id;
	};

	var	CheckValidity = function(submit_button)
	{
		var	result = true;
		var	number_tag = $("input.__psow_number[data-random=\"" + random_global + "\"]");
		
		if(number_tag.val().length === 0)
		{
			system_calls.PopoverError(number_tag, "Необходимо указать номер");
			system_calls.PopoverError(submit_button, "Необходимо указать номер");
			result = false;
		}

		return result;
	};

	var SubmitNewPSoW_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	title_tag = $("input.__psow_title[data-random=\"" + random_global + "\"]");
		var	description_tag = $("input.__psow_description[data-random=\"" + random_global + "\"]");

		var action = curr_tag.attr("data-action");

		if(action.length)
		{
			if(CheckValidity(curr_tag))
			{
				curr_tag.button("loading");
				$.getJSON(
					"/cgi-bin/agency.cgi",
					{
						action: action,
						title: title_tag.val(),
						description: description_tag.val(),
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
						setTimeout(function() {
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						}, 500);
					})
					.always(function(data)
					{
						setTimeout(function(){ curr_tag.button("reset"); }, 500);
					});

			}
			else
			{
				console.error("consistency check failed");
			}
		}
		else
		{
			system_calls.PopoverError(curr_tag, "не указано действие");
		}
	};

	var DefaultExpand = function()
	{
		details_area_state_global = "in";
	};

	var BaseRow = function(state)
	{
		base_row_state_global = state;
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


	var SetSubmitCallback = function(f)
	{
		submit_callback_global = f;
	};

	var	CustomFields_DOM = function()
	{
		var	result = $();

		if(typeof data_global.custom_fields != "undefined")
		{
			data_global.custom_fields.forEach(function(custom_field)
			{
				result = result.add(system_calls.GetEditablePSoWCustomField_DOM(custom_field));
			});

			result.find(".__sow_custom_field_input").attr("data-script", "agency.cgi");
		}


		return result;
	};

	var	GetDetails_DOM = function()
	{
		var	result = $();

		var	agreement_number_row			= $("<div>").addClass("row");
		var	agreement_number_col_title		= $("<div>").addClass("col-xs-3 col-md-2").append("Номер договора");
		var	agreement_number_col_input_num	= $("<div>").addClass("col-xs-3 col-md-2");
		var	agreement_number_col_from		= $("<div>").addClass("col-xs-3 col-md-1").append("от");
		var	agreement_number_col_input_date	= $("<div>").addClass("col-xs-3 col-md-2");
		var	agreement_dates_row				= $("<div>").addClass("row");
		var	agreement_dates_col_title		= $("<div>").addClass("col-xs-3 col-md-2").append("Дата начала");
		var	agreement_dates_col_input_from	= $("<div>").addClass("col-xs-3 col-md-2");
		var	agreement_dates_col_to			= $("<div>").addClass("col-xs-3 col-md-1").append("до");
		var	agreement_dates_col_input_to	= $("<div>").addClass("col-xs-3 col-md-2");
		var	day_rate_row					= $("<div>").addClass("row");
		var	day_rate_col_title				= $("<div>").addClass("col-xs-3 col-md-2").append("Dayrate");
		var	day_rate_col_input				= $("<div>").addClass("col-xs-3 col-md-2");
		var	bt_markup_row					= $("<div>").addClass("row");
		var	bt_markup_col_title				= $("<div>").addClass("col-xs-3 col-md-2").append($("<small>").append("Командировочная наценка"));
		var	bt_markup_col_input				= $("<div>").addClass("col-xs-3 col-md-2");
		var	bt_markup_type_col_input		= $("<div>").addClass("col-xs-3 col-md-2");
		var	position_row					= $("<div>").addClass("row");
		var	position_col_title				= $("<div>").addClass("col-xs-3 col-md-2").append("Должность");
		var	position_col_input				= $("<div>").addClass("col-xs-3 col-md-2");

		var	agreement_number_input_num		= $("<input>").addClass("transparent __psow_number");
		var	agreement_number_input_date		= $("<input>").addClass("transparent __psow_sign_date");
		var	agreement_dates_input_start		= $("<input>").addClass("transparent __psow_start_date");
		var	agreement_dates_input_end		= $("<input>").addClass("transparent __psow_end_date");
		var	day_rate_input					= $("<input>").addClass("transparent __psow_day_rate").attr("type", "number");
		var	bt_markup_input					= $("<input>").addClass("transparent __psow_bt_markup").attr("type", "number");
		var	bt_markup_type_select			= $("<select>").addClass("transparent __psow_bt_markup_type");
		var	position_input					= $("<input>").addClass("transparent __psow_day_position");

		var	temp_sign_date = data_global.sign_date.split("-");
		var	temp_start_date = data_global.start_date.split("-");
		var	temp_end_date = data_global.end_date.split("-");

		var	psow_sign_date = new Date();
		var	psow_start_date = new Date();
		var	psow_end_date = new Date();

		bt_markup_type_select
			.append($("<option>").attr("value", "percent").append("%"))
			.append($("<option>").attr("value", "fix").append("фикс."));

		agreement_number_col_input_num
			.append(agreement_number_input_num)
			.append($("<label>"));
		agreement_number_col_input_date
			.append(agreement_number_input_date)
			.append($("<label>"));

		agreement_dates_col_input_from
			.append(agreement_dates_input_start)
			.append($("<label>"));
		agreement_dates_col_input_to
			.append(agreement_dates_input_end)
			.append($("<label>"));

		day_rate_col_input
			.append(day_rate_input)
			.append($("<label>"));
		bt_markup_col_input
			.append(bt_markup_input)
			.append($("<label>"));
		bt_markup_type_col_input
			.append(bt_markup_type_select)
			.append($("<label>"));
		position_col_input
			.append(position_input)
			.append($("<label>"));

		if(temp_sign_date.length == 3)
			psow_sign_date = new Date(parseInt(temp_sign_date[0]), parseInt(temp_sign_date[1]) - 1, parseInt(temp_sign_date[2]));
		else
			system_calls.PopoverError($(".__psow_sign_date"), "Формат даты некорректный используем текущую дату.");

		if(temp_start_date.length == 3)
			psow_start_date = new Date(parseInt(temp_start_date[0]), parseInt(temp_start_date[1]) - 1, parseInt(temp_start_date[2]));
		else
			system_calls.PopoverError($(".__psow_start_date"), "Формат даты некорректный используем текущую дату.");

		if(temp_end_date.length == 3)
			psow_end_date = new Date(parseInt(temp_end_date[0]), parseInt(temp_end_date[1]) - 1, parseInt(temp_end_date[2]));
		else
			system_calls.PopoverError($(".__psow_end_date"), "Формат даты некорректный используем текущую дату.");

		agreement_number_input_date
					.val(system_calls.GetFormattedDateFromSeconds(psow_sign_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(psow_sign_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true
					});
		agreement_dates_input_start
					.val(system_calls.GetFormattedDateFromSeconds(psow_start_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(psow_start_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,
					    maxDate: system_calls.GetFormattedDateFromSeconds(psow_end_date.getTime()/1000, "DD/MM/YYYY"),

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true

					})
			        .on( "change", function() {
				          agreement_dates_input_end.datepicker( "option", "minDate", $(this).val() );
			        });
		agreement_dates_input_end
					.val(system_calls.GetFormattedDateFromSeconds(psow_end_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(psow_end_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,
					    minDate: system_calls.GetFormattedDateFromSeconds(psow_start_date.getTime()/1000, "DD/MM/YYYY"),

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true
					})
			        .on( "change", function() {
				          agreement_dates_input_start.datepicker( "option", "maxDate", $(this).val() );
			        });

		agreement_number_input_num
			.attr("data-db_value", data_global.number)
			.val(data_global.number);
		day_rate_input
			.attr("data-db_value", data_global.day_rate)
			.val(data_global.day_rate);
		bt_markup_input
			.attr("data-db_value", data_global.bt_markup)
			.val(data_global.bt_markup);
		bt_markup_type_select
			.attr("data-db_value", data_global.bt_markup_type)
			.val(data_global.bt_markup_type);
		position_input
			.attr("data-db_value", data_global.company_positions[0].title)
			.val(data_global.company_positions[0].title);

		agreement_number_input_date		.attr("data-script", "agency.cgi");
		agreement_dates_input_start		.attr("data-script", "agency.cgi");
		agreement_dates_input_end		.attr("data-script", "agency.cgi");
		agreement_number_input_num		.attr("data-script", "agency.cgi");
		day_rate_input					.attr("data-script", "agency.cgi");
		bt_markup_input					.attr("data-script", "agency.cgi");
		bt_markup_type_select			.attr("data-script", "agency.cgi");
		position_input					.attr("data-script", "agency.cgi");

		agreement_number_input_date		.attr("data-id", data_global.id);
		agreement_dates_input_start		.attr("data-id", data_global.id);
		agreement_dates_input_end		.attr("data-id", data_global.id);
		agreement_number_input_num		.attr("data-id", data_global.id);
		day_rate_input					.attr("data-id", data_global.id);
		bt_markup_input					.attr("data-id", data_global.id);
		bt_markup_type_select			.attr("data-id", data_global.id);
		position_input					.attr("data-id", data_global.id);

		agreement_number_input_date		.attr("data-sow_id", data_global.id);
		agreement_dates_input_start		.attr("data-sow_id", data_global.id);
		agreement_dates_input_end		.attr("data-sow_id", data_global.id);
		agreement_number_input_num		.attr("data-sow_id", data_global.id);
		day_rate_input					.attr("data-sow_id", data_global.id);
		bt_markup_input					.attr("data-sow_id", data_global.id);
		bt_markup_type_select			.attr("data-sow_id", data_global.id);
		position_input					.attr("data-sow_id", data_global.id);

		agreement_number_input_date		.attr("data-action", "AJAX_updatePSoWSignDate");
		agreement_dates_input_start		.attr("data-action", "AJAX_updatePSoWStartDate");
		agreement_dates_input_end		.attr("data-action", "AJAX_updatePSoWEndDate");
		agreement_number_input_num		.attr("data-action", "AJAX_updatePSoWNumber");
		day_rate_input					.attr("data-action", "AJAX_updatePSoWDayRate");
		bt_markup_input					.attr("data-action", "AJAX_updatePSoWBTMarkup");
		bt_markup_type_select			.attr("data-action", "AJAX_updatePSoWBTMarkupType");
		position_input					.attr("data-action", "AJAX_updatePSoWPosition");

		agreement_number_input_date		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_dates_input_start		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_dates_input_end		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_number_input_num		.on("change", system_calls.UpdateInputFieldOnServer);
		day_rate_input					.on("change", system_calls.UpdateInputFieldOnServer);
		bt_markup_input					.on("change", system_calls.UpdateInputFieldOnServer);
		bt_markup_type_select			.on("change", system_calls.UpdateInputFieldOnServer);
		position_input					.on("change", system_calls.UpdateInputFieldOnServer)
										.on("input", system_calls.Position_InputHandler);

		agreement_number_row
			.append(agreement_number_col_title)
			.append(agreement_number_col_input_num)
			.append(agreement_number_col_from)
			.append(agreement_number_col_input_date);
		agreement_dates_row
			.append(agreement_dates_col_title)
			.append(agreement_dates_col_input_from)
			.append(agreement_dates_col_to)
			.append(agreement_dates_col_input_to);
		day_rate_row
			.append(day_rate_col_title)
			.append(day_rate_col_input);
		bt_markup_row
			.append(bt_markup_col_title)
			.append(bt_markup_col_input)
			.append(bt_markup_type_col_input);
		position_row
			.append(position_col_title)
			.append(position_col_input);

		result = result.add(agreement_number_row);
		result = result.add(agreement_dates_row);
		result = result.add(day_rate_row);
		result = result.add(bt_markup_row);
		result = result.add(position_row);

		return result;
	};

	var	GetDOM = function()
	{
		var		result = $();

		var		row = 						$("<div>").addClass("row __psow highlight_onhover zebra_painting cost_center_" + data_global.id + " " + base_row_state_global);
		var		open_button =				$("<i>").addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover " + expand_button_state_global);
		var		input_title =				$("<input>").addClass("transparent __psow_title cost_center" + data_global.id).attr("placeholder", "Название");
		var		input_comment =				$("<input>").addClass("transparent __psow_description cost_center" + data_global.id).attr("placeholder", "Коментарий (необязательно)");
		var		remove_button	=			$("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		var		open_col = 					$("<div>").addClass("col-xs-2 col-md-1");
		var		title_col = 				$("<div>").addClass("col-xs-4 col-md-2");
		var		comment_col = 				$("<div>").addClass("col-xs-4 col-md-8");
		var		remove_col =				$("<div>").addClass("col-xs-2 col-md-1");
		var		submit_button =				$("<button>").addClass("btn btn-primary form-control " + submit_button_global).append("Сохранить");
		var		temp = [];

		// --- render collapsible part
		var		row_collapsible =			$("<div>").addClass("row collapse " + details_area_state_global);
		var		row_submit = 				$("<div>").addClass("row __psow_submit cost_center" + data_global.id);
		var		submit_col = 				$("<div>").addClass("col-xs-12 col-md-offset-10 col-md-2");

		row_collapsible		.attr("id", "collapsible_cost_center_" + data_global.id)
							.append($("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20").append("<p>"));

		{
			var		col_container	= $("<div>").addClass("col-xs-12");

			row_collapsible.append(col_container.append(GetDetails_DOM()).append(CustomFields_DOM()));
		}

		row_collapsible		.append($("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20").append("<p>"));

		open_button			.attr("data-target", "collapsible_cost_center_" + data_global.id)
							.attr("data-toggle", "collapse");


		// --- render main info part
		input_title			.val(data_global.title)
							.attr("data-db_value", data_global.title)
							.attr("data-script", "agency.cgi");
		input_comment		.val(data_global.description)
							.attr("data-db_value", data_global.description)
							.attr("data-script", "agency.cgi");

		open_button 		.attr("data-id", data_global.id);
		input_title			.attr("data-id", data_global.id);
		input_comment		.attr("data-id", data_global.id);
		remove_button		.attr("data-id", data_global.id);
		submit_button		.attr("data-id", data_global.id);

		row					.attr("data-random", random_global);
		open_button			.attr("data-random", random_global);
		input_title			.attr("data-random", random_global);
		input_comment		.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_title			.attr("data-action", "AJAX_updateCostCenterTitle");
		input_comment		.attr("data-action", "AJAX_updateCostCenterDescription");
		remove_button		.attr("data-action", "AJAX_deleteCostCenter");
		submit_button		.attr("data-action", "AJAX_addCostCenter");

		open_button			.on("click",  TriggerCollapsible_ClickHandler);
		input_title			.on("change", system_calls.UpdateInputFieldOnServer);
		input_comment		.on("change", system_calls.UpdateInputFieldOnServer);
		remove_button		.on("click",  RemoveCostCenter_AreYouSure_ClickHandler);
		// submit_button		.on("click",  SubmitNewPSoW_ClickHandler);

		open_col			.append(open_button);
		title_col			.append(input_title	)		.append($("<label>"));
		comment_col			.append(input_comment)		.append($("<label>"));
		remove_col			.append(remove_button);
		submit_col			.append(submit_button);

		row
			.append(open_col)
			.append(title_col)
			.append(comment_col)
			.append(remove_col);

		row_submit
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

	var	RemoveCostCenter_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveCostCenter .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveCostCenter").modal("show");
	};



	return {
		Init: Init,
		GetID: GetID,
		GetCostCenterID: GetCostCenterID,
		SetGlobalData: SetGlobalData,
		DefaultExpand: DefaultExpand,
		BaseRow: BaseRow,
		ExpandButton: ExpandButton,
		RemoveButton: RemoveButton,
		SubmitButton: SubmitButton,
		SetSubmitCallback: SetSubmitCallback,
		GetDOM: GetDOM,
	};
};


var	agency_psow_obj_supplemental = (function()
{
	var	GetPSoWArr = function(sow)
	{
		var	result = [];

		sow.psow.forEach(function(psow)
		{
			var	temp = new agency_psow_obj();

			temp.Init();
			temp.SetGlobalData(psow);

			result.push(temp);
		});

		return result;
	};

	var	GetPSoWMapByCostCenterID = function(psow_arr)
	{
		var	result = new Map();

		psow_arr.forEach(function(psow)
		{
			result[psow.GetCostCenterID()] = psow;
		});

		return result;
	};

	return {
		GetPSoWArr: GetPSoWArr,
		GetPSoWMapByCostCenterID: GetPSoWMapByCostCenterID,
	};
})();
