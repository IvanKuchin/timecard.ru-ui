var	agency_invoice_cost_center_bt_list = agency_invoice_cost_center_bt_list || {};

var	agency_invoice_cost_center_bt_list = function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	data_cost_centers_global;
	var	cost_center_id_global;

	var	Init = function(cost_centers)
	{
		data_cost_centers_global = cost_centers;

		RenderCostCenterTabs(data_cost_centers_global);

		// --- emulate click on first tab
		$(".__tab_href_bt_list._tab_order_0").click();
		$("#AreYouSureRecallBTInvoice .submit").on("click", RecallInvoice_ClickHandler);

	};

	var	RenderCostCenterTabs = function(cost_centers)
	{
		$("#invoices_bt_list").empty().append(system_calls.GetCostCenterTabs_DOM(cost_centers, "_bt_list", BTTab_ClickHandler));
	};

	var	GetBTInvoiceListFromServer = function(cost_center_id, callback_func)
	{
		var		curr_tag = $(".__tab_pane_bt_list[data-id=\"" + cost_center_id + "\"]");

		if(curr_tag.empty())
		{
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_getBTInvoiceList",
					cost_center_id: cost_center_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						if((typeof(data) != "undefined") && (typeof(data.bt_invoices) != "undefined"))
						{
							callback_func(cost_center_id, data.bt_invoices);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в объекте bt_invoices");
						}
					}
					else
					{
						console.error("AJAX_getBTInvoiceList.done(): ERROR: " + data.description);
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

	var	RenderBTCostCenterPane_DOM = function(cost_center_id, bt_invoices)
	{
		var		result = $();

		if((typeof(bt_invoices) == "undefined"))
		{
			console.error("bt_invoices is undefined");
		}
		else
		{
			var		timeFormat = 'MM/DD/YYYY HH:mm';

			bt_invoices.sort(function(a, b)
			{
				var 	timeA = parseInt(a.eventTimestamp);
				var		timeB = parseInt(b.eventTimestamp);
				var		result = 0;

				if(timeA == timeB) { result = 0; }
				if(timeA <  timeB) { result = 1; }
				if(timeA >  timeB) { result = -1; }

				return result;
			});


			bt_invoices.forEach(function(bt_invoice)
				{
						var		visible_row = $("<div>").addClass("row highlight __bt_invoice_" + bt_invoice.id);
						var		collapsible_row = $("<div>")
														.addClass("row collapse out sow __bt_invoice_" + bt_invoice.id)
														.attr("id", "collapsible_bt_invoice_" + bt_invoice.id);
						var		owner_div = $("<div>").addClass("col-xs-6 col-md-2");
						var		timeinterval_col = $("<div>").addClass("col-xs-6 col-md-2");
						var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-3");
						var		title =  $("<span>")
											.addClass("link bt_invoice_title")
											.append(system_calls.GetFormattedDateFromSeconds(bt_invoice.eventTimestamp, timeFormat))
											.attr("id", "bt_invoice_title_" + bt_invoice.id)
	 										.attr("data-toggle", "collapse")
	 										.attr("data-target", "#collapsible_bt_invoice_" + bt_invoice.id)
	 										.attr("data-bt_invoice", bt_invoice.id)
	 										.on("click", BTInvoiceCollapsible_ClickHandler);
						var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
						var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");

						var		collapsible_content_col = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_bt_invoice_" + bt_invoice.id + "_content");
						var		collapsible_nested_row_button = $("<div>").addClass("row");
						var		collapsible_nested_col_button = $("<div>").addClass("col-xs-12 col-md-12");
						var		collapsible_nested_row_info = $("<div>").addClass("row");
						var		collapsible_nested_col_info = $("<div>")
																.addClass("col-xs-12 __bt_list_col_info_" + bt_invoice.id)
																.attr("id", "collapsible_bt_invoice_" + bt_invoice.id + "_info");

						var		button_goto_bt_invoice = $("<a>")
																.addClass("btn btn-link btn-danger float_right color_red")
																.append("Отозвать")
																.on("click", function(e)
																	{
																		$("#AreYouSureRecallBTInvoice .submit").attr("data-invoice_id", bt_invoice.id);
																		$("#AreYouSureRecallBTInvoice .submit").attr("data-suffix", "BT");
																		$("#AreYouSureRecallBTInvoice").modal("show");
																	});

						var		datasets_arr = [];
						var		task_names_arr = [];
						var		owner_icon = bt_invoice.users[0].name + " " + bt_invoice.users[0].nameLast;

						// --- initial DOM. It would be changed after user click collapse.
						collapsible_content_col
							.append(collapsible_nested_row_info.append(collapsible_nested_col_info))
							.append(collapsible_nested_row_button.append(collapsible_nested_col_button));

						collapsible_nested_col_button
							.append(button_goto_bt_invoice);

						visible_row
							.append(timeinterval_col.append(title))
							.append(owner_div.append(owner_icon))
							.append(total_hours_col.append("<a href=\"/invoices_cc/" + bt_invoice.file + "\"><i  class=\"fa fa-download\" aria-hidden=\"true\"></i></a>"));

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

	var	BTInvoiceCollapsible_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	bt_invoice_id = curr_tag.attr("data-bt_invoice");

		if(parseInt(bt_invoice_id))
		{
			var		target_tag = $("#collapsible_bt_invoice_" + bt_invoice_id + "_info");
			var		info_content = target_tag.html();

			if(info_content.length)
			{
			}
			else
			{
				$.getJSON(
					'/cgi-bin/agency.cgi',
					{
						action: "AJAX_getBTInvoiceDetails",
						bt_invoice_id: bt_invoice_id,
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							RenderBTsInsideInvoice(data.bt, bt_invoice_id);
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

	var	RenderBTsInsideInvoice_DOM = function(bt_list, bt_invoice_id)
	{
		var result = $();

		bt_list.forEach(function(bt)
		{
			var		strip_br = true;
			var		customer = bt.customers[0].title;
			var		subc_company = bt.sow[0].number + " от " + system_calls.ConvertDateSQLToHuman(bt.sow[0].sign_date);
			var		bt_period = system_calls.ConvertDateSQLToHuman(bt.date_start) + " - " + system_calls.ConvertDateSQLToHuman(bt.date_end);

			var		bt_row			= $("<div>").addClass("row");
			var		bt_company_col	= $("<div>").addClass("col-xs-6 col-md-3");
			var		bt_period_col	= $("<div>").addClass("col-xs-6 col-md-3");
			var		bt_customer_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-6");



			bt_row
				.append(bt_company_col	.append(subc_company))
				.append(bt_period_col	.append(bt_period))
				.append(bt_customer_col	.append(customer));

			result = result.add(bt_row);
		});

		return result;
	};

	var	RenderBTsInsideInvoice = function(bt_list, bt_invoice_id)
	{
		$("#collapsible_bt_invoice_" + bt_invoice_id + "_info").empty().append(RenderBTsInsideInvoice_DOM(bt_list, bt_invoice_id));
	};

	var	RenderBTCostCenterPane = function(cost_center_id, content_obj_for_pane)
	{
		$(".__tab_pane_bt_list[data-id=\"" + cost_center_id + "\"]").empty().append(RenderBTCostCenterPane_DOM(cost_center_id, content_obj_for_pane));
	};

	var	BTTab_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	cost_center_id = curr_tag.attr("data-id");
		var	pane_tag = $(".__tab_pane_bt_list[data-id=\"" + cost_center_id + "\"]");

		cost_center_id_global = cost_center_id;

		if(pane_tag.html().length) {}
		else
		{
			GetBTInvoiceListFromServer(cost_center_id_global, function(cost_center_id, bt_invoices) { 
																		RenderBTCostCenterPane(cost_center_id, bt_invoices); 
																	});
		}
	};

	var	UpdateAndHighlighBTInvoice = function(invoice_id)
	{
		GetBTInvoiceListFromServer(cost_center_id_global, function(cost_center_id, bt_invoices) { 
																	RenderBTCostCenterPane(cost_center_id, bt_invoices); 
																	system_calls.ScrollToAndHighlight("div.row.__bt_invoice_" + invoice_id);
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
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_recall" + suffix + "Invoice",
					invoice_id: invoice_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#AreYouSureRecallBTInvoice").modal("hide");

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
		UpdateAndHighlighBTInvoice: UpdateAndHighlighBTInvoice,
	};

};
