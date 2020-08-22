
var	subcontractor_dashboard = subcontractor_dashboard || {};

var	subcontractor_dashboard = (function()
{
	'use strict';

	var	data_global;

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
	};

	var	GetInitialData = function()
	{
		var		currTag = $("#dashboard");


		$.getJSON(
			'/cgi-bin/subcontractor.cgi',
			{
				"action":"AJAX_getDashboardData",
			})
			.done(function(data)
			{
				if(data.status == "success")
				{
					data_global = data;

					RenderRejectedTimecards();
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
			'/cgi-bin/subcontractor.cgi',
			{
				"action":"AJAX_getDashboardPendingPayment",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					common_timecard.RenderDashboardPendingPayment("subcontractor", data);
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
			'/cgi-bin/subcontractor.cgi',
			{
				"action":"AJAX_getSoWList",
				"include_tasks":"false",
				"include_bt":"false",
				"include_cost_centers":"false",
			})
			.done(function(data)
			{
				if(data.status == "success")
				{
					// RenderSoWExpirationDash(data);
					$("#sow_expiration_dash").empty().append(system_calls.RenderSoWExpiration_DashboardApplet_DOM(data.sow, "subcontractor"));
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

	var	RenderRejectedTimecards = function()
	{
		var		currTag = $("#rejected_timecards_content");
		var		timecard_counter = 0;
		var		timecard_counter_dom;
		var		separator_dom;
		var		bt_counter_dom;
		var		bt_counter = 0;
		var		timecard_tooltip_content = "";
		var		bt_tooltip_content = "";
		var		new_dom = $();

		data_global.rejected_timecards.forEach(function(timecard)
		{
			if(timecard.status == "rejected")
			{
				timecard_tooltip_content += timecard.period_start + " - " + timecard.period_end + "<br>";
				++timecard_counter;
			}
		});

		data_global.rejected_bt.forEach(function(bt)
		{
			if(bt.status == "rejected")
			{
				bt_tooltip_content += bt.place + " (" + bt.purpose + ")<br>";
				++bt_counter;
			}
		});

		timecard_counter_dom = $("<strong>")
						.append(timecard_counter)
						.addClass("h2 cursor_pointer")
						.addClass(timecard_tooltip_content ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", timecard_tooltip_content)
						.on("click", function(e) { window.location.href = "/cgi-bin/subcontractor.cgi?action=timecard_list_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		bt_counter_dom = $("<strong>")
						.append(bt_counter)
						.addClass("h2 cursor_pointer")
						.addClass(bt_tooltip_content ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", bt_tooltip_content)
						.on("click", function(e) { window.location.href = "/cgi-bin/subcontractor.cgi?action=bt_list_template&rand=" + Math.random() * 35987654678923; });

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

	var	RenderSoWExpirationDash = function(data)
	{
		var		currTag = $("#sow_expiration_dash");
		var		expire_in_60_days = 0;
		var		expire_in_30_days = 0;
		var		timecard_counter_dom;
		var		sow_counter_dom;
		var		separator_dom;
		var		new_dom = $();

		data.sow.forEach(function(sow)
			{
				if(sow.status == "signed")
				{
					if(system_calls.willSoWExpire(sow, 30).isExpired)
					{
						++expire_in_30_days;
					}
					else if(system_calls.willSoWExpire(sow, 60).isExpired)
					{
						++expire_in_60_days;
					}
				}
			});

		timecard_counter_dom = $("<strong>")
						.append(expire_in_30_days)
						.addClass("h2 cursor_pointer")
						.addClass(expire_in_30_days ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "закончатся в течение 30 дней")
						.on("click", function(e) { window.location.href = "/cgi-bin/subcontractor.cgi?action=subcontractor_sow_list_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		sow_counter_dom = $("<strong>")
						.append(expire_in_60_days)
						.addClass("h2 cursor_pointer")
						.addClass(expire_in_60_days ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "закончатся от 30 до 60 дней")
						.on("click", function(e) { window.location.href = "/cgi-bin/subcontractor.cgi?action=subcontractor_sow_list_template&rand=" + Math.random() * 35987654678923; });

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

	return {
		Init: Init
	};

})();
