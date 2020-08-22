/*jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/

var	agency_dashboard = agency_dashboard || {};

var	agency_dashboard = (function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "DD/MM/YYYY";

	var	data_global;
	var	last_month_timecards_global;
	var	last_month_bt_global;
	var	this_month_bt_global;
	var	last_month_sow_global;
	var	this_month_sow_global;
	var	holiday_calendar_global;

	var	Init = function()
	{
		$.ajaxSetup({ cache: false });

		if(session_pi.isCookieAndLocalStorageValid())
		{
			GetInitialData();
		}
		else
		{
			window.location.href = "/autologin?rand=" + Math.random() * 1234567890;
		}

		$("[data-target=\"#cost_prediction\"]").on("click", CostPrediction_ClickHandler);
	};

	var	GetInitialData = function()
	{
		let		currTag = $("#dashboard");


		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardPendingData",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderPendingApprovals();
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardPendingPayment",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					common_timecard.RenderDashboardPendingPayment("agency", data);
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

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardSubmitTimecardsThisMonth",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderSubmitTimecardsThisMonth(data);
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardSubmitTimecardsLastMonth",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderSubmitTimecardsLastMonth(data);
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardSubmitTimecardsThisWeek",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderSubmitTimecardsThisWeek(data);
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getDashboardSubmitTimecardsLastWeek",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					RenderSubmitTimecardsLastWeek(data);
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				}, 500);
			});

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				"action":"AJAX_getSoWList",
				"include_tasks":"false",
				"include_bt":"false",
				"include_cost_centers":"false",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#sow_expiration_dash").empty().append(system_calls.RenderSoWExpiration_DashboardApplet_DOM(data.sow, "agency"));
				}
				else
				{
					console.error("AJAX_getDashboardData.done(): ERROR: " + data.description);
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

	var	RenderPendingApprovals = function()
	{
		var		currTag = $("#pending_approvals_content");
		var		timecard_counter = data_global.number_of_pending_timecards;
		var		bt_counter = data_global.number_of_pending_bt;
		var		timecard_counter_dom;
		var		bt_counter_dom;
		var		separator_dom;
		var		bt_tooltip_content = "";
		var		new_dom = $();

		timecard_counter_dom = $("<strong>")
						.append(timecard_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_counter ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "таймкарты")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=agency_approvals_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		bt_counter_dom = $("<strong>")
						.append(bt_counter)
						.addClass("h2 cursor_pointer")
						.addClass(bt_counter ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "поездки")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=agency_bt_approvals_template&rand=" + Math.random() * 35987654678923; });

		bt_counter_dom.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(timecard_counter_dom)
					.add(separator_dom)
					.add(bt_counter_dom);

		currTag.empty().append(new_dom);
	};

	var	SubmitTimecards_DOM = function(data)
	{
		var		timecard_counter = data.number_of_submit_timecards;
		var		sow_counter = data.total_number_of_sow;
		var		timecard_counter_dom;
		var		sow_counter_dom;
		var		separator_dom;
		var		new_dom = $();

		timecard_counter_dom = $("<strong>")
						.append(timecard_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_counter == sow_counter ? "color_green" : "color_red")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "таймкарты")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=timecard_list_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		sow_counter_dom = $("<strong>")
						.append(sow_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_counter == sow_counter ? "color_green" : "color_red")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "кол-во активных SoW")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=agency_sow_list_template&rand=" + Math.random() * 35987654678923; });

		sow_counter_dom.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(timecard_counter_dom)
					.add(separator_dom)
					.add(sow_counter_dom);

		return	new_dom;
	};

	var	RenderSubmitTimecardsThisMonth = function(data)
	{
		$("#submit_timecards_this_month").empty().append(SubmitTimecards_DOM(data));
	};

	var	RenderSubmitTimecardsLastMonth = function(data)
	{
		$("#submit_timecards_last_month").empty().append(SubmitTimecards_DOM(data));
	};

	var	RenderSubmitTimecardsThisWeek = function(data)
	{
		$("#submit_timecards_this_week").empty().append(SubmitTimecards_DOM(data));
	};

	var	RenderSubmitTimecardsLastWeek = function(data)
	{
		$("#submit_timecards_last_week").empty().append(SubmitTimecards_DOM(data));
	};

/*	
	var	RenderSubmitTimecardsLastMonth = function(data)
	{
		var		currTag = $("#submit_timecards_last_month");
		var		timecard_counter = data.number_of_submit_timecards;
		var		sow_counter = data.total_number_of_sow;
		var		timecard_counter_dom;
		var		sow_counter_dom;
		var		separator_dom;
		var		new_dom = $();

		timecard_counter_dom = $("<strong>")
						.append(timecard_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_counter == sow_counter ? "color_green" : "color_red")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "таймкарты")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=timecard_list_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		sow_counter_dom = $("<strong>")
						.append(sow_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_counter == sow_counter ? "color_green" : "color_red")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "кол-во активных SoW")
						.on("click", function(e) { window.location.href = "/cgi-bin/agency.cgi?action=agency_sow_list_template&rand=" + Math.random() * 35987654678923; });

		sow_counter_dom.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(timecard_counter_dom)
					.add(separator_dom)
					.add(sow_counter_dom);

		currTag.empty().append(new_dom);
	};
*/
	var	CostPrediction_ClickHandler = function(e)
	{
		var		curr_tag 			= $(this);
		var		data_target			= $(curr_tag.attr("data-target"));

		var 	curr_ts				= new Date();
		var		this_month			= new Date(curr_ts.getFullYear(), curr_ts.getMonth()    , 1, 0, 0, 0);
		var		prev_month			= new Date(curr_ts.getFullYear(), curr_ts.getMonth() - 1, 1, 0, 0, 0);

		if((typeof(last_month_timecards_global) == "undefined") || typeof(last_month_sow_global) == "undefined")
		{
			if(data_target.attr("aria-expanded") == "true")
			{
				// --- collapse collapsible_div
			}
			else
			{
				$.getJSON("/cgi-bin/agency.cgi?action=AJAX_getTimecardList&date=" + system_calls.GetFormattedDateFromSeconds(prev_month / 1000, DATE_FORMAT_GLOBAL))
					.done(function(data)
					{
						if(data.result == "success")
						{
							last_month_sow_global		= data.sow;
							last_month_timecards_global	= data.timecards;
							holiday_calendar_global		= data.holiday_calendar;

							$.getJSON("/cgi-bin/agency.cgi?action=AJAX_getSoWList&date=" + system_calls.GetFormattedDateFromSeconds(this_month / 1000, DATE_FORMAT_GLOBAL))
								.done(function(data)
								{
									var		forecast;

									if(data.result == "success")
									{
										this_month_sow_global		= data.sow;
										
										agency_service_cost_prediction.SetLastMonthDate(prev_month);
										agency_service_cost_prediction.SetThisMonthDate(this_month);
										agency_service_cost_prediction.SetLastMonthSoW(last_month_sow_global);
										agency_service_cost_prediction.SetHolidayCalendar(holiday_calendar_global);
										agency_service_cost_prediction.SetLastMonthTimecards(last_month_timecards_global);
										agency_service_cost_prediction.SetThisMonthSoW(this_month_sow_global);

										RenderServiceForecast(agency_service_cost_prediction.Predict());
									}
									else
									{
										system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
									}

								})
								.fail(function(data)
								{
									system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
								});
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}

					})
					.fail(function(data)
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					});

				$.getJSON("/cgi-bin/agency.cgi?action=AJAX_getBTList&extended=true&date=" + system_calls.GetFormattedDateFromSeconds(prev_month / 1000, DATE_FORMAT_GLOBAL))
					.done(function(data)
					{
						if(data.result == "success")
						{
							last_month_bt_global = data.bt;

							$.getJSON("/cgi-bin/agency.cgi?action=AJAX_getBTList&extended=true&date=" + system_calls.GetFormattedDateFromSeconds(this_month / 1000, DATE_FORMAT_GLOBAL))
								.done(function(data)
								{
									if(data.result == "success")
									{
										this_month_bt_global = data.bt;

										agency_bt_cost_prediction.SetLastMonthDate(prev_month);
										agency_bt_cost_prediction.SetThisMonthDate(this_month);
										agency_bt_cost_prediction.SetLastMonthBTs(last_month_bt_global);										
										agency_bt_cost_prediction.SetThisMonthBTs(this_month_bt_global);										

										RenderBTForecast(agency_bt_cost_prediction.Predict());
									}
									else
									{
										system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
									}
								})
								.fail(function(data)
								{
									system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
								});

						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					});
			}
		}
	};

	var	PrettyPrinting = function(num)
	{
		var i = 0;
		var	postfix = ["", "K", "M", "Мд", "Тр"];

		while(num > 999.999)
		{
			num = num / 1000;
			i++;
		}

		return system_calls.RoundedTwoDigitSum(num, 0) + postfix[i];
	};

	var RenderServiceForecast = function(forecast)
	{
		var		prev_month_cost = PrettyPrinting(forecast.last_month_cost);
		var		this_month_min = PrettyPrinting(forecast.this_month_cost_min);
		var		this_month_max = PrettyPrinting(forecast.this_month_cost_max);

		$("#subcontractor_prev_month_service_payment")
													.empty()
													.append(prev_month_cost)
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("title", "выплата за " + system_calls.GetFormattedDateFromSeconds(forecast.last_month_date.getTime() / 1000, "MMM YYYY"))
													.tooltip({ animation: "animated bounceIn"});

		$("#subcontractor_this_month_service_payment")
													.empty()
													.append(this_month_min + " - " + this_month_max)
													.attr("data-toggle", "tooltip")
													.attr("data-placement", "top")
													.attr("title", "предположительный мин. и макс. за " + system_calls.GetFormattedDateFromSeconds(forecast.this_month_date.getTime() / 1000, "MMM YYYY"))
													.tooltip({ animation: "animated bounceIn"});
	};

	var RenderBTForecast = function(forecast)
	{
		var		prev_month_cost = PrettyPrinting(forecast.last_month_cost);
		var		this_month_cost = PrettyPrinting(forecast.this_month_cost);

		$("#subcontractor_prev_month_bt_payment")
													.empty()
													.append(prev_month_cost)
													.attr("data-placement", "top")
													.attr("title", "выплата за " + system_calls.GetFormattedDateFromSeconds(forecast.last_month_date.getTime() / 1000, "MMM YYYY"))
													.tooltip({ animation: "animated bounceIn"});
		$("#subcontractor_this_month_bt_payment")
													.empty()
													.append(this_month_cost)
													.attr("data-placement", "top")
													.attr("title", "выплата за " + system_calls.GetFormattedDateFromSeconds(forecast.this_month_date.getTime() / 1000, "MMM YYYY"))
													.tooltip({ animation: "animated bounceIn"});
	};

	return {
		Init: Init
	};

})();
