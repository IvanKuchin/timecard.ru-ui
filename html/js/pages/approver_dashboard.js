var	approver_dashboard = approver_dashboard || {};

var	approver_dashboard = (function()
{
	"use strict";

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
			"/cgi-bin/approver.cgi",
			{
				"action":"AJAX_getDashboardData",
			})
			.done(function(data)
			{
				if(data.status == "success")
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
						.on("click", function(e) { window.location.href = "/cgi-bin/approver.cgi?action=approver_timecard_approvals_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		bt_counter_dom = $("<strong>")
						.append(bt_counter)
						.addClass("h2 cursor_pointer")
						.addClass(bt_counter ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "поездки")
						.on("click", function(e) { window.location.href = "/cgi-bin/approver.cgi?action=approver_bt_approvals_template&rand=" + Math.random() * 35987654678923; });

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

	return {
		Init: Init
	};

})();
