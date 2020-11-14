var	agency_bt_expense_template_assignment_dialog = function()
{
	"use strict";

	var random_global;
	var	data_global;
	var	enabled_expense_templates_global = [];
	var	all_expense_templates_global = [];
	var	available_expense_templates_global = [];
	var	submit_callback_global;
	var	sow_id_global = "";

	var	Init = function()
	{
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__bt_expense_template[data-random=\"" + random_global + "\"]").length);

		$("#AgencyBTExpenseTemplateAssignmentDialog .submit").on("click", Submit_ClickHandler);
	};

	var SetSoWID = function(sow_id)	{ sow_id_global = sow_id; };
	var SetSubmitCallback = function(f)	{ submit_callback_global = f; };

	var	Submit_ClickHandler = function(e)
	{
		var curr_tag = $(this);
		var values = [];

		$("input.__bt_expense_template_checkbox").each(function()
		{
			if($(this).prop("checked")) values.push($(this).val());
		});

		if(sow_id_global.length)
		{
			curr_tag.button("loading");
			$.getJSON(
				"/cgi-bin/agency.cgi",
				{
					action: "AJAX_addBTExpenseTemplateAssignment",
					bt_expense_templates: values.join(","),
					sow_id: sow_id_global,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						if(typeof submit_callback_global == "function")
						{
							$("#AgencyBTExpenseTemplateAssignmentDialog").modal("hide");
							submit_callback_global();
						}
					}
					else
					{
						console.error("AJAX_getSoW.done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
				.always(function(data)
				{
					setTimeout(function() {
						curr_tag.button("reset");
					}, 200);
				});
		}
		else
		{
			console.error("require sow_id");
		}

	};

	var	GetDOM = function(expense_list)
	{
		var		result = $();
		var		tmp_result = $();

		if(expense_list.length > 3)
		{
			var		row				= $("<div>")	.addClass("row form-group");
			var		col_checkbox	= $("<div>")	.addClass("col-xs-2");
			var		col_title		= $("<div>")	.addClass("col-xs-10");
			var		select_all		= $("<input>")	.addClass("__bt_expense_template_checkbox_select_all");

			col_title		.append("Выбрать все");
			col_checkbox	.append(select_all);
			select_all		
							.attr("type", "checkbox")
							.on("change", SelectAll_ChangeHandler);

			row
					.append(col_checkbox)
					.append(col_title);

			tmp_result = tmp_result.add(row);
		}

		expense_list.forEach(function(expense)
			{
				var		row				= $("<div>")	.addClass("row");
				var		col_checkbox	= $("<div>")	.addClass("col-xs-2");
				var		col_title		= $("<div>")	.addClass("col-xs-10");
				var		checkbox		= $("<input>")	.addClass("__bt_expense_template_checkbox");
// <input type="checkbox" class="friend_checkbox" id="checkbox25" value="25">

				col_title		.append(expense.title);
				col_checkbox	.append(checkbox);
				checkbox		
								.attr("type", "checkbox")
								.on("change", EnableDisableSubmitButton_ChangeHandler)
								.val(expense.id);

				row
						.append(col_checkbox)
						.append(col_title);

				tmp_result = tmp_result.add(row);
			});

		if(expense_list.length)
		{
			result = result.add(tmp_result);
		}

		return	result;
	};

	var	SelectAll_ChangeHandler = function(e)
	{
		var	curr_tag = $(this);
		var	is_selected = curr_tag.prop("checked");
		var	i = 0;

		$("input.__bt_expense_template_checkbox").each(function()
		{
			var	curr_checkbox = $(this);

			setTimeout(function()
				{
					if(is_selected && !curr_checkbox.prop("checked"))
						curr_checkbox.click();
					if(!is_selected && curr_checkbox.prop("checked"))
						curr_checkbox.click();
				}, i++ * 100);
		});
	};

	var	EnableDisableSubmitButton_ChangeHandler = function(e)
	{
		var	curr_tag = $(this);
		var	any_checked = false;

		$("input.__bt_expense_template_checkbox").each(function()
		{
			var	curr_checkbox = $(this);

			if(curr_checkbox.prop("checked")) any_checked = true;
		});

		if(any_checked)
			$("#AgencyBTExpenseTemplateAssignmentDialog .submit").removeAttr("disabled");
		else
			$("#AgencyBTExpenseTemplateAssignmentDialog .submit").attr("disabled", "");

	};

	var	GetCurrentEnabledList = function()
	{
		var result = [];

		$("div.row.bt_expense_assignment").each(function()
			{
				var	curr_tag = $(this);

				result.push(parseInt(curr_tag.attr("data-bt_expense_template_id")));
			});

		return	result;
	};

	var	GetAllAvailableBTExpensesFromServer = function()
	{
		var		curr_tag = $("#AgencyBTExpenseTemplateAssignmentDialog .submit");

		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getBTExpenseTemplates",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					if((typeof(data.bt_expense_templates) != "undefined") && data.bt_expense_templates.length)
					{
						all_expense_templates_global = data.bt_expense_templates;

						RenderDialogBody();
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка в массиве компенсируемых расходов");
					}
				}
				else
				{
					console.error("AJAX_getSoW.done(): ERROR: " + data.description);
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

	var	ShouldKeepExpense = function(expense)
	{
		return !enabled_expense_templates_global.find(function(val) { return val == expense.id; });
	};

	var	RenderDialogBody = function()
	{
		var		body_dom;

		enabled_expense_templates_global = GetCurrentEnabledList();
		available_expense_templates_global = all_expense_templates_global.filter(ShouldKeepExpense);

		body_dom = GetDOM(available_expense_templates_global);

		$("#AgencyBTExpenseTemplateAssignmentDialog .modal-body").empty().append(body_dom);

		return;
	};

	var	Fire = function()
	{
		$("#AgencyBTExpenseTemplateAssignmentDialog").modal("show");
		$("#AgencyBTExpenseTemplateAssignmentDialog .submit").attr("disabled", "");

		GetAllAvailableBTExpensesFromServer();

	};

	return {
		Init: Init,
		GetDOM: GetDOM,
		Fire: Fire,
		SetSubmitCallback: SetSubmitCallback,
		SetSoWID: SetSoWID,
	};
};
