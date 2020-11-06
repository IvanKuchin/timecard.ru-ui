
var	timecard_list = timecard_list || {};

var	timecard_list = (function()
{
	'use strict';

	var	user_type_global = "";
	var	global_holiday_calendar;

	var	globalPageCounter = 0; // --- used for transfer arg to function HandlerScrollToShow

	var	Init = function(user_type)
	{
		user_type_global = user_type;

		UpdateTimecardList("clear");

		$("#payed").on("click", Payed_ClickHandler);

		$("#RecallTimecardModal .btn.btn-danger").on("click", RecallTimecard_ClickHandler);

		// --- filters
		$(".__list_filters").on("click", list_filters.ClickHandler);
		$("[data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});

		// --- scroll handler
		$(window).on("scroll resize lookup", HandlerScrollToShow);
	};

	var	ShowPaginationLoading = function()
	{
		$("#scrollerToShow i").show();
	};

	var	HidePaginationLoading = function()
	{
		$("#scrollerToShow i").hide(200);
	};

	var	isPaginationIndicatorVisible = function()
	{
		return $("#scrollerToShow i").is(":visible");
	}

	var	UpdateTimecardList = function(clear_or_append)
	{
		var		currTag = $("#timecard_list_title");

		ShowPaginationLoading();

		$.getJSON(
			"/cgi-bin/" + user_type_global + ".cgi",
			{
				"action":"AJAX_getTimecardList",
				"page": globalPageCounter,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					if(global_holiday_calendar) 
					{
						// --- no need to update holiday calendar if it is already set
					}
					else
					{
						global_holiday_calendar = data.holiday_calendar;
					}

					RenderTimecardList(data.sow, data.timecards, clear_or_append);
					list_filters.ApplyFilterFromURL();

					HidePaginationLoading();
				}
				else
				{
					console.error("AJAX_getSoWList.done(): ERROR: " + data.description);
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

	var HandlerScrollToShow = function() 
	{
		var		windowPosition	= $(window).scrollTop();
		var		clientHeight	= document.documentElement.clientHeight;
		var		divPosition		= $("#scrollerToShow").position().top;

		if(((windowPosition + clientHeight) > divPosition) && (!isPaginationIndicatorVisible()))
		{
			// console.debug("HandlerScrollToShow: globalPageCounter = " + globalPageCounter);
			// --- AJAX get news_feed from the server 
			globalPageCounter += 1;

			UpdateTimecardList("append");
		}
	};

	// --- wrapper to add holiday_calendar 
	var	__TimecardCollapsible_ClickHandler = function(e)
	{
		return common_timecard.TimecardCollapsible_ClickHandler(e, global_holiday_calendar);
	};

	var	GetTimecardListDOM = function(timecard_list, sow)
	{
		var		result = $();

		if((typeof(timecard_list) == "undefined"))
		{
			console.error("timecard_list is undefined");
		}
		else
		{
			var		timeFormat = 'MM/DD/YYYY HH:mm';
			var		timecards_belongs_to_sow	= [];
			var		today						= new Date();
			var		today_night					= today.setHours(22, 0, 0, 0);
			var		sow_serv_payment_half_time	= 0.5 * sow.payment_period_service * 24 * 3600 * 1000;
			var		sow_bt_payment_half_time	= 0.5 * sow.payment_period_bt * 24 * 3600 * 1000;

			timecard_list.forEach(function(item)
			{
				if(item.contract_sow_id == sow.id) timecards_belongs_to_sow.push(item);
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


			timecards_belongs_to_sow.forEach(function(item)
				{
					if(item.period_start.length && item.period_end.length)
					{
						var		visible_row = $("<div>").addClass("row highlight_onhover");
						var		collapsible_row = $("<div>").addClass("row")
															.addClass("collapse out sow")
															.attr("id", "collapsible_timecard_" + item.id);
						var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
						var		timeinterval_col = $("<div>").addClass("col-xs-8 col-md-4");
						var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-6");
						var		download_col = $("<div>").addClass("col-xs-2 col-md-1");
						var		title =  $("<span>")
											.addClass("link timecard_title")
											.append(system_calls.ConvertDateSQLToHuman(item.period_start) + " - " + system_calls.ConvertDateSQLToHuman(item.period_end))
											.attr("id", "timecard_title_" + item.id)
	 										.attr("data-toggle", "collapse")
	 										.attr("data-target", "#collapsible_timecard_" + item.id)
	 										.attr("data-timecard_id", item.id)
	 										.attr("data-script", user_type_global + ".cgi")
	 										.on("click", __TimecardCollapsible_ClickHandler);
						var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
						var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");

						var		collapsible_content_col = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_timecard_" + item.id + "_content");
						var		collapsible_nested_row_button = $("<div>").addClass("row");
						var		collapsible_nested_col_button_1 = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-1 col-xs-offset-0 form-group");
						var		collapsible_nested_col_button_2 = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-1 col-xs-offset-0 form-group");
						var		collapsible_nested_row_info = $("<div>").addClass("row");
						var		collapsible_nested_col_info = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_timecard_" + item.id + "_info");

						var		collapsible_nested_row_control = $("<div>").addClass("row");
						var		collapsible_nested_col_control = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_timecard_" + item.id + "_control")
																	.attr("data-timecard_id", item.id);


						var		canvas					= $("<canvas>").attr("data-id", item.id);
						var		datasets_arr			= [];
						var		task_names_arr			= [];
						var		status_icon				= $("<i>").addClass("fa");
						var		payed_icon				= $("<i>").addClass("fa");
						var		payed_checkbox			= $();
						var		original_docs_delivery_icon = $();

						var		hours_statistics_obj	= system_calls.GetHoursStatistics(item, global_holiday_calendar);
						var		total_work_hours		= hours_statistics_obj.total_work_hours;
						var		actual_work_hours		= hours_statistics_obj.actual_work_hours;
						var		actual_work_days		= hours_statistics_obj.actual_work_days;

						var		download_tag			= $();

						var		button_goto_timecard = $("<a>");
						{
							var		date_arr = item.period_start.split("-");
							var		year = parseInt(date_arr[0]);
							var		month = parseInt(date_arr[1]);
							var		date = parseInt(date_arr[2]);
							var		sow_id = parseInt(item.contract_sow_id);
							var		link = "/cgi-bin/" + user_type_global + ".cgi?action=" + user_type_global + "_timecard_template" + "&sow_id=" + sow_id + "&year=" + year + "&month=" + month + "&date=" + date + "&rand=" + (Math.random() * 4876234923498);

							button_goto_timecard = $("<a>")
														.addClass("btn btn-primary form-control")
														.append("<i class=\"fa fa-pencil-square-o\" aria-hidden=\"true\"></i>")
														.attr("href", link)
														.attr("data-toggle", "tooltip")
														.attr("data-placement", "top")
														.attr("data-html", "true")
														.attr("title", "Редактировать")
														.tooltip({ animation: "animated bounceIn"})
														;
							if(year && month && date && sow_id) {}
							else
							{
								console.error("ERROR: невозможно определить данные таймкарты");
								system_calls.PopoverError($("#timecard_list_title"), "Ошибка: невозможно определить данные таймкарты");
							}
						}
						var		button_recall_timecard = $("<a>")
															.addClass("btn btn-danger form-control")
															.append("<i class=\"fa fa-times\" aria-hidden=\"true\"></i>")
															.attr("data-timecard_id", item.id)
															.attr("data-toggle", "tooltip")
															.attr("data-placement", "top")
															.attr("data-html", "true")
															.attr("title", "Отозвать")
															.on("click", RecallModalShow_ClickHandler)
															.tooltip({ animation: "animated bounceIn"})
															;

						// --- filter part
						var		filter_div = $("<div>").addClass("__filterable");
						if((parseInt(item.expected_pay_date) !== 0) && (parseInt(item.payed_date) === 0))
						{
							if		(today_night > parseInt(item.expected_pay_date) * 1000)								filter_div.addClass("__filter_expired");
							else if	(today_night > parseInt(item.expected_pay_date) * 1000 - sow_serv_payment_half_time)	filter_div.addClass("__filter_expire_in_half_decay");
						}

						if(item.invoice_filename.length)
						{
							download_tag = $("<a>")
												.attr("href", "/invoices_subc/" + item.invoice_filename + "?rand=" + Math.random() * 65456789087)
												.append($("<i>").addClass("fa fa-download"));
						}

						if(item.status == "approved")
						{
							status_icon	.addClass("fa-check-circle color_green")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", system_calls.GetApprovedDate_DOM(item).html());
						}
						if(item.status == "saved")
						{
							status_icon	.addClass("fa-floppy-o color_grey")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", system_calls.GetSavedDate_DOM(item).html());
						}
						if(item.status == "submit")
						{
							status_icon	.addClass("fa-clock-o color_orange")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", system_calls.GetSubmittedDate_DOM(item).html());
						}
						if(item.status == "rejected")
						{
							status_icon	.addClass("fa-times color_red")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", system_calls.GetRejectedDate_DOM(item).html());
						}

						if(parseInt(item.payed_date))
						{
							payed_icon	.addClass("fa-usd")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", system_calls.GetPayedDate_DOM(item).html())
										.tooltip({
												animation: "animated bounceIn",
											});
						}
						else if((user_type_global == "agency") && (item.status == "approved"))
						{
							payed_checkbox = $("<input>")
										.attr("type", "checkbox")
										.attr("data-id", item.id)
										.attr("data-type", "payed")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("data-html", "true")
										.attr("title", "оплатить")
										.tooltip({
												animation: "animated bounceIn",
											});
						}

						// --- document delivery icon
						if(item.status == "approved")
							original_docs_delivery_icon = original_docs_delivery_obj.GetItemDOM(item);

						// --- preview DOM. It would be changed after user click collapse.
						collapsible_content_col
							.append(collapsible_nested_row_button.append(collapsible_nested_col_button_1).append(collapsible_nested_col_button_2))
							.append(collapsible_nested_row_info.append(collapsible_nested_col_info))
							.append(collapsible_nested_row_control.append(collapsible_nested_col_control))
							;

						if(user_type_global == "subcontractor")
						{
							collapsible_nested_col_button_1.append(button_goto_timecard);
							if((item.status == "approved") && (item.contract_sow[0].recall_by_subcontractor == "Y"))
								collapsible_nested_col_button_2.append(button_recall_timecard);
						}
						if(user_type_global == "agency")
						{
							if((item.status == "approved") && (item.contract_sow[0].recall_by_agency == "Y"))
								collapsible_nested_col_button_2.append(button_recall_timecard);
						}

						collapsible_nested_col_info
							.append(system_calls.GetHoursStatistics_DOM(item, undefined, global_holiday_calendar))
							.append(system_calls.GetApprovedDate_DOM(item))
							.append(system_calls.GetPayedDate_DOM(item));

						visible_row
							.append(status_div.append(status_icon).append("&nbsp;").append(original_docs_delivery_icon).append("&nbsp;").append(payed_icon).append(payed_checkbox))
							.append(timeinterval_col.append(title))
							.append(total_hours_col.append(
															actual_work_hours + " " + system_calls.GetHoursSpelling(Math.floor(actual_work_hours)) + " или " + 
															actual_work_days + " " + system_calls.GetDaysSpelling(Math.floor(actual_work_days)) + " = " + 
															Math.round(actual_work_hours / total_work_hours * 100) + "%"
														)
									)
							.append(download_col.append(download_tag));

						collapsible_row
							.append(top_shadow_div)
							.append(collapsible_content_col)
							.append(bottom_shadow_div);

						result = result	.add(filter_div
												.append(visible_row)
												.append(collapsible_row)
											);

						status_icon.tooltip({ animation: "animated bounceIn"});

						if(user_type_global == "agency") $("#payed").show(250);
					}
					else
					{
						console.error("timecard(id: " + item.id + ") empty start_date or end_date");
					}
				});
		}

		return result;
	};

	var	RenderTimecardList = function(sow_list, timecard_list, clear_or_append)
	{
		if(sow_list.length && timecard_list.length)
		{
			var		container = $();

			sow_list.sort(function(a, b)
			{
				var		arrA = a.end_date.split(/\-/);
				var		arrB = b.end_date.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});

			for(var i = 0; i < sow_list.length; ++i)
			{
				container = container	
								.add(common_timecard.GetSoWTitleRow(sow_list[i], false, true))
								.add(GetTimecardListDOM(timecard_list, sow_list[i]));
			}

			if(clear_or_append == "clear")
				$("#timecard_list").empty();

			$("#timecard_list").append(container);
		}
		else
		{
			--globalPageCounter;

			// console.debug("reduce page# due to requests return empty result");
		}
	};

	var	Payed_ClickHandler = function(e)
	{
		var		checked_list = [];

		$("input[data-type=\"payed\"]:checked").each(function()
		{
			var		curr_tag = $(this);

			checked_list.push(curr_tag.attr("data-id"));
		});

		if(checked_list.length === 0)
		{
			system_calls.PopoverError($("#payed"), "Выберите, что было оплачено");
		}
		else
		{
			PayForTheList(checked_list.join());
		}
	};

	var	PayForTheList = function(payment_list)
	{
		var		currTag = $("#payed");

		$.getJSON(
			"/cgi-bin/" + user_type_global + ".cgi",
			{
				"action": "AJAX_payForTheList",
				"entity": "timecard",
				"list": payment_list,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					UpdateTimecardList("clear");
				}
				else
				{
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


	var	RecallModalShow_ClickHandler = function(e)
	{
		var	curr_tag		= $(this);
		var	timecard_id		= curr_tag.attr("data-timecard_id");
		var	modal			= $("#RecallTimecardModal");

		modal.find(".btn.btn-danger").attr("data-timecard_id", timecard_id);
		modal.find(".reason").val("");
		modal.modal("show");

	};

	var	RecallTimecard_ClickHandler = function(e)
	{
		var	curr_tag		= $(this);
		var	timecard_id		= curr_tag.attr("data-timecard_id");
		var	script			= curr_tag.attr("data-script");
		var	modal			= $("#RecallTimecardModal");
		var	reason			= modal.find(".reason");

		if(timecard_id)
		{
			if(reason.val().length)
			{
				if(script && script.length)
				{
						$.getJSON(
							"/cgi-bin/" + script,
							{
								"action":"AJAX_recallTimecard",
								"timecard_id": timecard_id,
								"reason": reason.val(),
							})
							.done(function(data)
							{
								if(data.result == "success")
								{
									modal.modal("hide");
									setTimeout(function() { window.location.replace(window.location.href + "&rand=" + Math.random() * 765434567902); }, 200);
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
							});
				}
				else
				{
					system_calls.PopoverError(curr_tag, "script not found");
				}
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Укажите причину");
			}
		}
		else
		{
			system_calls.PopoverError(curr_tag, "не найден номер таймкарты");
		}

	};

	return {
		Init: Init
	};

})();
