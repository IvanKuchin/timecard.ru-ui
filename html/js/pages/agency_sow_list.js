
var	agency_sow_list = agency_sow_list || {};

var	agency_sow_list = (function()
{
	"use strict";

	var	data_global;

	var	Init = function()
	{
		UpdateSOWList();

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initialization applied
		system_calls.CreateAutocompleteWithSelectCallback($("#subcontractor_companies_search"), [{0:"0"}], Subcontractor_Companies_SelectHandler);
		$("#subcontractor_companies_search").on("input", Subcontractor_Companies_InputHandler);


		// --- filters
		$(".__list_filters").on("click", list_filters.ClickHandler);
		$("[data-toggle=\"tooltip\"]").tooltip({ animation: "animated bounceIn"});
	};

	var	UpdateSOWList = function(callback_func)
	{
		var		currTag = $("#sow_list_title");


		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getSoWList",
				include_bt: "true",
				include_tasks: "true",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderSOWList();
					list_filters.ApplyFilterFromURL();

					if(typeof callback_func == "function") callback_func();
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

	var	GetTasksList_DOM = function(sow)
	{
		var		result = $();

		if((typeof(sow) != "undefined") && (typeof(sow.tasks) != "undefined") && sow.tasks.length)
		{
			var		title_row = $("<div>").addClass("row");
			var		title_customer_col = $("<div>").addClass("col-xs-4 col-md-3").append("Заказчик");
			var		title_project_col = $("<div>").addClass("col-xs-4 col-md-3").append("Проект");
			var		title_task_col = $("<div>").addClass("col-xs-4 col-md-3").append("Задача");
			var		title_start_task_col = $("<div>").addClass("col-xs-4 col-md-1").append("Начало");
			var		title_end_task_col = $("<div>").addClass("col-xs-4 col-md-1").append("Окончание");
			var		title_assignee_col = $("<div>").addClass("col-xs-4 col-md-1").append("Кто назначил");

			title_row
				.append(title_customer_col)
				.append(title_project_col)
				.append(title_task_col)
				.append(title_start_task_col)
				.append(title_end_task_col)
				.append(title_assignee_col);

			result = result.add(title_row);

			sow.tasks.forEach(function(task)
			{
				var		task_assignment = system_calls.GetTaskAssignmentObjByTaskID(sow.id, task.id, data_global.task_assignments);

				if((typeof(task_assignment) != "undefined") && (typeof(task_assignment.period_start) != "undefined"))
				{
					var		row				= $("<div>").addClass("row highlight_onhover");
					var		customer_col	= $("<div>").addClass("col-xs-12 col-md-3").append(task.projects[0].customers[0].title);
					var		project_col		= $("<div>").addClass("col-xs-12 col-md-3").append(task.projects[0].title);
					var		task_col		= $("<div>").addClass("col-xs-12 col-md-3").append(task.title);
					var		period_start	= $("<div>").addClass("col-xs-6 col-md-1 font_size_xsmall");
					var		period_end		= $("<div>").addClass("col-xs-6 col-md-1 font_size_xsmall");
					var		assignee_col	= $("<div>").addClass("col-xs-12 col-md-1 font_size_xsmall").append(task_assignment.assignee_user[0].name + " " + task_assignment.assignee_user[0].nameLast);
					var		temp = [];
					var		task_start_date, task_end_date;

					temp = task_assignment.period_start.split("-");
					task_start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
					temp = task_assignment.period_end.split("-");
					task_end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

					row
						.append(customer_col)
						.append(project_col)
						.append(task_col)
						.append(period_start	.append(system_calls.GetFormattedDateFromSeconds(task_start_date.getTime()/1000, "DD MMM YYYY")))
						.append(period_end		.append(system_calls.GetFormattedDateFromSeconds(task_end_date.getTime()/1000, "DD MMM YYYY")))
						.append(assignee_col);

					result = result.add(row);
				}
				else
				{
					console.error("failed result returned from GetTaskAssignmentObjByTaskID call");
				}
			});
		}

		return result;
	};

	var	GetSOWList_DOM = function(sow_list)
	{
		var		result = $();

		if((typeof(sow_list) == "undefined"))
		{
			console.error("sow_list is undefined");
		}
		else
		{

			sow_list = system_calls.SortSoWList(sow_list);

			sow_list.forEach(function(sow_item)
				{
					var		filter_div = $("<div>").addClass("__filterable");

					var		collapsible_div = $("<div>").addClass("collapse out sow")
														.attr("id", "collapsible_sow_" + sow_item.id)
														.on("show.bs.collapse", SoWOpen_ShowHandler)
														.attr("data-sow_id", sow_item.id);
					var		top_shadow_div = $("<div>").addClass("row collapse-top-shadow margin_bottom_20")
														.append("<p></p>");
					var		bottom_shadow_div = $("<div>").addClass("row collapse-bottom-shadow margin_top_20")
														.append("<p></p>");

/*
					var		tasks_list = $("<div>").addClass("form-group");
					var		timecard_approvers_row = $("<div>").addClass("row");
					var		timecard_approvers_col = $("<div>").addClass("col-xs-12");
					var		bt_approvers_row = $("<div>").addClass("row");
					var		bt_approvers_col = $("<div>").addClass("col-xs-12");

					var		bt_expenses_div = $("<div>");
*/

					var		subcontractor_company_info = $("<div>")
																.addClass("__subcontractor_company_info form-group")
																.attr("data-sow_id", sow_item.id);

					var		control_buttons_row = $("<div>").addClass("row form-group");
					var		control_buttons_col = $("<div>").addClass("col-xs-4 col-md-1");
					var		control_buttons_edit = $("<button>")
															.attr("data-sow_id", sow_item.id)
															.addClass("btn btn-primary form-control")
															.on("click", SoWEdit_ClickHandler)
															.append("<i class=\"fa fa-pencil-square-o\" aria-hidden=\"true\"></i>");

					// apply filters
					if(sow_item.status == "signed")
					{
						if(system_calls.willSoWExpire(sow_item, 30).isExpired) filter_div.addClass("__filter_will_expire_in_30_days");
						else if(system_calls.willSoWExpire(sow_item, 60).isExpired) filter_div.addClass("__filter_will_expire_in_60_days");
					}

/*
					// --- build DOM here
					timecard_approvers_col
						.append(system_calls.GetTimecardApprovers_DOM(sow_item));
					bt_approvers_col
						.append(system_calls.GetBTApprovers_DOM(sow_item));

					bt_expenses_div.append(system_calls.GetBTExpenseTemplates_DOM(sow_item, data_global.bt_expense_assignments));


					collapsible_div
						.append(timecard_approvers_row.append(timecard_approvers_col))
						.append(tasks_list.append(GetTasksList_DOM(sow_item)))
						.append(bt_approvers_row.append(bt_approvers_col))
						.append(bt_expenses_div)
*/
					collapsible_div
						.append(top_shadow_div)
						.append(control_buttons_row.append(control_buttons_col.append(control_buttons_edit)))
						.append(subcontractor_company_info)
						.append($("<div>").attr("id", "__sow_dom_container_" + sow_item.id))
						.append(bottom_shadow_div);

					result = result .add(filter_div
										.append(common_timecard.GetSoWTitleRow(sow_item, true))
										.append(collapsible_div)
									);
				});
		}

		return result;
	};

	var	GetSoW_DOM = function(sow_id)
	{
		var		result = $();
		var		sow_item = $("#__sow_company_name_span_" + sow_id).data("sow_json");

/*
		var		filter_div = $("<div>").addClass("__filterable");

		var		collapsible_div = $("<div>").addClass("collapse out sow")
											.attr("id", "collapsible_sow_" + sow_item.id)
											.on("show.bs.collapse", SoWOpen_ShowHandler)
											.attr("data-sow_id", sow_item.id);
		var		top_shadow_div = $("<div>").addClass("row collapse-top-shadow margin_bottom_20")
											.append("<p></p>");
		var		bottom_shadow_div = $("<div>").addClass("row collapse-bottom-shadow margin_top_20")
											.append("<p></p>");
*/
		var		tasks_list = $("<div>").addClass("form-group");

		var		timecard_approvers_row = $("<div>").addClass("row");
		var		timecard_approvers_col = $("<div>").addClass("col-xs-12");

		var		bt_approvers_row = $("<div>").addClass("row");
		var		bt_approvers_col = $("<div>").addClass("col-xs-12");

		var		bt_expenses_div = $("<div>");
		
/*
		var		subcontractor_company_info = $("<div>")
													.addClass("__subcontractor_company_info form-group")
													.attr("data-sow_id", sow_item.id);
		var		control_buttons_row = $("<div>").addClass("row form-group");
		var		control_buttons_col = $("<div>").addClass("col-xs-4 col-md-1");
		var		control_buttons_edit = $("<button>")
												.attr("data-sow_id", sow_item.id)
												.addClass("btn btn-primary form-control")
												.on("click", SoWEdit_ClickHandler)
												.append("<i class=\"fa fa-pencil-square-o\" aria-hidden=\"true\"></i>");
		// apply filters
		if(sow_item.status == "signed")
		{
			if(system_calls.willSoWExpire(sow_item, 30).isExpired) filter_div.addClass("__filter_will_expire_in_30_days");
			if(system_calls.willSoWExpire(sow_item, 60).isExpired) filter_div.addClass("__filter_will_expire_in_60_days");
		}
*/

		// --- build DOM here
		timecard_approvers_col
			.append(system_calls.GetTimecardApprovers_DOM(sow_item));
		bt_approvers_col
			.append(system_calls.GetBTApprovers_DOM(sow_item));

		bt_expenses_div.append(system_calls.GetBTExpenseTemplates_DOM(sow_item, data_global.bt_expense_assignments));

/*
		control_buttons_col.append(control_buttons_edit);
		collapsible_div
			.append(top_shadow_div)
			.append(control_buttons_row.append(control_buttons_col))
			.append(subcontractor_company_info)
			.append(timecard_approvers_row.append(timecard_approvers_col))
			.append(tasks_list.append(GetTasksList_DOM(sow_item)))
			.append(bt_approvers_row.append(bt_approvers_col))
			.append(bt_expenses_div)
			.append(bottom_shadow_div)
			;
*/

		result = result
			.add(timecard_approvers_row.append(timecard_approvers_col))
			.add(tasks_list.append(GetTasksList_DOM(sow_item)))
			.add(bt_approvers_row.append(bt_approvers_col))
			.add(bt_expenses_div)
			;

		return result;
	};

	var	SoWOpen_ShowHandler = function(e)
	{
		var	curr_tag = $(this);
		var	curr_sow_id = curr_tag.attr("data-sow_id");

		if($("#__sow_dom_container_" + curr_sow_id).html().length) {}
		else $("#__sow_dom_container_" + curr_sow_id).append(GetSoW_DOM(curr_sow_id));

		if($("div.__subcontractor_company_info[data-sow_id=\"" + curr_sow_id + "\"]").html().length) {}
		else
		{
			$.getJSON(
				"/cgi-bin/agency.cgi",
				{
					action: "AJAX_getCompanyInfoBySoWID",
					sow_id: curr_sow_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						RenderCompanyInfo(curr_sow_id, data.companies);
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
		}
	};

	var	RenderCompanyInfo = function(sow_id, companies)
	{
		$("div.__subcontractor_company_info[data-sow_id=\"" + sow_id + "\"]").empty().append(system_calls.GetCompanyInfo_DOM(companies));
	};

	var	RenderSOWList = function()
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined"))
		{
			$("#sow_list").empty().append(GetSOWList_DOM(data_global.sow));
		}
		else
		{
			console.error("ERROR: sow list is empty");
		}
	};

	var	SoWEdit_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		sow_id = "" + currTag.data("sow_id");

		if(sow_id.length)
		{
			window.location.href = "/cgi-bin/agency.cgi?action=agency_sow_edit_template&sow_id=" + sow_id + "&rand=" + Math.random() * 987654323567;
		}
		else
		{
			system_calls.PopoverError(currTag, "Некорректный номер договора");
		}

	};

	var	Subcontractor_Companies_InputHandler = function(e)
	{
		var	curr_tag = $(this);
		var	curr_val = curr_tag.val();

		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getSubcontractorCompaniesAutocompleteList",
				name: curr_val,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					system_calls.CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, Subcontractor_Companies_SelectHandler);
				}
				else
				{
					console.error("AJAX_getSubcontractorCompaniesAutocompleteList.done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag.attr("id"), "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag.attr("id"), "Ошибка ответа сервера");
			});
	};

	var	Subcontractor_Companies_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);
		var		curr_action = curr_tag.attr("data-action");


		curr_tag.button("loading");

		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: curr_action,
				company_id: id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					setTimeout(function() { curr_tag.val(""); }, 250);

					UpdateSOWList(function(sow_id)
									{
										$("#collapsible_sow_new_item").collapse("hide");
										system_calls.ScrollToAndHighlight("#__sow_title_span_" + data.sow_id);
									});
				}
				else
				{
					console.error(curr_action + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag.attr("id"), "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag.attr("id"), "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.button("reset");
			});

	};

	return {
		Init: Init
	};
})();
