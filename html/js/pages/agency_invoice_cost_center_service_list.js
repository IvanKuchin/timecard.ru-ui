var	agency_invoice_cost_center_service_list = agency_invoice_cost_center_service_list || {};

var	agency_invoice_cost_center_service_list = function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	data_cost_centers_global;
	var	cost_center_id_global;
	var	holiday_calendar_global;

	var	Init = function(cost_centers)
	{
		data_cost_centers_global = cost_centers;

		InitHolidayCalendar();

		RenderCostCenterTabs(data_cost_centers_global);

		// --- emulate click on first tab
		$(".__tab_href_service_list._tab_order_0").click();
		$("#AreYouSureRecallServiceInvoice .submit").on("click", RecallInvoice_ClickHandler);

	};

	var	RenderCostCenterTabs = function(cost_centers)
	{
		$("#invoices_service_list").empty().append(system_calls.GetCostCenterTabs_DOM(cost_centers, "_service_list", ServiceTab_ClickHandler));
	};

	var	GetServiceInvoiceListFromServer = function(cost_center_id, callback_func)
	{
		var		curr_tag = $(".__tab_pane_service_list[data-id=\"" + cost_center_id + "\"]");

		if(curr_tag.empty())
		{
			$.getJSON(
				"/cgi-bin/agency.cgi",
				{
					action: "AJAX_getServiceInvoiceList",
					cost_center_id: cost_center_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						if((typeof(data) != "undefined") && (typeof(data.service_invoices) != "undefined"))
						{
							callback_func(cost_center_id, data.service_invoices);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в объекте service_invoices");
						}
					}
					else
					{
						console.error("AJAX_getServiceInvoiceList.done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 200);
				});
		}
	};

	var	InitHolidayCalendar = function()
	{
		var	curr_tag = $("#invoices_container");

		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getHolidayCalendar",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					holiday_calendar_global = data.holiday_calendar;
				}
				else
				{
					console.error("AJAX_getServiceInvoiceList.done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(curr_tag, "Не удалось загрузить производственный календарь");
				}, 200);
			});
	};

	var	RenderServiceCostCenterPane_DOM = function(cost_center_id, service_invoices)
	{
		var		result = $();

		if((typeof(service_invoices) == "undefined"))
		{
			console.error("service_invoices is undefined");
		}
		else
		{
			var		timeFormat = "MM/DD/YYYY HH:mm";

			service_invoices.sort(function(a, b)
			{
				var 	timeA = parseInt(a.eventTimestamp);
				var		timeB = parseInt(b.eventTimestamp);
				var		result = 0;

				if(timeA == timeB) { result = 0; }
				if(timeA <  timeB) { result = 1; }
				if(timeA >  timeB) { result = -1; }

				return result;
			});


			service_invoices.forEach(function(service_invoice)
				{
						var		visible_row = $("<div>").addClass("row highlight __service_invoice_" + service_invoice.id);
						var		collapsible_row = $("<div>")
														.addClass("row collapse out sow __service_invoice_" + service_invoice.id)
														.attr("id", "collapsible_service_invoice_" + service_invoice.id);
						var		owner_div = $("<div>").addClass("col-xs-6 col-md-2");
						var		timeinterval_col = $("<div>").addClass("col-xs-6 col-md-2");
						var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-3");
						var		title =  $("<span>")
											.addClass("link service_invoice_title")
											.append(system_calls.GetFormattedDateFromSeconds(service_invoice.eventTimestamp, timeFormat))
											.attr("id", "service_invoice_title_" + service_invoice.id)
	 										.attr("data-toggle", "collapse")
	 										.attr("data-target", "#collapsible_service_invoice_" + service_invoice.id)
	 										.attr("data-service_invoice", service_invoice.id)
	 										.on("click", ServiceInvoiceCollapsible_ClickHandler);
						var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
						var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");

						var		collapsible_content_col = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_service_invoice_" + service_invoice.id + "_content");
						var		collapsible_nested_row_button = $("<div>").addClass("row");
						var		collapsible_nested_col_button = $("<div>").addClass("col-xs-12 col-md-12");
						var		collapsible_nested_row_info = $("<div>").addClass("row");
						var		collapsible_nested_col_info = $("<div>")
																.addClass("col-xs-12 __service_list_col_info_" + service_invoice.id)
																.attr("id", "collapsible_service_invoice_" + service_invoice.id + "_info");

						var		button_goto_service_invoice = $("<a>")
																.addClass("btn btn-link btn-danger float_right color_red")
																.append("Отозвать")
																.on("click", function(e)
																	{
																		$("#AreYouSureRecallServiceInvoice .submit").attr("data-invoice_id", service_invoice.id);
																		$("#AreYouSureRecallServiceInvoice .submit").attr("data-suffix", "Service");
																		$("#AreYouSureRecallServiceInvoice").modal("show");
																	});

						var		datasets_arr = [];
						var		task_names_arr = [];
						var		owner_icon = service_invoice.users[0].name + " " + service_invoice.users[0].nameLast;

						// --- initial DOM. It would be changed after user click collapse.
						collapsible_content_col
							.append(collapsible_nested_row_info.append(collapsible_nested_col_info))
							.append(collapsible_nested_row_button.append(collapsible_nested_col_button));

						collapsible_nested_col_button
							.append(button_goto_service_invoice);

						visible_row
							.append(timeinterval_col.append(title))
							.append(owner_div.append(owner_icon))
							.append(total_hours_col.append("<a href=\"/invoices_cc/" + service_invoice.file + "\"><i  class=\"fa fa-download\" aria-hidden=\"true\"></i></a>"));

						collapsible_row
							.append(top_shadow_div)
							.append(collapsible_content_col)
							.append(bottom_shadow_div);

						result = result.add(visible_row);
						result = result.add(collapsible_row);

				});
		}

		return result;
	};

	var	ServiceInvoiceCollapsible_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	service_invoice_id = curr_tag.attr("data-service_invoice");

		if(parseInt(service_invoice_id))
		{
			var		target_tag = $("#collapsible_service_invoice_" + service_invoice_id + "_info");
			var		info_content = target_tag.html();

			if(info_content.length)
			{
			}
			else
			{
				$.getJSON(
					"/cgi-bin/agency.cgi",
					{
						action: "AJAX_getServiceInvoiceDetails",
						service_invoice_id: service_invoice_id,
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							RenderTimecardsInsideInvoice(data.timecards, service_invoice_id);
						}
						else
						{
							console.error("AJAX_getPSoWInvoicesList.done(): ERROR: " + data.description);
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						setTimeout(function() {
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						}, 200);
					});
			}
		}		
	};

	var	RenderTimecardsInsideInvoice_DOM = function(timecards, service_invoice_id)
	{
		var result = $();

		timecards.forEach(function(timecard)
		{
			var		strip_br = true;
			var		efforts_summary = system_calls.GetHoursStatistics_DOM(timecard, strip_br, holiday_calendar_global);
			var		subc_company = timecard.contract_sow[0].number + " от " + system_calls.ConvertDateSQLToHuman(timecard.contract_sow[0].sign_date);
			var		timecard_period = system_calls.ConvertDateSQLToHuman(timecard.period_start) + " - " + system_calls.ConvertDateSQLToHuman(timecard.period_end);

			var		timecard_row			= $("<div>").addClass("row");
			var		timecard_company_col	= $("<div>").addClass("col-xs-6 col-md-3");
			var		timecard_period_col		= $("<div>").addClass("col-xs-6 col-md-3");
			var		timecard_efforts_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-6");



			timecard_row
				.append(timecard_company_col	.append(subc_company))
				.append(timecard_period_col		.append(timecard_period))
				.append(timecard_efforts_col	.append(efforts_summary));

			result = result.add(timecard_row);
		});

		return result;
	};

	var	RenderTimecardsInsideInvoice = function(timecards, service_invoice_id)
	{
		$("#collapsible_service_invoice_" + service_invoice_id + "_info").empty().append(RenderTimecardsInsideInvoice_DOM(timecards, service_invoice_id));
	};

	var	RenderServiceCostCenterPane = function(cost_center_id, content_obj_for_pane)
	{
		$(".__tab_pane_service_list[data-id=\"" + cost_center_id + "\"]").empty().append(RenderServiceCostCenterPane_DOM(cost_center_id, content_obj_for_pane));
	};

	var	ServiceTab_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	cost_center_id = curr_tag.attr("data-id");
		var	pane_tag = $(".__tab_pane_service_list[data-id=\"" + cost_center_id + "\"]");

		cost_center_id_global = cost_center_id;

		if(pane_tag.html().length) {}
		else
		{
			GetServiceInvoiceListFromServer(cost_center_id_global, function(cost_center_id, service_invoices) { 
																		RenderServiceCostCenterPane(cost_center_id, service_invoices); 
																	});
		}
	};

	var	UpdateAndHighlightServiceInvoice = function(invoice_id)
	{
		GetServiceInvoiceListFromServer(cost_center_id_global, function(cost_center_id, service_invoices) { 
																	RenderServiceCostCenterPane(cost_center_id, service_invoices); 
																	system_calls.ScrollToAndHighlight("div.row.__service_invoice_" + invoice_id);
																});
	};

	var	RecallInvoice_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	invoice_id = curr_tag.attr("data-invoice_id");
		var	suffix = curr_tag.attr("data-suffix");
		var	error_message = "";

		if(parseInt(invoice_id))
		{
			$.getJSON(
				"/cgi-bin/agency.cgi",
				{
					action: "AJAX_recall" + suffix + "Invoice",
					invoice_id: invoice_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#AreYouSureRecallServiceInvoice").modal("hide");

						setTimeout(function() 
									{
										$(".row.__" + suffix.toLowerCase() + "_invoice_" + invoice_id).hide(200);
									}, 500);
					}
					else
					{
						console.error("AJAX_getPSoWInvoicesList.done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 200);
				});
		}

		if(error_message.length)
		{
			system_calls.PopoverError(curr_tag, error_message);
		}
	};

	return {
		Init: Init,
		UpdateAndHighlightServiceInvoice: UpdateAndHighlightServiceInvoice,
	};

};
