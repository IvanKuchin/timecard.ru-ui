
var	subcontractor_timecard = subcontractor_timecard || {};

var	subcontractor_timecard = (function()
{
    'use strict';

    var	CONST_CHOOSE_CUSTOMER = "выберите заказчика";
    var	CONST_CHOOSE_PROJECT = "выберите проект";
    var	CONST_CHOOSE_TASK = "выберите задачу";

	var	JSON_FindEventsList_Autocomplete = [];
	var JSON_MyEventsList;

	var	data_global;
	var	current_period_start_global = {"date":0, "month":0, "year":0};
	var	current_sow_global = "";

	var	dontResetInputFieldsFlag = false;		// --- variable used to keep input boxes (hour reporting) untouched after task selection

	var	Init = function()
	{
		SetInitialParamsFromURI();

		UpdateTimecardFromSOW(current_period_start_global);

		$("#addLineToTimeCard").on("click", AddRow_ClickHandler);
		$("#sowSelector").on("change", ChangeSOWSelect_ClickHandler);
		$("#copy_timecard_to_clipbuffer").on("click", CopyTimecardToClipbuffer_ClickHandler);
	};

	var	SetInitialParamsFromURI = function()
	{
		var		date = $.urlParam("date");
		var		month = $.urlParam("month");
		var		year = $.urlParam("year");
		var		sow_id = $.urlParam("sow_id");

		if(date.length && month.length && year.length && sow_id.length)
		{
			if(parseInt(date) && parseInt(month) && parseInt(year) && parseInt(sow_id))
			{
				current_period_start_global.date = parseInt(date);
				current_period_start_global.month = parseInt(month);
				current_period_start_global.year = parseInt(year);
				current_sow_global = "" + sow_id;
			}
			else
			{
				console.error("date format wrong or sow_id not a number");
			}
		}
	};

	var	AddPaceStepToDate = function(current_period_start, current_period_length)
	{
		var	result = {"date":0, "month":0, "year":0};
		var	start_date;

		if(current_period_length == "month")
		{
			start_date = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date);
			var	last_month_day = new Date(start_date.getFullYear(), start_date.getMonth() + 1, 0);

			result = {"date":last_month_day.getDate(), "month":last_month_day.getMonth() + 1, "year":last_month_day.getFullYear()};
		}
		else if(current_period_length == "week")
		{
			start_date = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date);
			// --- last_date have to be +6, _not_ +7
			var last_week_day = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate() + 6);

			result = {"date":last_week_day.getDate(), "month":last_week_day.getMonth() + 1, "year":last_week_day.getFullYear()};
		}
		else
		{
			console.error("current_period_length not defined");
		}

		return result;
	};

	var	GetReportingPaceFromSOW = function(sow_id, sow_arr)
	{
		var	result = "";

		sow_arr.forEach(function(item)
		{
			if(item.id == sow_id) result = item.timecard_period;
		});

		return	result;
	};

	var	GetTimecardBySoWID = function(sow_id, timecards)
	{
		var	result = {};

		timecards.forEach(function(item)
		{
			if(item.contract_sow_id == sow_id) result = item;
		});

		return	result;
	};

	var	GetDateRoundedToPeriod = function(current_period_start, current_period_length)
	{
		var		result;

		if(current_period_length == "month")
		{
			result = current_period_start;
			result.date = 1;
		}
		else if(current_period_length == "week")
		{
			var		temp_current_date = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date);
			var		rounded_date = new Date(temp_current_date.getFullYear(), temp_current_date.getMonth(), temp_current_date.getDate() - (temp_current_date.getDay() || 7) + 1);

			result = {};
			result.year = rounded_date.getFullYear();
			result.month = rounded_date.getMonth() + 1;
			result.date = rounded_date.getDate();
		}
		else
		{
			console.error("unknown period length");
		}

		return result;
	};

	var	RenderTimecardPeriod = function(current_period_start)
	{
		var		currTag = $("#timecard_title");

		var		current_period_length;
		var		current_period_finish;
		var		period_start, period_finish;
		var		left_arrow, right_arrow;
		var		status_span = $("<span>").attr("id", "timecard_status");

		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
		current_period_finish = AddPaceStepToDate(current_period_start, current_period_length);

		period_start = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date);
		period_finish = new Date(current_period_finish.year, current_period_finish.month - 1, current_period_finish.date);

		left_arrow = $("<i>")
							 .addClass("fa fa-angle-left")
							 .addClass("padding_sides_15 animateClass shadow_onhover")
							 .on("click", OneStepEarlierClickHandler);
		right_arrow = $("<i>")
							 .addClass("fa fa-angle-right")
							 .addClass("padding_sides_15 animateClass shadow_onhover")
							 .on("click", OneStepLaterClickHandler);

		currTag
				.empty()
				.append(left_arrow)
				.append(system_calls.GetFormattedDateFromSeconds(period_start.getTime() / 1000, "DD MMMM YYYY") + " г." + " - " + system_calls.GetFormattedDateFromSeconds(period_finish.getTime() / 1000, "DD MMMM YYYY") + " г.")
				.append(status_span)
				.append(right_arrow);
	};

	var	RenderTimecardStatus = function(timecard)
	{
		var		status_placeholder = $("#timecard_status");

		if(status_placeholder.length)
		{
			var		status_icon = $("<i>").addClass("fa margin_left_13");

			if(timecard.status == "approved")
			{
				status_icon	.addClass("fa-check-circle color_green")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "подтверждено");
			}
			if(timecard.status == "saved")
			{
				status_icon	.addClass("fa-floppy-o color_grey")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "сохранено");
			}
			if(timecard.status == "submit")
			{
				status_icon	.addClass("fa-clock-o color_orange")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "ожидает подтверждения");
			}
			if(timecard.status == "rejected")
			{
				status_icon	.addClass("fa-times color_red")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "отклонено");
			}

			status_icon.tooltip({ animation: "animated bounceIn"});

			status_placeholder.append(status_icon);
		}
	};

	var	SaveTimecard = function(event, status, tag)
	{
		var		timecard_status = GetTimecardStatusByID(GetTimecardID());

		if((timecard_status === "") || (timecard_status == "saved") || (timecard_status == "rejected"))
		{
			// --- save allowed only for "new", "saved" or "rejected" timecard statuses

			if(isAllCustomerProjectTaskFieldsEntered())
			{
				var	timecard_title_tag = $("#timecard_title");
				var	currTag = tag || $(this);
				var	timecard_body_tag = $("#timecardBody");
				var	current_period_start = current_period_start_global;
				var	current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
				var	current_period_finish = AddPaceStepToDate(current_period_start, current_period_length);
				var	cgiParams = {
									"action":"AJAX_saveMyTimecard",
								};
				var	line_order = 0;

				currTag.button("loading");

				cgiParams.timecard_id = GetTimecardID();
				cgiParams.status = status || "saved";
				cgiParams.sow_id = current_sow_global;
				cgiParams.current_period_start_year = current_period_start.year;
				cgiParams.current_period_start_month = current_period_start.month;
				cgiParams.current_period_start_date = current_period_start.date;
				cgiParams.current_period_finish_year = current_period_finish.year;
				cgiParams.current_period_finish_month = current_period_finish.month;
				cgiParams.current_period_finish_date = current_period_finish.date;

				timecard_body_tag.find("tr.time_entry").each(function()
					{
						var		currTag = $(this);

						var		customer = currTag.find(".customer").val();
						var		project = currTag.find(".project").val();
						var		task = currTag.find(".task").val();
						var		timereports = "";

						var		timereports_arr = [];

						currTag.find("input.day").each(function()
						{
							timereports_arr.push($(this).val());
						});

						timereports = timereports_arr.join();

						cgiParams["customer_" + line_order] = customer;
						cgiParams["project_" + line_order] = project;
						cgiParams["task_" + line_order] = task;
						cgiParams["timereports_" + line_order] = timereports;

						line_order += 1;
					});

				$.post('/cgi-bin/subcontractor.cgi?rand=' + Math.floor(Math.random() * 1000000000), cgiParams)
					.done(function(json_data)
					{
						try
						{
							var		data = JSON.parse(json_data);
							var		timecard_returned_from_server;

							if(data.result == "success")
							{
								setTimeout(function()
								{
									if(cgiParams.status == "submit")
									{
										data_global = data;
										RenderTimecardFromSOW(current_sow_global);

										timecard_returned_from_server = data_global.timecards[0];
										if	(
												(timecard_returned_from_server.status == "approved") &&
												(timecard_returned_from_server.invoice_filename.length)
											)
										{
											window.location.href = "/invoices_subc/" + timecard_returned_from_server.invoice_filename + "?rand=" + Math.random() * 76543245789;
										}
									}
								}, 550);  // --- 550 must be longer than .always timeout
							}
							else
							{
								console.error("AJAX_saveMyTimecard.done(): ERROR: " + data.description);
								system_calls.PopoverError(currTag, "Ошибка: " + data.description);
							}
						}
						catch(e)
						{

						}
					})
					.fail(function(data)
					{
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					})
					.always(function()
					{
						setTimeout(function()
						{
							currTag.button("reset");
						}, 500);
					});

			}
			else
			{
				// --- some fields are empty
			}
		}
		else
		{
			// --- not allowed to change "approved" or "submited" timecards
			callbackFunc();
		}
	};

	var	SubmitTimecard = function(event)
	{
		SaveTimecard(event, "submit", $(this));
	};

	var	OneStepEarlierClickHandler = function(e)
	{
		var		currTag = $(this);

		{
			var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
			var		periodDuration = -1 * GetPeriodDurationInDays(current_period_start_global, current_period_length);
			var		newDate;
			var		isValidPeriod = false;

			if(current_period_length == "month")
			{
				newDate = new Date(current_period_start_global.year, current_period_start_global.month - 1 - 1, 1);
				isValidPeriod = true;
			}
			else if(current_period_length == "week")
			{
				newDate = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date - 7);
				isValidPeriod = true;
			}
			else
			{
				console.error("period incorrectly defined");
			}

			if(isValidPeriod)
				UpdateTimecardFromSOW({year:newDate.getFullYear(), month:newDate.getMonth() + 1, date:newDate.getDate()});
		}

	};

	var	OneStepLaterClickHandler = function(e)
	{
		var		currTag = $(this);

		{
			var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
			var		newDate;
			var		isValidPeriod = false;

			if(current_period_length == "month")
			{
				newDate = new Date(current_period_start_global.year, current_period_start_global.month - 1 + 1, 1);
				isValidPeriod = true;
			}
			else if(current_period_length == "week")
			{
				newDate = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + 7);
				isValidPeriod = true;
			}
			else
			{
				console.error("period incorrectly defined");
			}

			if(isValidPeriod)
				UpdateTimecardFromSOW({year:newDate.getFullYear(), month:newDate.getMonth() + 1, date:newDate.getDate()});
		}

	};

	var	GetSingleTimecardRow = function(current_period_start, current_period_length, timecard_entry)
	{
		var		result = $();
		var		row = $("<tr>").addClass("time_entry");
		var		periodDuration = GetPeriodDurationInDays(current_period_start, current_period_length);
		var		i;
		var		closeButton;

		var		custCell = $("<td>");
		var		projCell = $("<td>");
		var		taskCell = $("<td>");
		var		timecard_reported_hours = [];
		var		task_active_day_counter;
		var		task_period_start, task_period_end;
		var		timecard_period_start = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date);
		var		timecard_period_end = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date + periodDuration - 1);
		var		isValidToDisplay = true;

		var		task_id;
		var		project_id;
		var		customer_id;

		var		tempRandom;

		do
		{ tempRandom = Math.round(Math.random() * 986545998765432345); }
		while($("tr[data-random='" + tempRandom + "']").length);

		row.attr("data-random", tempRandom);

		if(typeof(timecard_entry.row) != "undefined")
		{
			timecard_reported_hours = timecard_entry.row.split(",");
		}

		// --- if task is active on current timecard period
		if((typeof(timecard_entry.tasks) != "undefined") && timecard_entry.tasks.length)
		{
			var		temp_task_period_start = GetTaskPeriodStart(timecard_entry.tasks[0].id);
			var		temp_task_period_end  = GetTaskPeriodEnd(timecard_entry.tasks[0].id);

			task_period_start = new Date(parseInt(temp_task_period_start.year), parseInt(temp_task_period_start.month) - 1, parseInt(temp_task_period_start.date));
			task_period_end = new Date(parseInt(temp_task_period_end.year), parseInt(temp_task_period_end.month) - 1, parseInt(temp_task_period_end.date));

			if((task_period_start <= timecard_period_end) && (timecard_period_start <= task_period_end))
			{
			}
			else
			{
				isValidToDisplay = false;
			}
		}

		if(isValidToDisplay)
		{
			// --- this branch will be used:
			// --- 1) render existing task
			// --- 2) render empty task once "Add row" clicked (empty task)

			if(isSubcontractorAllowedToCreateTasksInCurrentSoW())
			{
				var		customer_input = $("<input>").addClass("transparent customer").attr("placeholder", "Заказчик").attr("id", "customer" + tempRandom).attr("data-random", tempRandom);
				var		project_input = $("<input>").addClass("transparent project").attr("placeholder", "Проект").attr("id", "project" + tempRandom).attr("data-random", tempRandom);
				var		task_input = $("<input>").addClass("transparent task").attr("placeholder", "Задача").attr("id", "task" + tempRandom).attr("data-random", tempRandom);

				task_id = typeof(timecard_entry.tasks) != "undefined" ? timecard_entry.tasks[0].id : "0";
				project_id = GetProjectIDByTaskID(task_id);
				customer_id = GetCustomerIDByProjectID(project_id);

				if(task_id != "0")
				{
					task_input.val(timecard_entry.tasks[0].title);
					project_input.val(timecard_entry.tasks[0].projects[0].title);
					customer_input.val(timecard_entry.tasks[0].projects[0].customers[0].title);
				}

				timecard_autocomplete.Init(data_global, current_sow_global, UpdateTimeRowEntriesDisableStatus);

				// --- if autocomplete functionality is not initialized from the beginning
				// --- it will not pop-up after configured threshold, it will wait one symbol more
				// --- to overcome this fake autocomplete initialization applied
				system_calls.CreateAutocompleteWithSelectCallback(customer_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Customer_SelectHandler);
				customer_input.on("input", timecard_autocomplete.Autocomplete_Customer_InputHandler)
							.on("input", HoursResetInput_InputHandler);

				// --- if autocomplete functionality is not initialized from the beginning
				// --- it will not pop-up after configured threshold, it will wait one symbol more
				// --- to overcome this fake autocomplete initialization applied
				system_calls.CreateAutocompleteWithSelectCallback(project_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Project_SelectHandler);
				project_input.on("input", timecard_autocomplete.Autocomplete_Project_InputHandler)
							.on("input", HoursResetInput_InputHandler);

				// --- if autocomplete functionality is not initialized from the beginning
				// --- it will not pop-up after configured threshold, it will wait one symbol more
				// --- to overcome this fake autocomplete initialization applied
				system_calls.CreateAutocompleteWithSelectCallback(task_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Task_SelectHandler);
				task_input.on("input", timecard_autocomplete.Autocomplete_Task_InputHandler)
							.on("input", HoursResetInput_InputHandler);

				custCell.append( customer_input )
						.append( $("<label>") );
				projCell.append( project_input )
						.append( $("<label>") );
				taskCell.append( task_input )
						.append( $("<label>") );
			}
			else
			{
				var		custSelectBox = $("<select>").on("change", CustomerSelect_ChangeHandler)
													 .addClass("transparent customer")
													 .attr("id", "customer" + tempRandom)
													 .attr("data-random", tempRandom);
				var		projSelectBox = $("<select>").on("change", ProjectSelect_ChangeHandler)
													 .addClass("transparent project")
													 .attr("id", "project" + tempRandom)
													 .attr("data-random", tempRandom);
				var		taskSelectBox = $("<select>").on("change", TaskSelect_ChangeHandler)
													 .addClass("transparent task")
													 .attr("id", "task" + tempRandom)
													 .attr("data-random", tempRandom);
				task_id = typeof(timecard_entry.tasks) != "undefined" ? timecard_entry.tasks[0].id : "0";
				project_id = GetProjectIDByTaskID(task_id);
				customer_id = GetCustomerIDByProjectID(project_id);

				custSelectBox.append(GetCustomersList(customer_id, project_id, task_id));
				projSelectBox.append(GetProjectsList(customer_id, project_id, task_id));
				taskSelectBox.append(GetTasksList(customer_id, project_id, task_id));

				custCell.append(custSelectBox);
				projCell.append(projSelectBox);
				taskCell.append(taskSelectBox);
			}

			row.append(custCell);
			row.append(projCell);
			row.append(taskCell);

			for(i = 0, task_active_day_counter = 0; i < periodDuration; i++)
			{
				var		temp_date = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date + i);
				var		day_hours = "";
				var		input_tag;
				var		disable_flag = false;

				if((typeof(task_period_start) != "undefined") && (typeof(task_period_start) != "undefined"))
				{
					if((task_period_start <= temp_date) && (temp_date <= task_period_end))
					{
						day_hours = timecard_reported_hours[i];
						if(parseFloat(day_hours) === 0) day_hours = "";
						++task_active_day_counter;
					}
					else
					{
						disable_flag = true;
					}
				}

				input_tag = $("<input>")
											.addClass("transparent")
											.addClass("text_align_center")
											.addClass("day" + i)
											.addClass("day")
											.attr("type", "number")
											.attr("min", "0")
											.attr("placeholder", "")
											.attr("value", day_hours)
											.on("input", InputHours_InputHandler)
											.on("change", InputHours_ChangeHandler)
											.on("paste", PasteTimecardFromClipbuffer_ClickHandler);
				if(disable_flag) input_tag.attr("disabled", "");

				row.append($("<td>")
									.addClass(system_calls.GetDayClass(temp_date, data_global.holiday_calendar))
									.append(input_tag)
									.append( $("<label>") )
							);
			}

			closeButton = $("<i>")
									.addClass("fa fa-times-circle padding_close")
									.on("click", function(e)
												{
													var		footTag = $("#timecardBody tfoot");

													$(this).parent().parent().remove();
													footTag.empty().append(GetTimecardFoot(current_period_start_global));
												});
			row.append($("<td>").append(closeButton));
			result = result.add(row);
		}

		return result;
	};

	var	InputHours_InputHandler = function(e)
	{
		$("#timecardBody tfoot").empty().append(GetTimecardFoot(current_period_start_global));
	};

	var	InputHours_ChangeHandler = function(e)
	{
		var		currTag = $(this);

		if(currTag.val().length)
			currTag.val(system_calls.RoundedTwoDigitSum(parseFloat(currTag.val()), 0));
	};

	var	GetTimecardHead = function(timecard)
	{
		if((typeof(timecard) == "undefined")) timecard = {};
		if(typeof(timecard.period_start) == "undefined") timecard.period_start = current_period_start_global.year + "-" + current_period_start_global.month + "-" + current_period_start_global.date;
		if(typeof(timecard.period_end) == "undefined")
		{
			var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
			var		periodDuration = GetPeriodDurationInDays(current_period_start_global, current_period_length);
			var		d1 = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + periodDuration - 1);

			timecard.period_end = d1.getFullYear() + "-" + (d1.getMonth() + 1) + "-" + d1.getDate();
		}

		return system_calls.GetTimecardHead(timecard, data_global.holiday_calendar);
	};

	var	GetTimecardBody = function(current_period_start, timecard)
	{
		var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
		var		result = $();

		if((typeof(timecard.lines) != "undefined") && timecard.lines.length)
		{
			timecard.lines.forEach(function(timecard_line)
			{
				result = result.add(GetSingleTimecardRow(current_period_start, current_period_length, timecard_line));
			});
		}
		else if(typeof(timecard.status) == "undefined")
		{
			data_global.sow.forEach(function(sow_item)
			{
				if(sow_item.id == current_sow_global)
				{
					sow_item.tasks.forEach(function(task)
					{
						var		tempEntry = {tasks:[task]};

						result = result.add(GetSingleTimecardRow(current_period_start, current_period_length, tempEntry));
					});
				}
			});
		}
		else
		{
			result = result.add(GetSingleTimecardRow(current_period_start, current_period_length, {}));
		}


		return result;
	};

	var	GetTimecardFoot = function(current_period_start)
	{
		var		result = $();
		var		row = $("<tr>");
		var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
		var		periodDuration = GetPeriodDurationInDays(current_period_start, current_period_length);
		var		i;
		var		total_hours = 0;

		row.append("<td></td>");
		row.append("<td></td>");
		row.append("<td>Сумма:</td>");
		for(i = 0; i < periodDuration; i++)
		{
			var		tempDate = new Date(current_period_start.year, current_period_start.month - 1, current_period_start.date + i);
			var		day_hours = 0;

			$("input.day" + i).each(function(index)
			{
				day_hours = Math.round((day_hours + parseFloat($(this).val() || 0)) * 100) / 100;
			});

			total_hours = Math.round((total_hours + day_hours) * 100) / 100;

			row
				.append($("<td>")
				.addClass("text_align_center")
				.addClass(system_calls.GetDayClass(tempDate, data_global.holiday_calendar))
				.addClass((day_hours == 8) ? "even_report" :
						  (day_hours  > 8) ? "over_report" : "")
				.append(day_hours || ""));
		}

		row.append($("<td>").addClass("total_hours text_align_center").append(total_hours));

		result = result.add(row);

		return result;
	};

	var	GetControlButtons_DOM = function(timecard)
	{
		var		result = $();

		var		save_col = $("<div>").addClass("col-xs-6 col-md-2 col-md-offset-8");
		var		submit_col = $("<div>").addClass("col-xs-6 col-md-2");

		var		save_button = $("<button>")
									.attr("id", "save_button")
									.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
									.addClass("btn btn-default form-control")
									.on("click", SaveTimecard)
									.append("Сохранить");
		var		submit_button = $("<button>")
									.attr("id", "submit_button")
									.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
									.addClass("btn btn-primary form-control")
									.on("click", SubmitTimecard)
									.append("Отправить");

		if((typeof(timecard) != "undefined") && (typeof(timecard.status) != "undefined"))
		{
			if((timecard.status == "approved") || (timecard.status == "submit"))
			{
				// --- disable control buttons
				save_button.attr("disabled", "");
				submit_button.attr("disabled", "");
			}
		}

		save_col.append(save_button);
		submit_col.append(submit_button);

		result = result.add(save_col);
		result = result.add(submit_col);

		return result;
	};

	var	GetPeriodDurationInDays = function(current_period_start, current_period_length)
	{
		var		result = 0;

		if(current_period_length == "week") result = 7;
		else if(current_period_length == "month")
		{
			var		period_start = new Date(current_period_start.year, (current_period_start.month-1) + 1, 0);
			result = period_start.getDate();
		}
		else
		{
			console.debug("period_length has wrong value");
		}

		return result;
	};

	var	RenderTimecardBody = function(current_period_start, timecard)
	{
		var		headTag = $("#timecardBody thead");
		var		bodyTag = $("#timecardBody tbody");
		var		footTag = $("#timecardBody tfoot");
		var		control_buttons = $("#control_buttons");
		var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
		var		periodDurationInDays = GetPeriodDurationInDays(current_period_start, current_period_length);
		var		result;

		SetTimecardID(timecard);

		// --- build head
		headTag.empty().append(GetTimecardHead(timecard));
		bodyTag.empty().append(GetTimecardBody(current_period_start, timecard));
		footTag.empty().append(GetTimecardFoot(current_period_start));
		control_buttons.empty().append(GetControlButtons_DOM(timecard));

		return result;
	};

	var	UpdateTimecardFromSOW = function(current_period_start)
	{
		var		currTag = $("#timecardBody");

		if(typeof(current_period_start.month) == "undefined")
		{
			console.error("period_start have not been initialized");
		}
		else
		{
			// data_global = {};

			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					"action":"AJAX_getMyTimecard",
				 	"period_start_date": current_period_start.date,
				 	"period_start_month": current_period_start.month,
				 	"period_start_year": current_period_start.year
				})
				.done(function(data) {
							if(data.result == "success")
							{
								var		current_sow = current_sow_global;

								if(current_sow.length && !isSOWValid(current_sow, data.sow))
								{
									current_sow = "";
									system_calls.PopoverInfo("sowSelector", "SoW поменялся ввиду неактивности");
								}

								// --- define timecard to display filled or empty
								if(current_sow === "")
								{
									if(data.timecards.length && isSOWValid(data.timecards[0].contract_sow_id, data.sow)) current_sow = data.timecards[0].contract_sow_id;
									else
									{
										var	candidate_sow_idx = FindActiveSoW(data.sow);

										if(candidate_sow_idx >= 0)  current_sow = data.sow[candidate_sow_idx].id;
										else
										{
											system_calls.PopoverError(currTag, "Нет активных SoW. Подпишите SoW c агенством.");
										}
									}
								}

								if(current_sow.length)
								{
									data_global = data;
									current_sow_global = current_sow;
									current_period_start_global = current_period_start;
									RenderTimecardFromSOW(current_sow);
								}
								else
								{
									system_calls.PopoverError(currTag, "Нет активных SoW. Подпишите SoW c агенством.");
								}
							}
							else
							{
								system_calls.PopoverError(currTag, "Ошибка: " + data.description);
							}

					})
				.fail(function(data) {
					setTimeout(function() {
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}, 500);
				});
		}
	};

	var	RenderSOWSelectBox = function(active_sow_id)
	{
		$("#sowSelector").empty().append(system_calls.GetSOWSelectBox(data_global, active_sow_id));
	};

	var	RenderTimecardFromSOW = function(sow_id)
	{
		if(typeof(sow_id) != "undefined")
		{
			var		current_period_length = GetReportingPaceFromSOW(sow_id, data_global.sow);


			// --- if date not defined define it as today() and then round to week/month
			if(current_period_start_global.year == "0")
			{
				var		today = new Date();
				current_period_start_global = {year:today.getFullYear(), month:today.getMonth() + 1, date:today.getDate()};
			}

			current_period_start_global = GetDateRoundedToPeriod(current_period_start_global, current_period_length);

			// --- DON"T join it via "else", first condition used as initializer
			if(sow_id.length)
			{
				var		timecard = GetTimecardBySoWID(sow_id, data_global.timecards);

				RenderTimecardPeriod(current_period_start_global);
				RenderTimecardBody(current_period_start_global, timecard);
				RenderSOWSelectBox(sow_id);
				RenderTimecardStatus(timecard);
			}
			else
			{
				console.error("ERROR: timecards[] and sow[] are empty");
				system_calls.PopoverError("timecardBody", "Ошибка ответа сервера (timecards and sow are empty)");
			}
		}
		else
		{
			console.error("ERROR: sow_id is empty");
		}
	};

	var	AddRow_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		bodyTag = $("#timecardBody tbody");

		bodyTag.append(GetTimecardBody(current_period_start_global, {status:"add_single_line"}));

	};

	var	isSubcontractorAllowedToCreateTasksInCurrentSoW = function()
	{
		var	result = false;

		data_global.sow.forEach(function(item)
		{
			if((item.id == current_sow_global) && (item.subcontractor_create_tasks == "Y")) result = true;
		});

		return result;
	};

	var	GetCustomersList = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_CUSTOMER));

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				var		current_period_length = sow.timecard_period;
				var		periodDurationInDays = GetPeriodDurationInDays(current_period_start_global, current_period_length);
				var		timecard_period_start = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date);
				var		timecard_period_end = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + periodDurationInDays);

				sow.tasks.forEach(function(task)
				{
					// --- hide, if task_period doesn't overlap with timecard_period
					var		task_period_start_obj = GetTaskPeriodStart(task.id);
					var		task_period_end_obj = GetTaskPeriodEnd(task.id);
					var		task_period_start = new Date(task_period_start_obj.year, task_period_start_obj.month - 1, task_period_start_obj.date);
					var		task_period_end = new Date(task_period_end_obj.year, task_period_end_obj.month - 1, task_period_end_obj.date);

					if((task_period_start <= timecard_period_end) && (task_period_end >= timecard_period_start))
					{
						// --- task and timecard overlaps

						task.projects.forEach(function(project)
						{
								project.customers.forEach(function(customer)
								{
									var		customerOption = $("<option>")	.append(customer.title)
																			.attr("data-id", customer.id);

									if(system_calls.isIDInTheJQueryList(customer.id, result))
									{}
									else
									{
										if((task.id == activeTaskID) || (project.id == activeProjectID) || (customer.id == activeCustomerID))
											customerOption.attr("selected", "");
										result = result.add(customerOption);
									}
								});
						});
					}
					else
					{
						// --- task should not be displayed
					}
				});
			}
		});

		return result;
	};

	var	GetProjectsList = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_PROJECT));

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				var		current_period_length = sow.timecard_period;
				var		periodDurationInDays = GetPeriodDurationInDays(current_period_start_global, current_period_length);
				var		timecard_period_start = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date);
				var		timecard_period_end = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + periodDurationInDays);

				sow.tasks.forEach(function(task)
				{
					// --- hide, if task_period doesn't overlap with timecard_period
					var		task_period_start_obj = GetTaskPeriodStart(task.id);
					var		task_period_end_obj = GetTaskPeriodEnd(task.id);
					var		task_period_start = new Date(task_period_start_obj.year, task_period_start_obj.month - 1, task_period_start_obj.date);
					var		task_period_end = new Date(task_period_end_obj.year, task_period_end_obj.month - 1, task_period_end_obj.date);

					if((task_period_start <= timecard_period_end) && (task_period_end >= timecard_period_start))
					{
						// --- task and timecard overlaps

						task.projects.forEach(function(project)
						{
							var		isDisplayed = false;
							var		projectOption = $("<option>")	.append(project.title)
																	.attr("data-id", project.id);

							project.customers.forEach(function(customer)
							{
								if((customer.id == activeCustomerID) || (activeCustomerID == "0")) isDisplayed = true;
							});

							if(isDisplayed)
							{
								if(system_calls.isIDInTheJQueryList(project.id, result))
								{}
								else
								{
									if((task.id == activeTaskID) || (project.id == activeProjectID)) projectOption.attr("selected", "");
									result = result.add(projectOption);
								}
							}
						});
					}
				});
			}
		});

		return result;
	};

	var	GetTasksList = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_TASK));

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				var		current_period_length = sow.timecard_period;
				var		periodDurationInDays = GetPeriodDurationInDays(current_period_start_global, current_period_length);
				var		timecard_period_start = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date);
				var		timecard_period_end = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + periodDurationInDays);

				sow.tasks.forEach(function(task)
				{
					var		isDisplayed = true;
					var		taskOption = $("<option>")	.append(task.title)
														.attr("data-id", task.id);

					// --- hide, if task_period doesn't overlap with timecard_period
					var		task_period_start_obj = GetTaskPeriodStart(task.id);
					var		task_period_end_obj = GetTaskPeriodEnd(task.id);
					var		task_period_start = new Date(task_period_start_obj.year, task_period_start_obj.month - 1, task_period_start_obj.date);
					var		task_period_end = new Date(task_period_end_obj.year, task_period_end_obj.month - 1, task_period_end_obj.date);

					if((task_period_start <= timecard_period_end) && (task_period_end >= timecard_period_start))
					{
						// --- task and timecard overlaps
						task.projects.forEach(function(project)
						{

							project.customers.forEach(function(customer)
							{
								if((customer.id == activeCustomerID) || (activeCustomerID == "0")) isDisplayed &= true;
								else isDisplayed &= false;
							});

							if((project.id == activeProjectID) || (activeProjectID == "0")) isDisplayed &= true;
							else isDisplayed &= false;
						});
					}
					else
					{
						isDisplayed = false;
					}

					if(isDisplayed)
					{
						if(system_calls.isIDInTheJQueryList(task.id, result)) {}
						else
						{
							if(task.id == activeTaskID) taskOption.attr("selected", "");
							result = result.add(taskOption);
						}
					}
				});
			}
		});

		return result;
	};

	var	CustomerSelect_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		custID = $("select.customer[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";

		custSelectBox.empty().append(GetCustomersList(custID, "0", "0"));
		projSelectBox.empty().append(GetProjectsList(custID, "0", "0"));
		taskSelectBox.empty().append(GetTasksList(custID, "0", "0"));
	};

	var	ProjectSelect_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		projectID = $("select.project[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";
		var		customerID = GetCustomerIDByProjectID(projectID);

		custSelectBox.empty().append(GetCustomersList(customerID, projectID, "0"));
		projSelectBox.empty().append(GetProjectsList(customerID, projectID, "0"));
		taskSelectBox.empty().append(GetTasksList(customerID, projectID, "0"));
	};

	var	TaskSelect_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		taskID = $("select.task[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";
		var		projectID = GetProjectIDByTaskID(taskID);
		var		customerID = GetCustomerIDByProjectID(projectID);

		custSelectBox.empty().append(GetCustomersList(customerID, projectID, taskID));
		projSelectBox.empty().append(GetProjectsList(customerID, projectID, taskID));
		taskSelectBox.empty().append(GetTasksList(customerID, projectID, taskID));

		UpdateTimeRowEntriesDisableStatus(row_random_id, taskID);
	};

	var	UpdateTimeRowEntriesDisableStatus = function(row_random_id, task_id)
	{
		if(parseInt(task_id))
		{
			var		current_period_length = GetReportingPaceFromSOW(current_sow_global, data_global.sow);
			var		periodDurationInDays = GetPeriodDurationInDays(current_period_start_global, current_period_length);

			var		task_period_start_obj = GetTaskPeriodStart(task_id);
			var		task_period_end_obj = GetTaskPeriodEnd(task_id);
			var		task_period_start = new Date(task_period_start_obj.year, task_period_start_obj.month - 1, task_period_start_obj.date);
			var		task_period_end = new Date(task_period_end_obj.year, task_period_end_obj.month - 1, task_period_end_obj.date);

			for(var i = 0, task_active_day_counter = 0; i < periodDurationInDays; i++)
			{
				var		temp_date = new Date(current_period_start_global.year, current_period_start_global.month - 1, current_period_start_global.date + i);
				var		day_hours = "";
				var		input_tag = $("tr[data-random=\"" + row_random_id + "\"] input.day" + i);
				var		disable_flag = false;

				if((typeof(task_period_start) != "undefined") && (typeof(task_period_start) != "undefined"))
				{
					if((task_period_start <= temp_date) && (temp_date <= task_period_end))
					{
					}
					else
					{
						disable_flag = true;
					}
				}

				if(disable_flag) input_tag.attr("disabled", "");
				else input_tag.removeAttr("disabled");

				input_tag.val("");
			}
		}
		else
		{
			ResetHourFields(row_random_id);
		}

		return $("#timecardBody tfoot").empty().append(GetTimecardFoot(current_period_start_global));
	};

	var ResetHourFields = function(random_id)
	{
		$("tr[data-random=\"" + random_id + "\"] input.day")
			.removeAttr("disabled")
			.val("");
	};

	var	GetProjectIDByTaskID = function(activeTaskID)
	{
		var		result = "0";

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.tasks.forEach(function(task)
				{
					if(task.id == activeTaskID) result = task.projects[0].id;
				});
			}
		});

		return result;
	};

	var	GetCustomerIDByProjectID = function(activeProjectID)
	{
		var		result = "0";

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.tasks.forEach(function(task)
				{
					task.projects.forEach(function(project)
					{
						if(project.id == activeProjectID) result = project.customers[0].id;
					});
				});
			}
		});

		return result;
	};

	var	GetTaskPeriodStart = function(task_id)
	{
		var	result = {"date":0, "month":0, "year":0};

		data_global.task_assignments.forEach(function(task_assignment)
		{
			if((task_assignment.timecard_tasks_id == task_id) && (task_assignment.contract_sow_id == current_sow_global))
			{
				var		date_arr = task_assignment.period_start.split("-");

				if(date_arr.length == 3)
				{
					result.year = date_arr[0];
					result.month = date_arr[1];
					result.date = date_arr[2];
				}
				else
				{
					console.error("date parsing error (" + task_assignment.period_start + "), date must be in format YYYY-MM-DD");
				}
			}
		});

		return result;
	};

	var	GetTaskPeriodEnd = function(task_id)
	{
		var	result = {"date":0, "month":0, "year":0};

		data_global.task_assignments.forEach(function(task_assignment)
		{
			if((task_assignment.timecard_tasks_id == task_id) && (task_assignment.contract_sow_id == current_sow_global))
			{
				var		date_arr = task_assignment.period_end.split("-");

				if(date_arr.length == 3)
				{
					result.year = date_arr[0];
					result.month = date_arr[1];
					result.date = date_arr[2];
				}
				else
				{
					console.error("date parsing error (" + task_assignment.period_end + "), date must be in format YYYY-MM-DD");
				}
			}
		});

		return result;
	};

	var	ChangeSOWSelect_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		currTagID = currTag.attr("id");
		var		current_sow = $("select#" + currTagID + " option:selected").data("id");

		current_sow_global = "" + current_sow;

		UpdateTimecardFromSOW(current_period_start_global);
	};

	var	isSOWValid = function(current_sow, sow_array)
	{
		var		result = false;

		if(current_sow && current_sow.length)
		{
			if((typeof(sow_array) != "undefined") && sow_array.length)
			{
				sow_array.forEach(function(item)
				{
					// --- this branch will mark SoW "valid" if it is "active"
					// --- or "expired" month ago
					if(
						(item.id == current_sow) && 
						(
							(item.status == "signed") ||
							((item.status == "expired") && (system_calls.isDateInFutureOrMonthAgo(item.end_date)))
						)
					) result = true;

					// --- all SoW considered "active" if returned from the server
					// if((item.id == current_sow)) result = true;
				});
			}
		}

		return result;
	};

	var	FindActiveSoW = function(sow_array)
	{
		var	sow_idx = -1; // --- init with incorrect index

		if((typeof(sow_array) != "undefined") && sow_array.length)
		{
			for (var i = sow_array.length - 1; i >= 0; i--)
			{
				if(isSOWValid(sow_array[i].id, sow_array))
				{
					sow_idx = i;
					break;
				}
			};
		}

		return sow_idx;
	};

	var	GetTimecardID = function()
	{
		var		result = "0";

		result = $("#timecardBody").data("timecard_id");

		return result;
	};

	var	SetTimecardID = function(timecard)
	{
		var		timecard_id = "0";

		if((typeof(timecard) != "undefined") && (typeof(timecard.id) != "undefined")) timecard_id = timecard.id;

		$("#timecardBody").removeData().attr("data-timecard_id", timecard_id);

	};

	var	GetTimecardStatusByID = function(timecard_id)
	{
		var		result = "";

		data_global.timecards.forEach(function(timecard)
			{
				if(timecard.id == timecard_id) result = timecard.status;
			});

		return result;
	};

	var	isAllCustomerProjectTaskFieldsEntered = function()
	{
		var	result = true;

		$("input.customer, input.project, input.task, select.customer, select.project, select.task").each(function()
			{
				var		currTag = $(this);

				if((currTag.val() === "") || (currTag.val().search("ыберите") > -1))
				{
					result = false;
					system_calls.PopoverError(currTag, "Необходимо заполнить");
				}
			});

		return result;
	};

	var	HoursResetInput_InputHandler = function()
	{
		var		currentTag = $(this);
		var		random_id = currentTag.data("random");

		if(dontResetInputFieldsFlag) {}
		else ResetHourFields(random_id);
	};


	var	CopyTimecardToClipbuffer_ClickHandler = function(e)
	{
		var	curr_tag	= $(this);
		var	table_body	= $("#timecardBody > tbody");
		var	lines		= [];

		table_body.find("tr").each(function()
		{
			var	tr_tag		= $(this);
			var line		= [tr_tag.find(".customer").val(), tr_tag.find(".project").val(), tr_tag.find(".task").val()];

			tr_tag.find(".day").each(function()
			{
				var	day_tag	= $(this).val();
				line.push(day_tag);

			});

			lines.push(line.join("\t"));
		});

		navigator.clipboard.writeText(lines.join("\n")).then(function() {
		    system_calls.PopoverInfo(curr_tag, 'copied to clipbuffer');
		  }, function(err) {
		    system_calls.PopoverInfo(curr_tag, 'ERROR' + err);
		  });
  	};

	var	PasteTimecardFromClipbuffer_ClickHandler = function(e)
	{
		var	curr_tag	= $(this);

		if(curr_tag.hasClass("day") && (curr_tag.prop("tagName").toLowerCase() == "input"))
		{
			// --- paste from Excel

			var	reference_day_class	= curr_tag.attr("class");

			var	timecard_line_tag	= curr_tag.closest("tr");

			var paste				= (event.clipboardData || window.clipboardData).getData('text');
			paste					= paste.replace(/\n$/, "");

			var	lines				= paste.split(/\n/);

			const selection = window.getSelection();
			if (!selection.rangeCount) {}
			else
			{
				selection.deleteFromDocument();
			}


			lines.forEach(function(line)
			{

				line		= line.replace(/\r$/, "");
				var	days	= line.split(/\t/);
				var	td_tag	= timecard_line_tag.find("[class=\"" + reference_day_class + "\"]").closest("td");

				days.forEach(function(day)
				{
					var	input_tag = td_tag.find("input.day");
					if(input_tag.length && parseFloat(day)) input_tag.val(day);
					td_tag = td_tag.next();					
				});

				timecard_line_tag = timecard_line_tag.next();
			});

			InputHours_InputHandler();

			event.preventDefault();
		}
	};

	return {
		Init: Init,
	};

})();
