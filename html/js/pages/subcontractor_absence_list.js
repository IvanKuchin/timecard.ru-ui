
var	subcontractor_absence_list = subcontractor_absence_list || {};

subcontractor_absence_list = (function()
{
	'use strict';

	var		DATE_FORMAT_GLOBAL = "dd/mm/yy";

	var	Init = function()
	{
		GetAbsenceListFromServer();
		GetAbsenceTypeListFromServer();

		$(".new_absence_start_date")
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
							})
					        .on( "change", function() {
						          $(".new_absence_end_date").datepicker( "option", "minDate", $(this).val() );
					        });

		$(".new_absence_end_date")
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
							})
					        .on( "change", function() {
						          $(".new_absence_start_date").datepicker( "option", "maxDate", $(this).val() );
					        });

		$("#new_absence_submit").on("click", NewAbsenceSubmit_ClickHandler);

		$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

	};

	var	GetAbsenceListFromServer = function()
	{
		$.getJSON(
			'/cgi-bin/subcontractor.cgi',
			{
				action: "AJAX_getAbsenceList",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderAbsenceList(data.absences);
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
			});
	};

	var	GetAbsenceTypeListFromServer = function()
	{
		$.getJSON(
			'/cgi-bin/ajax_anyrole_1.cgi',
			{
				action: "AJAX_getAbsenceTypesList",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderAbsenceTypeList(data.absence_types);
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
			});
	};

	var	AbsenceTypes_GetDOM = function(absence_types)
	{
		var	result = $();

		absence_types.forEach(function(item)
			{
				var		option_tag = $("<option>").attr("value", item.id).append(item.title);

				result = result.add(option_tag);
			});

		return result;
	};

	var	RenderAbsenceTypeList = function(absence_types)
	{
		$(".new_absence_type").empty().append(AbsenceTypes_GetDOM(absence_types));
	};

	var	NewAbsenceSubmit_CheckValidity = function()
	{
		var	start_date_tag = $(".new_absence_start_date");
		var	end_date_tag = $(".new_absence_end_date");
		var	result = false;

		if(start_date_tag.val().length)
		{
			if(end_date_tag.val().length)
			{
				result = true;
			}
			else
			{
				system_calls.PopoverError(end_date_tag, "Введите дату");
			}
		}
		else
		{
			system_calls.PopoverError(start_date_tag, "Введите дату");
		}

		return result;
	};

	var	RenderAbsenceList_GetDOM = function(absences)
	{
		var		result = $();

		absences.forEach(function(item)
		{
			var	row_tag					= $("<div>").addClass("row __absence_" + item.id);
			var	col_title_tag			= $("<div>").addClass("col-xs-4 col-md-2");
			var	col_start_date_tag		= $("<div>").addClass("col-xs-4 col-md-2");
			var	col_end_date_tag		= $("<div>").addClass("col-xs-4 col-md-2");
			var	col_coment_tag			= $("<div>").addClass("hidden-xs hidden-sm col-md-4");
			var	col_remove_tag			= $("<div>").addClass("hidden-xs hidden-sm col-md-2 float_right");
			var	remove_button			= $("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover");

			var	input_start_date_tag	= $("<input>").addClass("transparent __start_date_" + item.id);
			var	input_end_date_tag		= $("<input>").addClass("transparent __end_date_" + item.id);
			var	input_comment_tag		= $("<input>").addClass("transparent");

			var	start_date, end_date, temp, temp_date;

			if(item.start_date.length)
			{
				temp_date = item.start_date.split('-');
				if(temp_date.length == 3)
				{
					temp = new Date(parseInt(temp_date[0]), parseInt(temp_date[1]) - 1, parseInt(temp_date[2]));
					start_date = system_calls.GetFormattedDateFromSeconds(temp.getTime()/1000, "DD/MM/YYYY");
				}
				else
				{
					console.error("fail with date format(" + item.start_date + ") must be YYYY-MM-DD");
				}
			}

			if(item.end_date.length)
			{
				temp_date = item.end_date.split('-');
				if(temp_date.length == 3)
				{
					temp = new Date(parseInt(temp_date[0]), parseInt(temp_date[1]) - 1, parseInt(temp_date[2]));
					end_date = system_calls.GetFormattedDateFromSeconds(temp.getTime()/1000, "DD/MM/YYYY");
				}
				else
				{
					console.error("fail with date format(" + item.end_date + ") must be YYYY-MM-DD");
				}
			}


			input_start_date_tag
				.attr("data-script", "subcontractor.cgi")
				.attr("data-action", "AJAX_updateAbsenceStartDate")
				.attr("data-id", item.id)
				.attr("data-db_value", start_date)
				.val(start_date)
				.datepicker({
					dateFormat: DATE_FORMAT_GLOBAL,
					maxDate: end_date,

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
				.on("change", system_calls.UpdateInputFieldOnServer)
		        .on("change", function() {
			          $(".__end_date_" + item.id).datepicker( "option", "minDate", $(this).val() );
		        });


			input_end_date_tag
				.attr("data-script", "subcontractor.cgi")
				.attr("data-action", "AJAX_updateAbsenceEndDate")
				.attr("data-id", item.id)
				.attr("data-db_value", end_date)
				.val(end_date)
				.datepicker({
				    dateFormat: DATE_FORMAT_GLOBAL,
				    minDate: start_date,

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
				.on("change", system_calls.UpdateInputFieldOnServer)
		        .on("change", function() {
			          $(".__start_date_" + item.id).datepicker( "option", "maxDate", $(this).val() );
		        });


			input_comment_tag
				.attr("data-script", "subcontractor.cgi")
				.attr("data-action", "AJAX_updateAbsenceComment")
				.attr("data-id", item.id)
				.attr("data-db_value", item.comment)
				.on("change", system_calls.UpdateInputFieldOnServer)
				.val(system_calls.ConvertHTMLToText(item.comment));

			remove_button.on("click", function()
								{
									$("#AreYouSure #Remove").data("id", item.id);
									$("#AreYouSure #Remove").data("action", "AJAX_deleteAbsence");
									$("#AreYouSure #Remove").data("script", "subcontractor.cgi");
									$("#AreYouSure").modal("show");
								});


			col_title_tag			.append(item.absence_types[0].title);
			col_start_date_tag		.append(input_start_date_tag)			.append($("<label>"));
			col_end_date_tag		.append(input_end_date_tag)				.append($("<label>"));
			col_coment_tag			.append(input_comment_tag)				.append($("<label>"));
			col_remove_tag			.append(remove_button);

			row_tag
				.append(col_title_tag)
				.append(col_start_date_tag)
				.append(col_end_date_tag)
				.append(col_coment_tag)
				.append(col_remove_tag);

			result = result.add(row_tag);
		});

		return result;
	};

	var	RenderAbsenceList = function(absences)
	{
		$("#absence_list").empty().append(RenderAbsenceList_GetDOM(absences));
	};

	var	ResetNewAbsence = function()
	{
		$(".new_absence_start_date")
			.val("")
			.datepicker( "option", "minDate", "" )
			.datepicker( "option", "maxDate", "" );
		$(".new_absence_end_date")
			.val("")
			.datepicker( "option", "minDate", "" )
			.datepicker( "option", "maxDate", "" );
		$(".new_absence_comment").val("");
	};

	var	NewAbsenceSubmit_ClickHandler = function(e)
	{
		var	curr_tag = $(this);

		if(NewAbsenceSubmit_CheckValidity())
		{
			curr_tag.button("loading");

			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					action: "AJAX_submitNewAbsence",
					type_id: $(".new_absence_type").val(),
					start_date: $(".new_absence_start_date").val(),
					end_date: $(".new_absence_end_date").val(),
					comment: $(".new_absence_comment").val(),
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#collapsible_absence_list").collapse("hide");
						ResetNewAbsence();
						RenderAbsenceList(data.absences);
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
					setTimeout(function() {
						curr_tag.button("reset");
					}, 200);
				});
		}
	};

	var	AreYouSureRemoveHandler = function() {
		var		curr_tag = $(this);
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if(typeof(affectedScript) == "undefined") affectedScript = "";
		if(!affectedScript.length) affectedScript = "index.cgi";

		$.getJSON('/cgi-bin/' + affectedScript + '?action=' + affectedAction, {id: affectedID})
			.done(function(data) {
				if(data.result === "success")
				{
					// --- update GUI has to be inside getJSON->done->if(success).
					// --- To improve User Expirience (react on user actions immediately)
					// ---	 I'm updating GUI immediately after click, not waiting server response
					if((affectedAction == "AJAX_deleteAbsence") && affectedID)		$(".row.__absence_" + affectedID).hide(250);
					$("#AreYouSure").modal('hide');
				}
				else
				{
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			});


	};


	return {
		Init: Init,
	};
})();
