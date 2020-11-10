var	bt_list = bt_list || {};

var	bt_list = (function()
{
	'use strict';

	var	user_type_global = "";
	var	data_global;

	var	Init = function(user_type)
	{
		user_type_global = user_type;

		UpdateBTList();

		$("#payed").on("click", Payed_ClickHandler);

		// --- filters
		$(".__list_filters").on("click", list_filters.ClickHandler);
		$("[data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});
	};

	var	UpdateBTList = function()
	{
		var		currTag = $("#bt_list_title");

		$.getJSON(
			"/cgi-bin/" + user_type_global + ".cgi",
			{
				"action":"AJAX_getBTList",
				// "page":"0",
				// "filter_sow_status":"signed",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderBTList();
					list_filters.ApplyFilterFromURL();
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

	// PS: this instance didn't merged with agency_bt_approvals due to control buttons logic
	var	GetBTListDOM = function(bt_list, sow)
	{
		var		result = $();

		if((typeof(bt_list) == "undefined"))
		{
			console.error("bt_list is undefined");
		}
		else
		{
			var		timeFormat = 'MM/DD/YYYY HH:mm';
			var		bt_belongs_to_sow = [];
			var		sow_id = sow.id;
			var		customer_map 				= new Map();
			var		today						= new Date();
			var		today_noon					= today.setHours(12, 0, 0, 0);
			var		sow_serv_payment_half_time	= 0.5 * sow.payment_period_service * 24 * 3600 * 1000;
			var		sow_bt_payment_half_time	= 0.5 * sow.payment_period_bt * 24 * 3600 * 1000;

			sow.tasks.forEach(function(task)
			{
				var		customer_obj = task.projects[0].customers[0];
				customer_map[customer_obj.id] = customer_obj;
			});

			bt_list.forEach(function(item)
			{
				if(item.contract_sow_id == sow_id) bt_belongs_to_sow.push(item);
			});

			bt_belongs_to_sow.sort(function(a, b)
			{
				var		arrA = a.date_start.split(/\-/);
				var		arrB = b.date_start.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});


			bt_belongs_to_sow.forEach(function(item)
				{
					if(item.date_start.length && item.date_end.length)
					{
						var		visible_row = $("<div>").addClass("row highlight");
						var		collapsible_row = $("<div>").addClass("row")
															.addClass("collapse out sow")
															.attr("id", "collapsible_bt_" + item.id);
						var		status_div = $("<div>").addClass("col-xs-3 col-md-1");
						var		timeinterval_col = $("<div>").addClass("col-xs-8 col-md-4");
						var		download_col = $("<div>").addClass("col-xs-1 col-md-1");
						var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-6");
						var		title =  $("<span>")
											.addClass("link bt_title")
											.append(system_calls.ConvertDateSQLToHuman(item.date_start) + " - " + system_calls.ConvertDateSQLToHuman(item.date_end))
											.attr("id", "bt_title_" + item.id)
	 										.attr("data-toggle", "collapse")
	 										.attr("data-target", "#collapsible_bt_" + item.id)
	 										.attr("data-bt_id", item.id)
	 										.on("click", BTCollapsible_ClickHandler);
						var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
						var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");

						var		collapsible_content_col = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_bt_" + item.id + "_content");
						var		collapsible_nested_row_button = $("<div>").addClass("row");
						var		collapsible_nested_col_button = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-1 col-xs-offset-0 form-group");
						var		collapsible_nested_row_stat = $("<div>").addClass("row");
						var		collapsible_nested_col_stat1 = $("<div>")
																.addClass("col-xs-12 col-md-11")
																.attr("id", "collapsible_bt_" + item.id + "_statistics");
						var		collapsible_nested_col_stat2 = $("<div>")
																.addClass("col-md-1 col-xs-hidden col-sm-hidden");
						var		collapsible_nested_row_info = $("<div>").addClass("row");
						var		collapsible_nested_col_info = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_bt_" + item.id + "_info");

						var		download_all_attachments = $("<a>")
																.addClass("float_right cursor_pointer")
																.attr("data-bt_id", item.id)
																.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'>")
																.append("<i class=\"fa fa-archive\" aria-hidden=\"true\"></i>")
																.on("click", DownloadAllAttachments);
						var		button_goto_timecard = $("<a>")
																.addClass("btn btn-primary form-control __control_button_" + item.id)
																.attr("id", "edit_bt_button_" + item.id)
																.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'>")
																.append("<i class=\"fa fa-pencil-square-o\" aria-hidden=\"true\"></i>")
																.attr("href", "/cgi-bin/" + user_type_global + ".cgi?action=subcontractor_bt_template&bt_id=" + item.id + "&rand=" + (Math.random() * 4876234923498));

						var		canvas = $("<canvas>").attr("data-id", item.id);
						var		datasets_arr = [];
						var		task_names_arr = [];
						var		status_icon = $("<i>").addClass("fa");
						var		payed_icon = $("<i>").addClass("fa");
						var		payed_checkbox = $();
						var		original_docs_delivery_icon = $();
						var		destination = item.destination;
						var		purpose = item.purpose;
						var		download_tag = $();

						// --- filter part
						var		filter_div = $("<div>").addClass("__filterable");
						if((parseInt(item.expected_pay_date) != 0) && (parseInt(item.payed_date) == 0))
						{
							if		(today_noon > parseInt(item.expected_pay_date) * 1000)								filter_div.addClass("__filter_expired");
							else if	(today_noon > parseInt(item.expected_pay_date) * 1000 - sow_bt_payment_half_time)	filter_div.addClass("__filter_expire_in_half_decay");
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

						// --- initial DOM. It would be changed after user click collapse.
						collapsible_content_col
							.append(collapsible_nested_row_stat		.append(collapsible_nested_col_stat1).append(collapsible_nested_col_stat2))
							.append(collapsible_nested_row_button	.append(collapsible_nested_col_button))
							.append(collapsible_nested_row_info		.append(collapsible_nested_col_info));

						collapsible_nested_col_stat2
							.append(download_all_attachments);

						if(user_type_global == "subcontractor")
							collapsible_nested_col_button.append(button_goto_timecard);

						collapsible_nested_col_info
							.append(system_calls.GetTextedBT_DOM(item))
							.append(system_calls.GetApprovedDate_DOM(item))
							.append(system_calls.GetPayedDate_DOM(item));

						visible_row
							.append(status_div.append(status_icon).append("&nbsp;").append(original_docs_delivery_icon).append("&nbsp;").append(payed_icon).append(payed_checkbox))
							.append(timeinterval_col.append(title))
							.append(total_hours_col.append(customer_map[item.customer_id].title + ", " + item.place + " (" + item.purpose + ")"))
							.append(download_col.append(download_tag));


						collapsible_row
							.append(top_shadow_div)
							.append(collapsible_content_col)
							.append(bottom_shadow_div);

						result = result.add(filter_div
												.append(visible_row)
												.append(collapsible_row)
											);

						status_icon.tooltip({ animation: "animated bounceIn"});

						if(user_type_global == "agency") $("#payed").show(250);
					}
					else
					{
						console.error("bt(id: " + item.id + ") empty start_date or end_date");
					}
				});
		}

		return result;
	};

	var	RenderBTList = function()
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined")&& (typeof(data_global.bt) != "undefined"))
		{
			var		container = $();

			// --- sort sow
			data_global.sow.sort(function(a, b)
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


			for(var i = 0; i < data_global.sow.length; ++i)
			{
				container = container.add(common_timecard.GetSoWTitleRow(data_global.sow[i], false, true));
				container = container.add(GetBTListDOM(data_global.bt, data_global.sow[i]));
			}

			$("#bt_list").empty().append(container);
		}
		else
		{
			console.error("ERROR: sow list or bt list is empty");
		}
	};


	var	BTCollapsible_ClickHandler = function(e)
	{
		var		currTag = $(this);

		system_calls.BTCollapsible_ClickHandler(currTag);
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
				"action":"AJAX_payForTheList",
				"entity": "bt",
				"list": payment_list,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					UpdateBTList();
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

	var DownloadAllAttachments = function(e)
	{
		var		curr_tag = $(this);


			// .attr("href", "/cgi-bin/" + user_type_global + ".cgi?action=AJAX_downloadBTAttachments&bt_id=" + bt_item.id + "&rand=" + (Math.random() * 4876234923498));
		$.getJSON(
			"/cgi-bin/" + user_type_global + ".cgi",
			{
				"action":"AJAX_downloadBTAttachments",
				"bt_id": curr_tag.attr("data-bt_id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					if(typeof(data.href) != "undefined")
					{
						window.location.href = "/images/temp_daily_cleanup/" + data.href + "?rand=" + Math.random() * 87654593456478654;
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: фаил не найден");
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
			});
	};

	return {
		Init: Init
	};

})();
