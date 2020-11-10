var	agency_profile_edit = agency_profile_edit || {};

var	agency_profile_edit = (function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	rand_global;
	var	new_bt_expense_template_global = [];
	var	new_bt_allowance_template_global = [];
	var	new_holiday_calendar_template_global = [];
	var	new_airfare_limitation_by_direction_global;
	var	bt_expense_templates_global = [];
	var	airfare_limitations_by_direction_global = [];
	var	bt_expense_lines_global = [];
	var	company_edit_obj_global;
	var	template_agreement_files_obj_global;

	var	cost_centers_global = [];
	var new_cost_center_global = {};

	var	bt_allowances_global = [];
	var	holiday_calendar_global = [];

	var	Init = function()
	{
		rand_global = Math.round(Math.random() * 876543234567);

		system_calls.SetCurrentScript("agency.cgi");
		company_edit_obj_global = new company_info_edit("");
		company_edit_obj_global.Init(system_calls.UpdateInputFieldOnServer);
		GetAgencyInfoFromServer();

		template_agreement_files_obj_global = new template_agreement_files();
		template_agreement_files_obj_global.Init(system_calls.UpdateInputFieldOnServer);
		template_agreement_files_obj_global.SetType("company");
		template_agreement_files_obj_global.SetHostingTag($("#template_agreement_list"));


		$("#new_task_submit")		.on("click", NewTask_ClickHandler);
		$("#new_employee_submit")	.on("click", NewEmployee_ClickHandler);

		// $("#add_new_bt_expense_line").on("click", Add_ExpenseTemplateLineToExistingTemplate_ClickHandler);
		$("#CostCenter_ChooseDialog .submit").on("click", CostCenterModals_ClickHandler);
		$("#CostCenter_ChooseDialog .remove").on("click", CostCenterModals_ClickHandler);

		$("#AreYouSureRemoveTask .submit")							.on("click", RemoveTask_ClickHandler);
		$("#AreYouSureRemoveEmployee .submit")						.on("click", RemoveEmployee_ClickHandler);
		$("#AreYouSureRemoveBTAllowance .submit")					.on("click", RemoveBTAllowance_ClickHandler);
		$("#AreYouSureRemoveHolidayCalendar .submit")				.on("click", RemoveHolidayCalendar_ClickHandler);
		$("#AreYouSureRemoveExpenseTemplate .submit")				.on("click", RemoveExpenseTemplate_ClickHandler);
		$("#AreYouSureRemoveExpenseTemplateLine .submit")			.on("click", RemoveExpenseTemplateLine_ClickHandler);
		$("#AreYouSureRemoveAirfareLimitationByDirection .submit")	.on("click", RemoveAirfareLimitationByDirection_ClickHandler);

		InitNewBTExpense();
		InitNewBTAllowance();
		InitNewHolidayCalendar();
		InitNewAirfareLimitationByDirection();

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initializtion applied
		system_calls.CreateAutocompleteWithSelectCallback($(".new_employee_name"), [{0:"0"}], NewEmployeeName_Autocomplete_SelectHandler);
		$(".new_employee_name").on("input", NewEmployeeName_Autocomplete_InputHandler);

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initializtion applied
		system_calls.CreateAutocompleteWithSelectCallback($(".new_employee_title"), [{0:"0"}], NewEmployeeTitle_Autocomplete_SelectHandler);
		$(".new_employee_title").on("input", NewEmployeeTitle_Autocomplete_InputHandler);
	};

	var	GetAgencyInfoFromServer = function()
	{
		var		curr_tag = $("#agency_container");


		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_getAgencyInfo",
				include_bt: "true",
				include_tasks: "true",
				include_countries: "true",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					if((typeof(data) != "undefined") && (typeof(data.agencies) != "undefined")  && (typeof(data.countries) != "undefined") && data.agencies.length && data.countries.length)
					{
						// --- init timecard task -> add -> autocomplete
						InitTimecardTaskAddAutocomplete();

						company_edit_obj_global.SetCountriesObj(data.countries);
						bt_expense_templates_global					= CraftBTExpenseObjects(data.agencies[0]);
						airfare_limitations_by_direction_global		= CraftAirfareLimitationsByDirectionObjects(data.agencies[0]);
						cost_centers_global							= agency_cost_center_arr.CraftCostCenterObjects(data.agencies[0]);
						bt_allowances_global						= agency_bt_allowance_arr.CraftBTAllowanceObjects(data.agencies[0]);
						holiday_calendar_global						= agency_holiday_calendar_arr.CraftHolidayCalendarObjects(data.agencies[0], GetAgencyInfoFromServer);

						template_agreement_files_obj_global.SetID(data.agencies[0].companies[0].id);

						RenderAgencyPage(data.agencies[0]);
					}
					else
					{
						system_calls.PopoverError("agency_container", "Ошибка в объекте agencies");
					}
				}
				else
				{
					console.error("AJAX_getAgencyInfo.done(): ERROR: " + data.description);
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

	var CraftBTExpenseObjects = function(agency)
	{
		var		bt_expense_templates = [];

		if((typeof(agency) != "undefined") && (typeof(agency.bt_expense_templates) != "undefined"))
		{
			agency.bt_expense_templates.forEach(function(expense_template)
			{
				var		temp_bt_expense_template;

				temp_bt_expense_template = new bt_expense_template_obj();
				temp_bt_expense_template.Init();
				temp_bt_expense_template.SetGlobalData(expense_template);

				bt_expense_templates.push(temp_bt_expense_template);
			});
		}
		else
		{
			system_calls.PopoverError("agency_container", "Ошибка в объекте agency");
		}

		return bt_expense_templates;
	};

	var CraftAirfareLimitationsByDirectionObjects = function(agency)
	{
		var		airfare_limitations_by_direction = [];

		if((typeof(agency) != "undefined") && (typeof(agency.airfare_limitations_by_direction) != "undefined"))
		{
			agency.airfare_limitations_by_direction.forEach(function(expense_template)
			{
				var		temp_obj;

				temp_obj = new airfare_limitation_by_direction();
				temp_obj.Init();
				temp_obj.SubmitButton("hidden");
				temp_obj.InputFields("disabled");
				temp_obj.SetGlobalData(expense_template);

				airfare_limitations_by_direction.push(temp_obj);
			});
		}
		else
		{
			system_calls.PopoverError("agency_container", "Ошибка в объекте agency");
		}

		return airfare_limitations_by_direction;
	};

	var	GetEditableExpenseList_DOM = function()
	{
		var		result = $();

		var		title_row			= $("<div>").addClass("row form-group");
		var		title_open_col		= $("<div>").addClass("col-xs-2 col-md-1").append("");
		var		title_expense_col	= $("<div>").addClass("col-xs-4 col-md-2").append("Расход");
		var		title_taxable_col	= $("<div>").addClass("col-xs-4 col-md-2").append("Налогоблагаемый");
		var		title_comment_col	= $("<div>").addClass("col-xs-10 col-xs-offset-2 col-md-6 col-md-offset-0").append("Коментарий");
		var		title_remove_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("");

		title_row
			.append(title_open_col)
			.append(title_expense_col)
			.append(title_taxable_col)
			.append(title_comment_col)
			.append(title_remove_col);

		result = result.add(title_row);

		bt_expense_templates_global.forEach(function(item)
		{
			result = result.add(item.GetDOM());
		});

		return result;

	};

	var	GetEditableAirfareLimitationsByDirectionList_DOM = function()
	{
		var		result = $();

		var		title_row			= $("<div>").addClass("row form-group");
		var		padding_col			= $("<div>").addClass("col-md-1").append("");
		var		title_form_col		= $("<div>").addClass("col-xs-4 col-md-2").append("Откуда");
		var		title_to_col		= $("<div>").addClass("col-xs-4 col-md-2").append("Куда");
		var		title_limit_col		= $("<div>").addClass("col-xs-3 col-md-2").append("Цена");
		var		title_remove_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("");

		title_row
			.append(padding_col)
			.append(title_form_col)
			.append(title_to_col)
			.append(title_limit_col)
			.append(title_remove_col);

		result = result.add(title_row);

		airfare_limitations_by_direction_global.forEach(function(item)
		{
			result = result.add(item.GetDOM());
		});

		return result;

	};

	var	GetEditableTasksList_DOM = function(agency)
	{
		var		result = $();

		if((typeof(agency) != "undefined") && (typeof(agency.tasks) != "undefined"))
		{
			var		title_row				= $("<div>").addClass("row");
			var		title_cost_center_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("центр затрат");
			var		title_customer_col		= $("<div>").addClass("col-xs-4 col-md-2").append("Заказчик");
			var		title_project_col		= $("<div>").addClass("col-xs-4 col-md-2").append("Проект");
			var		title_task_col			= $("<div>").addClass("col-xs-4 col-md-2").append("Задача");
			var		reserve1_title_col		= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("");
			var		reserve2_title_col		= $("<div>").addClass("hidden-xs hidden-sm col-md-2").append("");
			var		title_remove_col		= $("<div>").addClass("hidden-xs hidden-sm col-md-2").append("");

			title_row
				.append(title_cost_center_col)
				.append(title_customer_col)
				.append(title_project_col)
				.append(title_task_col)
				.append(reserve1_title_col)
				.append(reserve2_title_col)
				.append(title_remove_col);

			result = result.add(title_row);

			agency.tasks.sort(function(a, b)
			{
				var		cu_a = a.projects[0].customers[0].title;
				var		proj_a = a.projects[0].title;
				var		task_a = a.title;
				var		cu_b = b.projects[0].customers[0].title;
				var		proj_b = b.projects[0].title;
				var		task_b = b.title;
				var		result = 0;

					 if(cu_a < cu_b) { result = -1; }
				else if(cu_a > cu_b) { result =  1; }
				else if(proj_a < proj_b) { result = -1; }
				else if(proj_a > proj_b) { result =  1; }
				else if(task_a < task_b) { result = -1; }
				else if(task_a > task_b) { result =  1; }
				else { result = 0; }

				return result;
			});


			agency.tasks.forEach(function(task)
			{
				if(task.title.length)
				{
					var		row 							= $("<div>").addClass("row highlight_onhover zebra_painting task_" + task.id);
					var		input_customer					= $("<input>").addClass("transparent");
					var		input_project					= $("<input>").addClass("transparent");
					var		input_task						= $("<input>").addClass("transparent");
					var		remove_button					= $("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover height_20px");
					var		cost_center_button				= $("<i>").addClass("fa cursor_pointer animate_skewX_onhover __cost_center_indicator");
					var		cost_center_col					= $("<div>").addClass("col-xs-1 col-md-1");
					var		customer_col					= $("<div>").addClass("col-xs-3 col-md-2");
					var		project_col						= $("<div>").addClass("col-xs-3 col-md-2");
					var		task_col						= $("<div>").addClass("col-xs-4 col-md-6");
					var		remove_col						= $("<div>").addClass("col-xs-1 col-md-1");
					var		temp							= [];
					var		cost_center_assignment_object	= GetCostCenterAssignmentByCustomerID(task.projects[0].customers[0].id);
					var		cost_center_id					= cost_center_assignment_object ? cost_center_assignment_object.cost_center_id : 0;
					var		cost_center_object				= cost_center_assignment_object ? GetCostCenterByCustomerID(task.projects[0].customers[0].id) : undefined;
					var		cost_center_title				= cost_center_object ? cost_center_object.GetTitle() : "";

					row					.attr("data-customer", task.projects[0].customers[0].id)
										.attr("data-project", task.projects[0].id)
										.attr("data-task", task.id);
					input_customer		.val(system_calls.ConvertHTMLToText(task.projects[0].customers[0].title))
										.attr("data-db_value", task.projects[0].customers[0].title);
					input_project		.val(system_calls.ConvertHTMLToText(task.projects[0].title))
										.attr("data-db_value", task.projects[0].title);
					input_task			.val(system_calls.ConvertHTMLToText(task.title))
										.attr("data-db_value", task.title);
					cost_center_button
										.addClass(isCostCenterAssignedToCustomer(task.projects[0].customers[0].id) ? "fa-usd" : "fa-circle-o")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", system_calls.ConvertHTMLToText(cost_center_title))
										.tooltip({ animation: "animated bounceIn"});

					cost_center_button	.attr("data-customer_id", task.projects[0].customers[0].id)
										.attr("data-cost_center_id", cost_center_id)
										.attr("data-id", cost_center_id);
					input_customer		.attr("data-id", task.projects[0].customers[0].id);
					input_project		.attr("data-id", task.projects[0].id);
					input_task			.attr("data-id", task.id);
					remove_button		.attr("data-id", task.id);

					input_customer		.attr("data-action", "AJAX_updateCustomerTitle");
					input_project		.attr("data-action", "AJAX_updateProjectTitle");
					input_task			.attr("data-action", "AJAX_updateTaskTitle");
					remove_button		.attr("data-action", "AJAX_deleteTask");

					cost_center_button	.on("click",  CostCenter_ChooseDialog_ClickHandler);
					input_customer		.on("change", system_calls.UpdateInputFieldOnServer);
					input_project		.on("change", system_calls.UpdateInputFieldOnServer);
					input_task			.on("change", system_calls.UpdateInputFieldOnServer);
					remove_button		.on("click",  RemoveTask_AreYouSure_ClickHandler);

					cost_center_col		.append(cost_center_button);
					customer_col		.append(input_customer)		.append($("<label>"));
					project_col			.append(input_project)		.append($("<label>"));
					task_col			.append(input_task)			.append($("<label>"));
					remove_col			.append(remove_button);

					row
						.append(cost_center_col)
						.append(customer_col)
						.append(project_col)
						.append(task_col)
						.append(remove_col);

					result = result.add(row);
				}
				else
				{
					console.error("ERROR: task title is empty");
				}
			});
		}
		else
		{
			system_calls.PopoverError("agency_container", "Ошибка в объекте agency");
		}

		return result;
	};

	var	GetEditableEmployeeList_DOM = function(company)
	{
		var	result = $();

		if((typeof(company) != "undefined") && (typeof(company.employees) != "undefined") && company.employees.length)
		{
			var		title_row					= $("<div>").addClass("row");
			var		title_employee_name_col		= $("<div>").addClass("hidden-xs hidden-sm col-xs-6 col-md-3").append("Сотрудник");
			var		title_employee_position_col	= $("<div>").addClass("hidden-xs hidden-sm col-xs-6 col-md-4").append("Должность");
			var		title_edit_agency_col		= $("<div>").addClass("hidden-xs hidden-sm col-xs-4 col-md-2").append("Редактирование данных агенства");
			var		title_edit_sow_col			= $("<div>").addClass("hidden-xs hidden-sm col-xs-4 col-md-2").append("Редактирование SoW");
			var		title_remove_col			= $("<div>").addClass("hidden-xs hidden-sm col-xs-4 col-md-1").append("");

			title_row
				.append(title_employee_name_col)
				.append(title_employee_position_col)
				.append(title_edit_agency_col)
				.append(title_edit_sow_col)
				.append(title_remove_col);

			result = result.add(title_row);

			company.employees.forEach(function(employee)
			{
				var		employee_row			= $("<div>").addClass("row highlight_onhover zebra_painting employee_" + employee.id);
				var		employee_name_col		= $("<div>").addClass("col-xs-12 col-md-3");
				var		employee_position_col	= $("<div>").addClass("col-xs-12 col-md-4 form-group");
				var		edit_agency_col			= $("<div>").addClass("col-xs-4 col-md-2 form-group");
				var		edit_sow_col			= $("<div>").addClass("col-xs-4 col-md-2 form-group");
				var		remove_col				= $("<div>").addClass("col-xs-4 col-md-1 form-group");
				var		input_employee_position = $("<input>").addClass("transparent");
				var		remove_button			= $("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover");
				var		edit_agency_switcher;
				var		edit_sow_switcher;

				input_employee_position		.val(employee.position.title)
											.attr("data-id", employee.id)
											.attr("data-db_value", employee.position.title)
											.attr("data-action", "AJAX_updateAgencyPosition")
											.on("change", system_calls.UpdateInputFieldOnServer)
											.on("input", system_calls.Position_InputHandler);

				remove_button				.attr("data-id", employee.id)
											.on("click", RemoveEmployee_AreYouSure_ClickHandler);

// <input id="switcherBirthdayDatePublic" name="switcherBirthdayDatePublic" checked="checked" type="checkbox">
// <label class="switcher" id="switcherLabelBirthdayDatePublic" for="switcherBirthdayDatePublic" data-id="bday" data-action="AJAX_editProfile_setBdayPrivate"></label>
				edit_agency_switcher = $("<div>").addClass("form-switcher")
										.append($("<input>")
											.attr("id", "input_agency_edit_" + employee.id)
											.attr("name", "input_agency_edit_" + employee.id)
											.attr("type", "checkbox")
											.prop("checked", (employee.allowed_change_agency_data == "Y" ? "checked" : ""))
										)
										.append($("<label>")
											.addClass("switcher")											
											.attr("id", "label_agency_edit_" + employee.id)
											.attr("for", "input_agency_edit_" + employee.id)
											.attr("data-id", employee.id)
											.attr("data-action", "AJAX_updateAgencyEditCapability")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "Редактирование данных агенства")
											.on("click", Switcher_ClickHandler)
										);
				edit_sow_switcher = $("<div>").addClass("form-switcher")
										.append($("<input>")
											.attr("id", "input_sow_edit_" + employee.id)
											.attr("name", "input_sow_edit_" + employee.id)
											.attr("type", "checkbox")
											.prop("checked", (employee.allowed_change_sow == "Y" ? "checked" : ""))
										)
										.append($("<label>")
											.addClass("switcher")											
											.attr("id", "label_sow_edit_" + employee.id)
											.attr("for", "input_sow_edit_" + employee.id)
											.attr("data-id", employee.id)
											.attr("data-action", "AJAX_updateSoWEditCapability")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "Редактирование SoW")
											.on("click", Switcher_ClickHandler)
										);


				system_calls.CreateAutocompleteWithSelectCallback(input_employee_position, [{0:"0"}], function() {});

				employee_name_col		.append(employee.user.name + " " + employee.user.nameLast);
				employee_position_col	.append(input_employee_position).append($("<label>"));
				edit_agency_col			.append(edit_agency_switcher);
				edit_sow_col			.append(edit_sow_switcher);
				remove_col				.append(remove_button);

				employee_row
					.append(employee_name_col)
					.append(employee_position_col)
					.append(edit_agency_col)
					.append(edit_sow_col)
					.append(remove_col);

				result = result.add(employee_row);

				edit_agency_switcher.find("label").tooltip({ animation: "animated bounceIn"});
				edit_sow_switcher.find("label").tooltip({ animation: "animated bounceIn"});

			});
		}

		return result;
	};

	var	GetEditableBTAllowanceList_DOM = function()
	{
		var		result = $();

		bt_allowances_global.forEach(function(item)
		{
			result = result.add(item.GetDOM());
		});

		return result;
	};

	var	GetEditableHolidayCalendarList_DOM = function()
	{
		var		result = $();

		holiday_calendar_global.forEach(function(item)
		{
			result = result.add(item.GetDOM());
		});

		return result;
	};

	var	RenderAgencyPage = function(agency)
	{
		$("#agency_container")					.empty().append(company_edit_obj_global.GetDOM(agency.companies[0]));
		$("#task_list")							.empty().append(GetEditableTasksList_DOM(agency));
		$("#expense_list")						.empty().append(GetEditableExpenseList_DOM());
		$("#airfare_limitations_by_direction")	.empty().append(GetEditableAirfareLimitationsByDirectionList_DOM());
		$("#employee_list")						.empty().append(GetEditableEmployeeList_DOM(agency.companies[0]));
		$("#bt_allowance_list")					.empty().append(GetEditableBTAllowanceList_DOM(agency.companies[0]));
		$("#holiday_calendar_list")				.empty().append(GetEditableHolidayCalendarList_DOM(agency.companies[0]));
		
		template_agreement_files_obj_global.Render();
	};

	var	Switcher_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		input_tag = $("#" + $(this).attr("for"));
		var		curr_value = !input_tag.prop("checked");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: curr_tag.data("action"),
				id: curr_tag.data("id"),
				value: (curr_value ? "Y" : "N"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
				}
				else
				{
					// --- install previous value, due to error
					input_tag.prop("checked", !curr_value);

					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				input_tag.prop("checked", !curr_value);
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

		return true;
	};

	var	GetCostCenterSelection_DOM = function(curr_value)
	{
		var		result			= $();

		cost_centers_global.forEach(function(cost_center)
		{
			var	row					= $("<div>").addClass("row");
			var	col_radio			= $("<div>").addClass("col-xs-2 col-md-1");
			var	col_label			= $("<div>").addClass("col-xs-10 col-md-11");
			var	radio_input			= $("<input>");
			var	cost_center_label	= $("<label>");

			radio_input
				.addClass("__cost_center_radio")
				.attr("name", "__cost_center_radio")
				.attr("id", "__cost_center_radio_" + cost_center.GetID())
				.attr("type", "radio")
				.attr("value", cost_center.GetID());

			if(cost_center.GetID() == curr_value) 
				radio_input.prop("checked", true);

			cost_center_label
				.attr("for", "__cost_center_radio_" + cost_center.GetID())
				.append(cost_center.GetTitle());

			col_radio
				.append(radio_input);
			col_label
				.append(cost_center_label);

			row	
				.append(col_radio)
				.append(col_label);

			result = result.add(row);
		});

		return result;
	};

	var	CostCenter_ChooseDialog_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		body_tag = $("#CostCenter_ChooseDialog .modal-body");

		$("#CostCenter_ChooseDialog .submit")
			.removeAttr("data-id")
			.attr("data-id", curr_tag.attr("data-id"));
		$("#CostCenter_ChooseDialog .submit")
			.removeAttr("data-customer_id")
			.attr("data-customer_id", curr_tag.attr("data-customer_id"));
		$("#CostCenter_ChooseDialog .remove")
			.removeAttr("data-id")
			.attr("data-id", curr_tag.attr("data-id"));
		$("#CostCenter_ChooseDialog .remove")
			.removeAttr("data-customer_id")
			.attr("data-customer_id", curr_tag.attr("data-customer_id"));
		$("#CostCenter_ChooseDialog").modal("show");

		body_tag.empty().append(GetCostCenterSelection_DOM(curr_tag.attr("data-cost_center_id")));
	};

	var	RemoveTask_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveTask .submit").attr("data-id", curr_tag.attr("data-id"));
		$("#AreYouSureRemoveTask").modal("show");
	};

	var	RemoveEmployee_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveEmployee .submit").attr("data-id", curr_tag.attr("data-id"));
		$("#AreYouSureRemoveEmployee").modal("show");
	};

	var	RemoveExpenseTemplate_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		task_id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteExpenseTemplate",
				id: curr_tag.attr("data-id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveExpenseTemplate").modal("hide");
					setTimeout(function() {
						$(".expense_template_" + task_id).hide(300);
						$("#collapsible_bt_expense_template_" + task_id).hide(300);
					}, 500);
				}
				else
				{
					// --- install previous value, due to error
					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});
	};

	// --- this function addressing following issue:
	// --- If many "line-objects" registered on the dialog button, they all will fire on "click"-event
	// --- to overcome the issue function below relays "click"-event to appropriate object
	var	RemoveExpenseTemplateLine_ClickHandler = function(e)
	{
		var		callback_func = $("#AreYouSureRemoveExpenseTemplateLine").data("callback_func");

		callback_func();
	};

	var CheckValidity_CostCenter = function(curr_tag)
	{
		var		action		= curr_tag.attr("data-action");
		var		result		= true;

		if(action == "AJAX_assignCostCenterToCustomer")
		{
			if(!$("input.__cost_center_radio[name='__cost_center_radio']:checked").val())
			{
				system_calls.PopoverError(curr_tag, "Необходимо выбрать центр затрат");
				result = false;
			}
		}

		return true;
	};

	var	CostCenterModals_ClickHandler = function(e)
	{
		var		curr_tag	= $(this);
		var		action		= curr_tag.attr("data-action");

		if(CheckValidity_CostCenter(curr_tag))
		{
			var		cost_center_id = $("input.__cost_center_radio[name='__cost_center_radio']:checked").val();

			curr_tag.attr("disabled", "");

			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: action,
					id: curr_tag.attr("data-customer_id"),
					value: cost_center_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						GetAgencyInfoFromServer();

						curr_tag.closest(".modal").modal("hide");
					}
					else
					{
						// --- install previous value, due to error
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
				.always(function(e)
				{
					curr_tag.removeAttr("disabled");
				});
		}
	};

	var	RemoveTask_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		task_id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteTask",
				id: curr_tag.attr("data-id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveTask").modal("hide");
					setTimeout(function() { $(".task_" + task_id).hide(300); }, 300);
					setTimeout(function() { $(".task_" + task_id).remove(); },  600);
				}
				else
				{
					// --- install previous value, due to error
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

	};

	var	RemoveAirfareLimitationByDirection_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteAirfarelimitationByDirection",
				id: curr_tag.attr("data-id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveAirfareLimitationByDirection").modal("hide");
					setTimeout(function() { $(".__airfare_limitation_by_direction_" + id).hide(300); }, 300);
					setTimeout(function() { $(".__airfare_limitation_by_direction_" + id).remove(); },  600);
				}
				else
				{
					// --- install previous value, due to error
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

	};

	var	RemoveEmployee_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		employee_id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteEmployee",
				id: curr_tag.attr("data-id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveEmployee").modal("hide");
					setTimeout(function() { $(".employee_" + employee_id).hide(300); }, 500);
				}
				else
				{
					// --- install previous value, due to error
					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

	};

	var	RemoveBTAllowance_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		item_id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteBTAllowance",
				id: curr_tag.attr("data-id"),
				value: "fake",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveBTAllowance").modal("hide");
					setTimeout(function() { $(".bt_allowance_" + item_id).hide(300); }, 500);
					setTimeout(function() { $(".bt_allowance_" + item_id).remove(); }, 1000);
				}
				else
				{
					// --- install previous value, due to error
					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

	};

	var	RemoveHolidayCalendar_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		item_id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteHolidayCalendar",
				id: curr_tag.attr("data-id"),
				value: "fake",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveHolidayCalendar").modal("hide");
					setTimeout(function() { $(".holiday_calendar_" + item_id).hide(300); }, 500);
					setTimeout(function() { $(".holiday_calendar_" + item_id).remove(); }, 1000);
				}
				else
				{
					// --- install previous value, due to error
					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				curr_tag.removeAttr("disabled");
			});

	};

	var	InitTimecardTaskAddAutocomplete = function()
	{
		var		customer_input = $(".new_customer");
		var		project_input = $(".new_project");
		var		task_input = $(".new_task");
		var		temp = [];
		var		autocomplete_object = {sow:[]};

		autocomplete_object.sow[0] = data_global.agencies[0];

		customer_input
			.attr("id", "customer" + rand_global)
			.attr("data-random", rand_global);
		project_input
			.attr("id", "project" + rand_global)
			.attr("data-random", rand_global);		
		task_input
			.attr("id", "task" + rand_global)
			.attr("data-random", rand_global);

		timecard_autocomplete.Init(autocomplete_object, data_global.agencies[0].id, CallbackAfterTaskSelection);

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initializtion applied
		system_calls.CreateAutocompleteWithSelectCallback(customer_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Customer_SelectHandler);
		customer_input.on("input", timecard_autocomplete.Autocomplete_Customer_InputHandler);

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initializtion applied
		system_calls.CreateAutocompleteWithSelectCallback(project_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Project_SelectHandler);
		project_input.on("input", timecard_autocomplete.Autocomplete_Project_InputHandler);

		// --- if autocomplete functionality is not initialized from the beginning
		// --- it will not pop-up after configured threshold, it will wait one symbol more
		// --- to overcome this fake autocomplete initializtion applied
		system_calls.CreateAutocompleteWithSelectCallback(task_input, [{0:"0"}], timecard_autocomplete.Autocomplete_Task_SelectHandler);
		task_input.on("input", timecard_autocomplete.Autocomplete_Task_InputHandler);
	};

	var	CallbackAfterTaskSelection = function(random, task_id)
	{
		// --- no action needed, just stub function
	};

	var	isValidToSubmitNewTask = function()
	{
		var	error_message	= "";
		var	customer		= system_calls.RemoveSpaces($(".new_customer").val());
		var	project			= system_calls.RemoveSpaces($(".new_project").val());
		var	task			= system_calls.RemoveSpaces($(".new_task").val());

		if(customer.length === 0)
		{
			error_message = "Необходимо заполнить название  Заказчика";
			system_calls.PopoverError($(".new_customer"), error_message);
		}
		if(project.length === 0)
		{
			error_message = "Необходимо заполнить название Проекта";
			system_calls.PopoverError($(".new_project"), error_message);
		}
		if(task.length === 0)
		{
			error_message = "Необходимо заполнить название задачи";
			system_calls.PopoverError($(".new_task"), error_message);
		}

		data_global.agencies[0].tasks.forEach(function(task)
			{
				if(
					(task.title == $(".new_task").val()) &&
					(task.projects[0].title == $(".new_project").val()) &&
					(task.projects[0].customers[0].title == $(".new_customer").val())
				)
				{
					error_message = "Заказчик / Проект / Задача уже существуют";
					system_calls.PopoverError($(".new_task"), error_message);
				}
			});

		return error_message;
	};

	var	isValidToSubmitNewEmployee = function()
	{
		var	error_message = "";
		var	temp;

		if($(".new_employee_name").attr("data-user_id") === "")
		{
			error_message = "Необходимо выбрать ФИО из выпадающего списка";
			system_calls.PopoverError($(".new_employee_name"), error_message);
		}
		if($(".new_employee_title").val() === "")
		{
			error_message = "Необходимо заполнить Должность";
			system_calls.PopoverError($(".new_employee_title"), error_message);
		}

		return error_message;
	};

	var	GetCostCenterAssignmentByCustomerID = function(customer_id)
	{
		var	cost_center_object;

		if(customer_id)
		{
			if((typeof data_global.agencies[0] != "undefined") && (typeof data_global.agencies[0].cost_center_assignment != "undefined"))
			{
				var		cost_center_assignments = data_global.agencies[0].cost_center_assignment;
				for(var i = 0; i < cost_center_assignments.length; ++i)
				{
					if(cost_center_assignments[i].timecard_customer_id == customer_id)
					{
						cost_center_object = cost_center_assignments[i];
						break;
					}
				}
			}
			else
			{
				console.error("error in agency object (cost_center_assignment missed)");
			}
		}
		else
		{
			console.error("customer_id is mandatory parameter");
		}

		return cost_center_object;
	};

	var	GetCostCenterByCustomerID = function(customer_id)
	{
		var	cost_center;

		if(customer_id)
		{
			var		cost_center_assignment = GetCostCenterAssignmentByCustomerID(customer_id);

			for(var i = 0; i < cost_centers_global.length; ++i)
			{
				if(cost_centers_global[i].GetID() == cost_center_assignment.cost_center_id)
				{
					cost_center = cost_centers_global[i];
					break;
				}
			}
		}
		else
		{
			console.error("customer_id is mandatory parameter");
		}

		return cost_center;
	};

	var	isCostCenterAssignedToCustomer = function(customer_id)
	{
		var		result = false;

		if(customer_id)
		{
			if((typeof data_global.agencies[0] != "undefined") && (typeof data_global.agencies[0].cost_center_assignment != "undefined"))
			{
				var		cost_center_assignments = data_global.agencies[0].cost_center_assignment;
				for(var i = 0; i < cost_center_assignments.length; ++i)
				{
					if(cost_center_assignments[i].timecard_customer_id == customer_id)
					{
						result = true;
						break;
					}
				}
			}
			else
			{
				console.error("error in agency object (cost_center_assignment missed)");
			}
		}
		else
		{
			console.error("customer_id is mandatory parameter");
		}

		return result;
	};

	var NewTask_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	error_message = isValidToSubmitNewTask();
		var	action = "AJAX_addTask";

		if(error_message.length)
		{
			system_calls.PopoverError(curr_tag, error_message);
		}
		else
		{
			curr_tag.button("loading");
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: action,
					customer: $(".new_customer").val(),
					project: $(".new_project").val(),
					task: $(".new_task").val(),
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#collapsible_timecard_task_new_item").collapse("hide");
						ResetNewTimecardTask();
						GetAgencyInfoFromServer();
					}
					else
					{
						console.error(action + ".done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 500);
				})
				.always(function(data)
				{
					setTimeout(function() {
						curr_tag.button("reset");
					}, 500);
				});

		}
	};

	var	ResetNewEmployee = function()
	{
		$(".new_employee_name")
								.val("")
								.attr("data-user_id", "");
		$(".new_employee_title").val("");
	};

	var	NewEmployeeName_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);
		var		curr_action = curr_tag.attr("data-user_id", id);
	};

	var	NewEmployeeName_Autocomplete_InputHandler = function()
	{
		var	curr_tag = $(this);
		var	curr_val = curr_tag.val();
		
		curr_tag.attr("data-user_id", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_getUnemployedAgentAutocompleteList",
				name: curr_val,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					system_calls.CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, NewEmployeeName_Autocomplete_SelectHandler);
				}
				else
				{
					system_calls.PopoverInfo(curr_tag.parent(), data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			});
	};

	var	NewEmployeeTitle_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;
	};

	var	NewEmployeeTitle_Autocomplete_InputHandler = function()
	{
		var	curr_tag = $(this);
		var	curr_val = curr_tag.val();

		$.getJSON(
			'/cgi-bin/ajax_anyrole_1.cgi',
			{
				action: "AJAX_getPositionAutocompleteList",
				position: curr_val,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					system_calls.CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, NewEmployeeTitle_Autocomplete_SelectHandler);
				}
				else
				{
					system_calls.PopoverInfo(curr_tag.parent(), data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			});
	};

	var NewEmployee_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	error_message = isValidToSubmitNewEmployee();
		var	action = "AJAX_addNewEmployee";

		if(error_message.length)
		{
			system_calls.PopoverError(curr_tag, error_message);
		}
		else
		{
			curr_tag.button("loading");
			$.getJSON('/cgi-bin/agency.cgi',
				{
					action: action,
					user_id: $(".new_employee_name").attr("data-user_id"),
					title: $(".new_employee_title").val(),
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#collapsible_new_employee").collapse("hide");
						ResetNewEmployee();
						GetAgencyInfoFromServer();
					}
					else
					{
						console.error(action + ".done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					// setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					// }, 500);
				})
				.always(function(data)
				{
					setTimeout(function() {
						curr_tag.button("reset");
					}, 500);
				});
		}
	};

	var	InitNewBTExpense = function()
	{
		new_bt_expense_template_global = new bt_expense_template_obj();
		new_bt_expense_template_global.Init();
		new_bt_expense_template_global.SetGlobalData();
		new_bt_expense_template_global.DefaultExpand();
		new_bt_expense_template_global.ExpandButton("hidden");
		new_bt_expense_template_global.RemoveButton("hidden");
		new_bt_expense_template_global.ExpenseSubmitButton("");
		new_bt_expense_template_global.SetSubmitCallback(NewBTExpenseTemplate_Callback);


		$("#new_bt_expense_template").empty().append(new_bt_expense_template_global.GetDOM());
	};

	var	InitNewBTAllowance = function()
	{
		new_bt_allowance_template_global = new agency_bt_allowance_obj();
		new_bt_allowance_template_global.Init();
		new_bt_allowance_template_global.SetGlobalData();
		new_bt_allowance_template_global.DefaultExpand();
		new_bt_allowance_template_global.SubmitButton("");
		new_bt_allowance_template_global.ResetFormButton("", InitNewBTAllowance);
		new_bt_allowance_template_global.ExpandButton("hidden");
		new_bt_allowance_template_global.RemoveButton("hidden");
		new_bt_allowance_template_global.SetSubmitCallback(NewBTAllowanceTemplate_Callback);


		$("#new_bt_allowance_template").empty().append(new_bt_allowance_template_global.GetDOM());
	};

	var	InitNewHolidayCalendar = function()
	{
		new_holiday_calendar_template_global = new agency_holiday_calendar_obj();
		new_holiday_calendar_template_global.Init();
		new_holiday_calendar_template_global.SetGlobalData();
		new_holiday_calendar_template_global.DefaultExpand();
		new_holiday_calendar_template_global.SubmitButton("");
		new_holiday_calendar_template_global.ResetFormButton("", InitNewHolidayCalendar);
		new_holiday_calendar_template_global.ExpandButton("hidden");
		new_holiday_calendar_template_global.RemoveButton("hidden");
		new_holiday_calendar_template_global.SetSubmitCallback(NewHolidayCalendarTemplate_Callback);


		$("#new_holiday_calendar_template").empty().append(new_holiday_calendar_template_global.GetDOM());
	};


	var	InitNewAirfareLimitationByDirection = function()
	{
		new_airfare_limitation_by_direction_global = new airfare_limitation_by_direction();
		new_airfare_limitation_by_direction_global.Init();
		new_airfare_limitation_by_direction_global.RemoveButton("hidden");
		new_airfare_limitation_by_direction_global.SetGlobalData();
		new_airfare_limitation_by_direction_global.DisableZebraPaint();
		new_airfare_limitation_by_direction_global.SetSubmitCallback(NewAirfareLimitationByDirection_Callback);


		$("#new_airfare_limitation_by_direction").empty().append(new_airfare_limitation_by_direction_global.GetDOM());
	};



	var	NewBTExpenseTemplate_Callback = function()
	{
		$("#collapsible_bt_expense_new_item").collapse("hide");
		InitNewBTExpense();
		GetAgencyInfoFromServer();
	};

	var	NewBTAllowanceTemplate_Callback = function()
	{
		$("#collapsible_bt_allowance_new_item").collapse("hide");
		InitNewBTAllowance();
		GetAgencyInfoFromServer();
	};

	var	NewHolidayCalendarTemplate_Callback = function()
	{
		$("#collapsible_holiday_calendar_new_item").collapse("hide");
		InitNewHolidayCalendar();
		GetAgencyInfoFromServer();
	};

	var	NewAirfareLimitationByDirection_Callback = function()
	{
		$("#collapsible_airfare_limitation_by_direction_new_item").collapse("hide");
		InitNewAirfareLimitationByDirection();
		GetAgencyInfoFromServer();
	};

	var	ResetNewTimecardTask = function()
	{
		$(".new_customer").val("");
		$(".new_project").val("");
		$(".new_task").val("");
	};

	return {
		Init: Init,
		CallbackAfterTaskSelection: CallbackAfterTaskSelection,
	};

})();
