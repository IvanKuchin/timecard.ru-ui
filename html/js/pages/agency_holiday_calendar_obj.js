var	agency_holiday_calendar_obj = function()
{
	'use strict';

	var random_global;
	var	data_global;
	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
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
		} while($("div.__holiday_calendar[data-random=\"" + random_global + "\"]").length);

		system_calls.SetCurrentScript("agency.cgi");
	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init 				== "undefined") data_init = {};
		if(typeof data_init.id				== "undefined") data_init.id = "0";
		if(typeof data_init.date			== "undefined") data_init.date = "";
		if(typeof data_init.title			== "undefined") data_init.title		= "";

		data_global = data_init;
	};

	var	GetID		= function() { return data_global.id; };

	var	CheckNewHolidayCalendarValidity = function(submit_button)
	{
		var	result = true;
		var	date					= $("input.__holiday_calendar_date[data-random=\"" + random_global + "\"]");
		var	title					= $("input.__holiday_calendar_title[data-random=\"" + random_global + "\"]");
		var	message = "";
		
		if(date.val().length === 0)
		{
			message = "Необходимо выбрать дату";
			system_calls.PopoverError(date, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}

		if(title.val().length === 0)
		{
			message = "Необходимо указать название";
			system_calls.PopoverError(title, message);
			system_calls.PopoverError(submit_button, message);
			result = false;
		}


		return result;
	};

	var SubmitNewHolidayCalendar_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	date_tag = $("input.__holiday_calendar_date[data-random=\"" + random_global + "\"]");
		var	title_tag = $("input.__holiday_calendar_title[data-random=\"" + random_global + "\"]");

		var action = curr_tag.attr("data-action");

		if(action.length)
		{
			if(CheckNewHolidayCalendarValidity(curr_tag))
			{
				let	date_arr = date_tag.val().split(/\//);
				let	date_to_send = date_arr[2] + "-" + date_arr[1] + "-" + date_arr[0];

				curr_tag.button("loading");

				$.getJSON(
					'/cgi-bin/agency.cgi',
					{
						action:		action,
						date:		date_to_send,
						title:		title_tag.val(),
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
		let		result = $();

		let		row	 				= $("<div>")	.addClass("row __holiday_calendar highlight_onhover zebra_painting holiday_calendar_" + data_global.id);
		let		open_button			= $("<i>")		.addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover " + expand_button_state_global);
		let		input_date			= $("<input>")	.addClass("transparent __holiday_calendar_date holiday_calendar" + data_global.id)
													.attr("placeholder", "Дата");
		let		input_title			= $("<input>")	.addClass("transparent __holiday_calendar_title holiday_calendar" + data_global.id)
													.attr("maxlength", "64")
													.attr("placeholder", "Название");
		let		remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		let		open_col	 		= $("<div>")	.addClass("col-xs-2 col-md-1");
		let		date_col	 		= $("<div>")	.addClass("col-xs-4 col-md-2 __holiday_calendar_collapsible_date_" + random_global);
		let		title_col	 		= $("<div>")	.addClass("col-xs-4 col-md-8 __holiday_calendar_collapsible_title_" + random_global);
		let		remove_col			= $("<div>")	.addClass("col-xs-2 col-md-1");
		let		reset_form_button	= $("<button>")	.addClass("btn btn-default form-control " + reset_form_button_global).append("Сбросить");
		let		submit_button		= $("<button>")	.addClass("btn btn-primary form-control " + submit_button_global).append("Сохранить");
		let		temp = [];

		// --- render collapsible part
		let		row_collapsible 	= $("<div>")	.addClass("row collapse " + details_area_state_global);
		let		row_submit 			= $("<div>")	.addClass("row __holiday_calendar_submit holiday_calendar" + data_global.id);
		let		reset_form_col 		= $("<div>")	.addClass("col-xs-6 col-md-offset-8 col-md-2");
		let		submit_col 			= $("<div>")	.addClass("col-xs-6 col-md-2");

		let		col_main_fields		= $("<div>")	.addClass("col-xs-12");
		let		col_custom_fields	= $("<div>")	.addClass("col-xs-12");

		row_collapsible		.attr("id", "collapsible_holiday_calendar_" + data_global.id)
							.append($("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20").append("<p>"));

		row_collapsible		.append($("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20").append("<p>"));

		open_button			.attr("data-target", "collapsible_holiday_calendar_" + data_global.id)
							.attr("data-toggle", "collapse");


		// --- render main info part
		{
			let	result		= data_global.date;

			let	date_arr	= data_global.date.split(/-/);
			if(date_arr.length == 3) result = date_arr[2] + "/" + date_arr[1] + "/" + date_arr[0];

			input_date		.val(result)
							.attr("data-db_value", result)
							.attr("data-script", "agency.cgi")
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
								numberOfMonths: [2, 3],
								yearRange: "1940:2030",
								showOtherMonths: true,
								selectOtherMonths: true
							});
		}
		input_title			.val(data_global.title)
							.attr("data-db_value", data_global.title)
							.attr("data-script", "agency.cgi");

		open_button 		.attr("data-id", data_global.id);
		input_date			.attr("data-id", data_global.id);
		input_title			.attr("data-id", data_global.id);
		remove_button		.attr("data-id", data_global.id);
		reset_form_button	.attr("data-id", data_global.id);
		submit_button		.attr("data-id", data_global.id);

		row					.attr("data-random", random_global);
		open_button			.attr("data-random", random_global);
		input_date			.attr("data-random", random_global);
		input_title			.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		reset_form_button	.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_date			.attr("data-action", "AJAX_updateHolidayCalendarDate");
		input_title			.attr("data-action", "AJAX_updateHolidayCalendarTitle");
		remove_button		.attr("data-action", "AJAX_deleteHolidayCalendar");
		submit_button		.attr("data-action", "AJAX_addHolidayCalendar");

		open_button			.on("click",  TriggerCollapsible_ClickHandler);
		remove_button		.on("click",  RemoveHolidayCalendar_AreYouSure_ClickHandler);
		reset_form_button	.on("click",  reset_form_callback_global);
		submit_button		.on("click",  SubmitNewHolidayCalendar_ClickHandler);

		input_title			.on("change", data_global.id != 0 ? system_calls.UpdateInputFieldOnServer : null);
		input_date			.on("change", data_global.id != 0 ? system_calls.UpdateInputFieldOnServer : null);

		open_col			.append(open_button);
		date_col			.append(input_date)		.append($("<label>"));
		title_col			.append(input_title)	.append($("<label>"));
		remove_col			.append(remove_button);
		reset_form_col		.append(reset_form_button);
		submit_col			.append(submit_button);

		row
			.append(open_col)
			.append(date_col)
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

	var	RemoveHolidayCalendar_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveHolidayCalendar .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveHolidayCalendar").modal("show");
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


var	agency_holiday_calendar_arr = (function()
{
	var	CraftHolidayCalendarObjects = function(agency, update_callback)
	{
		var	obj_arr = [];

		if((typeof(agency) != "undefined") && (typeof(agency.holiday_calendar) != "undefined"))
		{
			agency.holiday_calendar.sort(function(a, b)
				{
					var		arrA = a.date.split(/\-/);
					var		arrB = b.date.split(/\-/);
					var 	timeA, timeB;
					var		result = 0;

					timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
					timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

					if(timeA.getTime() == timeB.getTime()) { result = 0; }
					if(timeA.getTime() >  timeB.getTime()) { result = 1; }
					if(timeA.getTime() <  timeB.getTime()) { result = -1; }

					return result;
				});

			agency.holiday_calendar.forEach(function(item)
			{
				let		temp = new agency_holiday_calendar_obj();

				temp.SetGlobalData(item);
				temp.Init();
				temp.ExpandButton("hidden");
				temp.SetSubmitCallback(update_callback);

				obj_arr.push(temp);
			});
		}
		else
		{
			system_calls.PopoverError("holiday_calendar_list", "Ошибка в объекте agency");
		}

		return obj_arr;
	};

	return {
		CraftHolidayCalendarObjects: CraftHolidayCalendarObjects,
	};
})();
