var	agency_invoice_cost_center_service = agency_invoice_cost_center_service || {};

var	agency_invoice_cost_center_service = function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	data_cost_centers_global;
	var	submit_callback_global;

	var	Init = function(cost_centers)
	{
		data_cost_centers_global = cost_centers;

		$("#collapsible_select_service_for_invoicing").on("show.bs.collapse", function(){
			RenderCostCenterTabs(data_cost_centers_global);

			// --- emulate click on first tab
			$(".__tab_href_service._tab_order_0").click();
		});
	};

	var	SetSubmit_Callback = function(param)
	{
		submit_callback_global = param;
	}

	var	GetApprovedTimecardListFromServer = function(cost_center_id)
	{
		var		curr_tag = $(".__tab_pane_service[data-id=\"" + cost_center_id + "\"]");

		if(curr_tag.empty())
		{
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_getApprovedTimecardList",
					cost_center_id: cost_center_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						if((typeof(data) != "undefined") && (typeof(data.timecards) != "undefined"))
						{
							RenderCostCenterPane(cost_center_id, data.timecards);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в объекте timecards");
						}
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
	};

	var	RenderCostCenterPane_DOM = function(cost_center_id, content_obj_for_pane)
	{
		var		result = $();
		var		submit_button;
		var		sow_list = [];
		var		timecard_period_start_map = []; // --- uniq period_starts
		var		timecard_period_start_arr = []; // --- sorted period_starts

		var		title_row = $("<div>").addClass("row");

		content_obj_for_pane.forEach(function(timecard)
		{
			if(typeof sow_list[timecard.contract_sow_id] == "undefined") 
				sow_list[timecard.contract_sow_id] = [];

			sow_list[timecard.contract_sow_id].push(timecard);
			timecard_period_start_map[timecard.period_start] = "";
		});

		// --- build array from map
		Object.keys(timecard_period_start_map).forEach(function(item) { timecard_period_start_arr.push(item); });

		// --- sort start dates array
		timecard_period_start_arr.sort(function(a, b)
		{
			var		arrA = a.split(/\-/);
			var		arrB = b.split(/\-/);
			var 	timeA, timeB;
			var		result = 0;

			timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
			timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

			if(timeA.getTime() == timeB.getTime()) { result = 0; }
			if(timeA.getTime() <  timeB.getTime()) { result = -1; }
			if(timeA.getTime() >  timeB.getTime()) { result = 1; }

			return result;
		});

		title_row.append($("<div>").addClass("col-xs-9 col-md-3").append(""));
		timecard_period_start_arr.forEach(function(start_date, i)
		{
			var		date_col		= $("<div>").addClass("col-xs-3 col-md-1");
			var		splitter		= start_date.split("-");
			var		formatted_date	= start_date;
			var		date_wrapper	= $("<span>")
											.addClass("link")
											.on("click", common_timecard.ToggleInputsWithIndex)
											.attr("data-index", i);
			var		d1;

			if(splitter.length == 3)
			{
				d1 = new Date(splitter[0], parseInt(splitter[1]) - 1, splitter[2], 12, 0, 0);
				formatted_date = system_calls.GetFormattedDateFromSeconds(d1.getTime() / 1000, "DD/MM/YYYY");
			}

			date_col.append(date_wrapper.append($("<small>").append(formatted_date)));
			title_row.append(date_col);

		});
		result = result.add(title_row);

		Object.keys(sow_list).forEach(function(param_sow_id)
		{
			var		sow_id = sow_list[param_sow_id][0].contract_sow[0].id;
			var		sow_row = $("<div>").addClass("row __sow __sow_" + sow_id);
			var		sow_col = $("<div>").addClass("col-xs-9 col-md-3");
			var		date_col_arr = [];

			sow_col.append(sow_list[sow_id][0].contract_sow[0].number + " от " + sow_list[sow_id][0].contract_sow[0].sign_date);

			// --- pre-create empty array w/ div cols per date
			timecard_period_start_arr.forEach(function(start_date, i)
			{
				var	date_col = $("<div>").addClass("col-xs-3 col-md-1 __index_" + i + " height_22px").append("&nbsp;");

				date_col_arr.push(date_col);
			});

			// --- place checkboxes to the right places
			sow_list[sow_id].forEach(function(timecard)
			{
				var		index = GetDateIndex(timecard_period_start_arr, timecard.period_start);

				if(index >= 0)
				{
					var		input_checkbox = $("<input>").addClass("__start_date __index_" + index);
					var		random;

					do
					{
						random = Math.round(Math.random() * 45769320976);
					} while($("input.__start_date[date-random=\"" + random + "\"]").length);

					input_checkbox.attr("type", "checkbox");
					input_checkbox.attr("data-index", index);
					input_checkbox.attr("data-random", random);
					input_checkbox.attr("data-sow_id", sow_id);
					input_checkbox.attr("data-timecard_id", timecard.id);
					input_checkbox.attr("data-cost_center_id", cost_center_id);

					input_checkbox.on("click", Checkbox_ClickHandler);

					// input_checkbox.prop("checked", true);

					date_col_arr[index].empty().append(input_checkbox);
				}
				else
				{
					console.error("date index not found");
				}
			});

			sow_row.append(sow_col);

			for(var i = 0; i < date_col_arr.length; ++i)
			{
				sow_row.append(date_col_arr[i]);
			}

			result = result.add(sow_row);
		});

		// --- add submit button
		submit_button = $("<button>")
							.addClass("form-control btn btn-primary __submit")
							.append("Отправить")
							.attr("data-cost_center_id", cost_center_id)
							.attr("disabled", "")
							.on("click", Submit_ClickHandler);

		// --- add some space before button
		result = result
					.add($("<div>").addClass("row form-group"))
					.add(
						$("<div>").addClass("row form-group").append(
							$("<div>").addClass("col-xs-offset-8 col-xs-4 col-md-offset-10 col-md-2").append(submit_button)
						)
					);

		return result;
	};

	var	Checkbox_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		cost_center_id = curr_tag.attr("data-cost_center_id");
		var		submit_button = $("button.__submit[data-cost_center_id=\"" + cost_center_id + "\"]");

		if($("input.__start_date[data-cost_center_id=\"" + 	cost_center_id + "\"]:checked").length)
		{
			submit_button.removeAttr("disabled");
		}
		else
		{
			submit_button.attr("disabled", "");
		}
	};

	var	Submit_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		cost_center_id = curr_tag.attr("data-cost_center_id");

		if($("input.__start_date[data-cost_center_id=\"" + 	cost_center_id + "\"]:checked").length)
		{
			var		timecard_list = GetTimecardListToSubmit(cost_center_id);

			curr_tag.button("loading");

			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
				 "action": "AJAX_submitTimecardsToInvoice",
				 "timecard_list": timecard_list, 
				 "cost_center_id": cost_center_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#collapsible_select_service_for_invoicing_button").click();
// TODO: scroll down and highlight newly added line 
						submit_callback_global(data.invoice_id);
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
				.always(function()
				{
					setTimeout(function() { curr_tag.button("reset"); }, 500);
				});
		}
		else
		{
			console.error("there are no selected dates");
		}
	};

	var	GetTimecardListToSubmit = function(cost_center_id)
	{
		var		list = [];

		$("input.__start_date[data-cost_center_id=\"" + cost_center_id + "\"]:checked").each(function()
		{
			var		start_date_checkbox = $(this);

			list.push(start_date_checkbox.attr("data-timecard_id"));
		});

		return list.join(",");
	};

	var	GetDateIndex = function(timecard_period_start_arr, period_start)
	{
		var	result = -1;

		for(var i = 0; i < timecard_period_start_arr.length; ++i)
		{
			if(timecard_period_start_arr[i] == period_start)
			{
				result = i;
				break;
			}
		}

		return result;
	};

	var	RenderCostCenterTabs = function(cost_centers)
	{
		$("#select_service_for_invoicing").empty().append(system_calls.GetCostCenterTabs_DOM(cost_centers, "_service", Tab_ClickHandler));
	};

	var	RenderCostCenterPane = function(cost_center_id, content_obj_for_pane)
	{
		$(".__tab_pane_service[data-id=\"" + cost_center_id + "\"]").empty().append(RenderCostCenterPane_DOM(cost_center_id, content_obj_for_pane));
	};

	var	Tab_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	curr_id = curr_tag.attr("data-id");
		var	pane_tag = $(".__tab_pane_service[data-id=\"" + curr_id + "\"]");

		if(pane_tag.html().length) {}
		else
		{
			GetApprovedTimecardListFromServer(curr_id);
		}
	};



	return {
		Init: Init,
		SetSubmit_Callback: SetSubmit_Callback,
	};

};
