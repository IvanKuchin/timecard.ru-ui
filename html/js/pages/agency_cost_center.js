var	agency_cost_center_obj = function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	DB_FORMAT_GLOBAL = "YYYY-MM-DD";
	var	DEFAULT_DATE = "2001-01-01";
	var random_global;
	var	data_global;
	var	details_area_state_global = "";
	var expand_button_state_global = "";
	var remove_button_state_global = "";
	var	enable_tin_button_global = false;
	var	reset_form_button_global = "hidden";
	var	reset_form_callback_global;
	var	submit_button_global = "hidden";
	var	company_obj_global = {};

	var	submit_callback_global;

	var	Init = function()
	{
		var		temp = new Date();
		DEFAULT_DATE = system_calls.GetFormattedDateFromSeconds(temp.getTime()/1000, DB_FORMAT_GLOBAL);
		
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__cost_center[data-random=\"" + random_global + "\"]").length);

		system_calls.SetCurrentScript("agency.cgi");
		company_obj_global = new company_info_edit(random_global);
		
		company_obj_global.Init(system_calls.UpdateInputFieldOnServer);
	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init 				== "undefined") data_init = {};
		if(typeof data_init.id				== "undefined") data_init.id = "0";
		if(typeof data_init.title			== "undefined") data_init.title = "";
		if(typeof data_init.agency_comment	== "undefined") data_init.agency_comment= "";
		if(typeof data_init.start_date		== "undefined") data_init.start_date	= DEFAULT_DATE;
		if(typeof data_init.end_date		== "undefined") data_init.end_date	 	= DEFAULT_DATE;
		if(typeof data_init.sign_date		== "undefined") data_init.sign_date	 	= DEFAULT_DATE;
		if(typeof data_init.number			== "undefined") data_init.number		= "";

		data_global = data_init;
	};

	var	GetID		= function() { return data_global.id; };
	var	GetTitle	= function() { return data_global.companies[0].name; };

	// --- format dd/mm/yyyy
	var	GetSecFromFormattedDate = function(date_str)
	{
		var date_arr = date_str.split("/");
		var	year = 0;
		var	result = 0;
		var	date_obj;

		if(date_arr.length == 3)
		{
			year = parseInt(date_arr[2]);
			if(year < 100) year += 1900;

			date_obj = new Date(year, parseInt(date_arr[1]), parseInt(date_arr[0]));
			result = date_obj.getTime() / 1000;
		}
		else
		{
			console.error("fail to parse date(" + date_str + ")");
		}

		return result;
	};

	var	CheckNewCostCenterValidity = function(submit_button)
	{
		var	result = true;
		var	agreement_number		= $("input.__psow_number[data-random=\"" + random_global + "\"]");
		var	agreement_start_date	= $("input.__psow_start_date[data-random=\"" + random_global + "\"]");
		var	agreement_end_date		= $("input.__psow_end_date[data-random=\"" + random_global + "\"]");
		var	message = "";
		
		if(agreement_number.val().length === 0)
		{
			message = "Необходимо указать номер договора";
			system_calls.PopoverError(agreement_number, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}

		if(GetSecFromFormattedDate(agreement_start_date.val()) > GetSecFromFormattedDate(agreement_end_date.val()))
		{
			message = "Дата начала договора должна быть раньше окончания";
			system_calls.PopoverError(agreement_start_date, message);
			system_calls.PopoverError(agreement_end_date, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}

		return result;
	};

	var SubmitNewCostCenter_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	title_tag = $("input.__cost_center_title[data-random=\"" + random_global + "\"]");
		var	description_tag = $("input.__cost_center_description[data-random=\"" + random_global + "\"]");

		var action = curr_tag.attr("data-action");

		if(action.length)
		{
			if(company_obj_global.isValid())
			{
				if(CheckNewCostCenterValidity(curr_tag))
				{
					curr_tag.button("loading");
					
					company_obj_global.SetType("cost_center");
					company_obj_global.SubmitNewCompanyToServer()
						.then(function(result)
						{
							var	company_id = result.company_id;

							if(parseInt(company_id))
							{
								$.getJSON(
									'/cgi-bin/agency.cgi',
									{
										action: action,
										company_id: company_id,
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
								system_calls.PopoverError(curr_tag, "Ошибка создания компании");
							}

						}, function(err)
						{
							system_calls.PopoverError(curr_tag, err);
							setTimeout(function(){ curr_tag.button("reset"); }, 500);
						});
				}
				else
				{
					system_calls.PopoverError(curr_tag, "Исправьте данные договора");
				}
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Исправьте данные компании");
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

	var EnableTINButton = function(state)
	{
		enable_tin_button_global = state;
	};

	var	SetCountriesObj = function(obj)
	{
		if(company_obj_global)
		{
			company_obj_global.SetCountriesObj(obj);
		}
		else
		{
			console.error("Init() has to precede SetCountriesObj(). company_obj_global doesn't created.");
		}
	};

	var SetSubmitCallback = function(f)
	{
		submit_callback_global = f;
	};

	var	Details_GetDOM = function()
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

		var	agreement_number_input_num		= $("<input>").addClass("transparent __psow_number");
		var	agreement_number_input_date		= $("<input>").addClass("transparent __psow_sign_date");
		var	agreement_dates_input_start		= $("<input>").addClass("transparent __psow_start_date");
		var	agreement_dates_input_end		= $("<input>").addClass("transparent __psow_end_date");

		var	temp_sign_date = data_global.sign_date.split('-');
		var	temp_start_date = data_global.start_date.split('-');
		var	temp_end_date = data_global.end_date.split('-');

		var	psow_sign_date = new Date();
		var	psow_start_date = new Date();
		var	psow_end_date = new Date();

		var	company_obj = (data_global && (typeof data_global.companies != "undefined") && data_global.companies.length ? data_global.companies[0] : undefined);

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

		agreement_number_input_date		.attr("data-script", "agency.cgi");
		agreement_dates_input_start		.attr("data-script", "agency.cgi");
		agreement_dates_input_end		.attr("data-script", "agency.cgi");
		agreement_number_input_num		.attr("data-script", "agency.cgi");

		agreement_number_input_date		.attr("data-id", data_global.id);
		agreement_dates_input_start		.attr("data-id", data_global.id);
		agreement_dates_input_end		.attr("data-id", data_global.id);
		agreement_number_input_num		.attr("data-id", data_global.id);

		agreement_number_input_date		.attr("data-random", random_global);
		agreement_dates_input_start		.attr("data-random", random_global);
		agreement_dates_input_end		.attr("data-random", random_global);
		agreement_number_input_num		.attr("data-random", random_global);

		agreement_number_input_date		.attr("data-sow_id", data_global.id);
		agreement_dates_input_start		.attr("data-sow_id", data_global.id);
		agreement_dates_input_end		.attr("data-sow_id", data_global.id);
		agreement_number_input_num		.attr("data-sow_id", data_global.id);

		agreement_number_input_date		.attr("data-action", "AJAX_updateCostCenterSignDate");
		agreement_dates_input_start		.attr("data-action", "AJAX_updateCostCenterStartDate");
		agreement_dates_input_end		.attr("data-action", "AJAX_updateCostCenterEndDate");
		agreement_number_input_num		.attr("data-action", "AJAX_updateCostCenterNumber");

		agreement_number_input_date		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_dates_input_start		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_dates_input_end		.on("change", system_calls.UpdateInputFieldOnServer);
		agreement_number_input_num		.on("change", system_calls.UpdateInputFieldOnServer);

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

		company_obj_global.SetTINButtonStatus(enable_tin_button_global);


		result = result.add(company_obj_global.GetDOM(company_obj));
		result = result.add(agreement_number_row);
		result = result.add(agreement_dates_row);

		// --- this is workaround to update cost_center_title if company title changed
		result.find("#company_title_" + random_global).on("change", CompanyTitle_ChangeHandler);

		return result;
	};

	var	CustomFields_GetDOM = function()
	{
		var	result = $();
		var	title_row	= $("<div>").addClass("row");
		var	title_col	= $("<div>").addClass("col-xs-12");

		if((typeof data_global.custom_fields != "undefined") && data_global.custom_fields.length)
		{
			title_row.append(title_col.append($("<h4>").append($("<center>").append("Дополнительная информация"))));
			result = result.add(title_row);

			data_global.custom_fields.forEach(function(custom_field)
			{
				result = result.add(system_calls.GetEditableCostCenterCustomField_DOM(custom_field));
			});

			result.find(".__sow_custom_field_input").attr("data-script", "agency.cgi");
			result.find(".__sow_custom_field_input").attr("data-sow_id", data_global.id);
		}


		return result;
	};

	var	GetDOM = function()
	{
		var		result = $();

		var		row	 				= $("<div>")	.addClass("row __cost_center highlight_onhover zebra_painting cost_center_" + data_global.id);
		var		open_button			= $("<i>")		.addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover " + expand_button_state_global);
		var		input_title			= $("<input>")	.addClass("transparent __cost_center_title cost_center" + data_global.id).attr("placeholder", "Название");
		var		input_comment		= $("<input>")	.addClass("transparent __cost_center_description cost_center" + data_global.id).attr("placeholder", "Коментарий (необязательно)");
		var		remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		var		open_col	 		= $("<div>")	.addClass("col-xs-2 col-md-1");
		var		title_col	 		= $("<div>")	.addClass("col-xs-8 col-md-10 __cost_center_collapsible_title_" + random_global);
		// var		comment_col = 		$("<div>")	.addClass("col-xs-4 col-md-8");
		var		remove_col			= $("<div>")	.addClass("col-xs-2 col-md-1");
		var		reset_form_button	= $("<button>")	.addClass("btn btn-default form-control " + reset_form_button_global).append("Сбросить");
		var		submit_button		= $("<button>")	.addClass("btn btn-primary form-control " + submit_button_global).append("Сохранить");
		var		temp = [];

		// --- render collapsible part
		var		row_collapsible 	= $("<div>")	.addClass("row collapse " + details_area_state_global);
		var		row_submit 			= $("<div>")	.addClass("row __cost_center_submit cost_center" + data_global.id);
		var		reset_form_col 		= $("<div>")	.addClass("col-xs-6 col-md-offset-8 col-md-2");
		var		submit_col 			= $("<div>")	.addClass("col-xs-6 col-md-2");

		var		col_main_fields		= $("<div>")	.addClass("col-xs-12");
		var		col_custom_fields	= $("<div>")	.addClass("col-xs-12");

		row_collapsible		.attr("id", "collapsible_cost_center_" + data_global.id)
							.append($("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20").append("<p>"));

		{
			row_collapsible.append(col_main_fields.append(Details_GetDOM()));
			row_collapsible.append(col_custom_fields.append(CustomFields_GetDOM()));
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
		reset_form_button	.attr("data-id", data_global.id);
		submit_button		.attr("data-id", data_global.id);

		row					.attr("data-random", random_global);
		open_button			.attr("data-random", random_global);
		input_title			.attr("data-random", random_global);
		input_comment		.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		reset_form_button	.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_title			.attr("data-action", "AJAX_updateCostCenterTitle");
		input_comment		.attr("data-action", "AJAX_updateCostCenterDescription");
		remove_button		.attr("data-action", "AJAX_deleteCostCenter");
		submit_button		.attr("data-action", "AJAX_addCostCenter");

		open_button			.on("click",  TriggerCollapsible_ClickHandler);
		input_title			.on("change", system_calls.UpdateInputFieldOnServer);
		input_comment		.on("change", system_calls.UpdateInputFieldOnServer);
		remove_button		.on("click",  RemoveCostCenter_AreYouSure_ClickHandler);
		reset_form_button	.on("click",  reset_form_callback_global);
		submit_button		.on("click",  SubmitNewCostCenter_ClickHandler);

		open_col			.append(open_button);
		if(typeof data_global.companies != "undefined")
			title_col			.append(data_global.companies[0].name);
		remove_col			.append(remove_button);
		reset_form_col		.append(reset_form_button);
		submit_col			.append(submit_button);

		row
			.append(open_col)
			.append(title_col)
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

	var	RemoveCostCenter_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveCostCenter .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveCostCenter").modal("show");
	};


	var	CompanyTitle_ChangeHandler = function(e)
	{
		var		curr_tag = $(this);

		setTimeout(function()
			{
				$(".__cost_center_collapsible_title_" + random_global).empty().append(curr_tag.val());
			}, 1000);
	};

	return {
		Init: Init,
		GetID: GetID,
		GetTitle: GetTitle,
		SetGlobalData: SetGlobalData,
		DefaultExpand: DefaultExpand,
		ExpandButton: ExpandButton,
		RemoveButton: RemoveButton,
		ResetFormButton: ResetFormButton,
		SubmitButton: SubmitButton,
		EnableTINButton: EnableTINButton,
		SetCountriesObj: SetCountriesObj,
		SetSubmitCallback: SetSubmitCallback,
		GetDOM: GetDOM,
	};
};


var	agency_cost_center_arr = (function()
{
	var	CraftCostCenterObjects = function(agency)
	{
		var	cost_centers = [];

		if((typeof(agency) != "undefined") && (typeof(agency.cost_centers) != "undefined"))
		{
			agency.cost_centers.forEach(function(cost_center)
			{
				var		temp_cost_center = new agency_cost_center_obj();

				temp_cost_center.SetGlobalData(cost_center);
				temp_cost_center.Init();

				cost_centers.push(temp_cost_center);
			});
		}
		else
		{
			system_calls.PopoverError("cost_center_container", "Ошибка в объекте agency");
		}

		return cost_centers;
	};

	return {
		CraftCostCenterObjects: CraftCostCenterObjects,
	};
})();
