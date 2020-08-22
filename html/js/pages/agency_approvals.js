
var	agency_approvals = agency_approvals || {};

var	agency_approvals = (function()
{
	'use strict';

	var	data_global;

	var	Init = function()
	{
		UpdateTimecardList();

		$(".filter").on("click", Filter_ClickHandler);
	};

	var	UpdateTimecardList = function(current_period_start)
	{
		var		currTag = $("#timecard_list_title");


		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_getApprovalsList",
				object: "timecard",
				filter: "submit"
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderApprovalsList("my_only");
				}
				else
				{
					console.error("AJAX_getApprovalsList.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});
	};

	var	ControlButton_ClickHandler = function(currTag, timecard)
	{
		var		result = true;
		var		action = currTag.data("action");
		var		link = "/cgi-bin/agency.cgi?action=AJAX_" + action + "Timecard&rand=" + (Math.random() * 4876234923498);
		var		date_arr = timecard.period_start.split("-");
		var		year = parseInt(date_arr[0]);
		var		month = parseInt(date_arr[1]);
		var		date = parseInt(date_arr[2]);
		var		timecard_id = parseInt(timecard.id);
		var		comment = $("#input_comment_reject_" + timecard_id).val();

		if(year && month && date && timecard_id)
		{

			if((action == "reject") && ($("#input_comment_reject_" + timecard_id).val() === ""))
			{
				system_calls.PopoverError(currTag, "Необходимо обосновать отказ");
			}
			else
			{
				currTag.button("loading");

				$.getJSON(
					link,
					{
						timecard_id: timecard_id,
						year: year,
						month: month,
						date: date,
						comment: comment
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							data_global = data;
							$("#collapsible_timecard_" + timecard_id).collapse("hide");

							setTimeout(function(e)
							{
								RenderApprovalsList("my_only");
							}, 300);
						}
						else
						{
							console.error("ERROR: " + data.description);
							system_calls.PopoverError(currTag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						console.error("ERROR parsing server response to JSON-object");
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					})
					.always(function(e)
					{
						setTimeout(function() {
							currTag.button("reset");
						}, 500);
					});
			}
		}
		else
		{
			console.error("ERROR: timecard date or id is empty");
			system_calls.PopoverError(currTag, "Ошибка: невозможно определить данные таймкарты");
		}

		return result;
	};

	// --- filter:
	//				my_only (default)	- only my approvals displayed
	//				all					- all approvals
	var	RenderApprovalsList = function(filter)
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined")&& (typeof(data_global.timecards) != "undefined"))
		{
			var		container = $();

			for(var i = 0; i < data_global.sow.length; ++i)
			{
				var		timecard_list = GetTimecardListDOM(data_global.timecards, data_global.sow[i].id, filter, data_global.holiday_calendar);

				if(timecard_list.length)
				{
					container = container
									.add(common_timecard.GetSoWTitleRow(data_global.sow[i], false, true))
									.add(timecard_list);
				}
			}

			$("#timecard_list").empty().append(container);
		}
		else
		{
			console.error("ERROR: sow list or timecard list is empty");
		}
	};

	// --- wrapper to add holiday_calendar 
	var	__TimecardCollapsible_ClickHandler = function(e)
	{
		return common_timecard.TimecardCollapsible_ClickHandler(e, data_global.holiday_calendar);
	};

	var	GetTimecardListDOM = function(timecard_list, sow_id, filter)
	{
		var		result = $();

		if((typeof(timecard_list) == "undefined"))
		{
			console.error("timecard_list is undefined");
		}
		else
		{
			var		timeFormat = 'MM/DD/YYYY HH:mm';
			var		timecards_belongs_to_sow = [];

			timecard_list.forEach(function(item)
			{
				if(item.contract_sow_id == sow_id) timecards_belongs_to_sow.push(item);
			});

			timecards_belongs_to_sow.sort(function(a, b)
			{
				var		arrA = a.period_start.split(/\-/);
				var		arrB = b.period_start.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});


			timecards_belongs_to_sow.forEach(function(timecard_item)
				{
					var		should_i_act_on_timecard = system_calls.shouldIActOnObject(timecard_item);
					var		good_to_show = false;

					if((filter == "my_only") && should_i_act_on_timecard) good_to_show = true;
					else if(filter == "all") good_to_show = true;

					if(good_to_show)
					{
						if(timecard_item.period_start.length && timecard_item.period_end.length)
						{
							var		visible_row = $("<div>").addClass("row highlight_onhover");
							var		collapsible_row = $("<div>").addClass("row")
																.addClass("collapse out sow")
																.attr("id", "collapsible_timecard_" + timecard_item.id);
							var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
							var		timeinterval_col = $("<div>").addClass("col-xs-10 col-md-2");
							var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-3");
							var		title =  $("<span>")
												.addClass("link timecard_title")
												.append(system_calls.ConvertDateSQLToHuman(timecard_item.period_start) + " - " + system_calls.ConvertDateSQLToHuman(timecard_item.period_end))
												.attr("id", "timecard_title_" + timecard_item.id)
		 										.attr("data-toggle", "collapse")
		 										.attr("data-target", "#collapsible_timecard_" + timecard_item.id)
		 										.attr("data-timecard_id", timecard_item.id)
		 										.attr("data-script", "agency.cgi")
		 										.on("click", __TimecardCollapsible_ClickHandler);
							var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
																.append("<p></p>");
							var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
																.append("<p></p>");

							var		collapsible_content_col = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_timecard_" + timecard_item.id + "_content");
							var		collapsible_nested_row_buttons = $("<div>").addClass("row");
							var		collapsible_nested_col_button_approve = $("<div>").addClass("col-xs-6 col-md-2 form-group");
							var		collapsible_nested_col_button_reject  = $("<div>").addClass("col-xs-6 col-md-2 form-group");
							var		collapsible_nested_row_comment = $("<div>").addClass("row");
							var		collapsible_nested_col_comment_reject  = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-2  col-md-offset-2 form-group");
							var		collapsible_nested_row_timecard = $("<div>").addClass("row");
							var		collapsible_nested_col_timecard = $("<div>") .addClass("col-xs-12");
							var		collapsible_nested_row_info = $("<div>").addClass("row");
							var		collapsible_nested_col_info = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_timecard_" + timecard_item.id + "_info");

							var		button_control_timecard_approve = $("<button>")
																	.attr("id", "button_approve_timecard_" + timecard_item.id)
																	.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
																	.attr("data-action", "approve")
																	.attr("data-timecard_id", timecard_item.id)
																	.addClass("btn btn-success form-control __controll_button_" + timecard_item.id)
																	.append("OK")
																	.on("click", function(e)
																		{
																			return ControlButton_ClickHandler($(this), timecard_item);
																		});
							var		button_control_timecard_reject = $("<button>")
																	.attr("id", "button_reject_timecard_" + timecard_item.id)
																	.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
																	.attr("data-action", "reject")
																	.attr("data-timecard_id", timecard_item.id)
																	.addClass("btn btn-danger form-control __controll_button_" + timecard_item.id)
																	.append("отклонить")
																	.on("click", function(e)
																		{
																			return ControlButton_ClickHandler($(this), timecard_item);
																		});

							var		input_comment_reject = $("<input>")
																	.attr("id", "input_comment_reject_" + timecard_item.id)
																	.addClass("form-control")
																	.attr("placeholder", "Коментарий");

							var		canvas = $("<canvas>").attr("data-id", timecard_item.id);
							var		datasets_arr = [];
							var		task_names_arr = [];
							var		status_icon = $("<i>").addClass("fa");
							var		actual_work_hours = system_calls.GetSumHoursFromTimecard(timecard_item);
							var		actual_work_days = system_calls.RoundedTwoDigitDiv(actual_work_hours, 8);

							if(timecard_item.status == "approved")
							{
								status_icon	.addClass("fa-check-circle color_green")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "подтверждено");
							}
							if(timecard_item.status == "saved")
							{
								status_icon	.addClass("fa-floppy-o color_grey")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "сохранено");
							}
							if(timecard_item.status == "submit")
							{
								status_icon	.addClass("fa-clock-o color_orange")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "ожидает подтверждения");
							}
							if(timecard_item.status == "rejected")
							{
								status_icon	.addClass("fa-times color_red")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "отклонено");
							}

							// --- Render approve/reject buttons to correct (active/disable) state
							if(should_i_act_on_timecard)
							{
							}
							else
							{
								button_control_timecard_approve.attr("disabled", "");
								button_control_timecard_reject.attr("disabled", "");
							}

							// --- initial DOM. It would be changed after user click collapse.
							collapsible_content_col
								.append(collapsible_nested_row_timecard.append(collapsible_nested_col_timecard))
								.append(collapsible_nested_row_buttons.append(collapsible_nested_col_button_approve).append(collapsible_nested_col_button_reject))
								.append(collapsible_nested_row_comment.append(collapsible_nested_col_comment_reject))
								.append(collapsible_nested_row_info.append(collapsible_nested_col_info));

							collapsible_nested_col_button_approve.append(button_control_timecard_approve);
							collapsible_nested_col_button_reject.append(button_control_timecard_reject);
							collapsible_nested_col_comment_reject.append(input_comment_reject);

							collapsible_nested_col_info
								.append(system_calls.GetHoursStatistics_DOM(timecard_item, undefined, data_global.holiday_calendar))
								.append(system_calls.GetApprovedDate_DOM(timecard_item))
								.append(system_calls.GetPayedDate_DOM(timecard_item));

							collapsible_nested_col_timecard
								.append(system_calls.GetTextedTimecard_DOM(timecard_item, data_global.holiday_calendar));

							visible_row
								.append(status_div.append(status_icon))
								.append(timeinterval_col.append(title))
								.append(total_hours_col.append(actual_work_hours + " часов / " + actual_work_days + " дней"));

							collapsible_row
								.append(top_shadow_div)
								.append(collapsible_content_col)
								.append(bottom_shadow_div);

							result = result.add(visible_row);
							result = result.add(collapsible_row);

							status_icon.tooltip({ animation: "animated bounceIn"});

						}
						else
						{
							console.error("timecard(id: " + timecard_item.id + ") empty start_date or end_date");
						}
					}
				});
		}

		return result;
	};

	var	Filter_ClickHandler = function(e)
	{
		var		currTag = $(this);

		if($("button.filter.btn-primary")[0] != currTag[0])
		{
			$("button.filter.btn-primary").toggleClass("btn-primary", "btn-default");
			currTag.toggleClass("btn-primary", "btn-default");

			RenderApprovalsList(currTag.data("filter"));
		}
	};

	return {
		Init: Init
	};

})();
