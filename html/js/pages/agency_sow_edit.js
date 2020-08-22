var	agency_sow_edit = agency_sow_edit || {};

var	agency_sow_edit = (function()
{
	'use strict';

    var	CONST_CHOOSE_CUSTOMER = "выберите заказчика";
    var	CONST_CHOOSE_PROJECT = "выберите проект";
    var	CONST_CHOOSE_TASK = "выберите задачу";
	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	suffix_global = "new";
	var	approver_root_tag_global = "#approver_tabs";
	var	CustomersProjectsTasks_Select_global;
	var	data_global;
	var	agency_global;
	var	rand_global;
	var	psow_list_global;
	var	approver_list_global;
	var	bt_expense_assignment_dialog_global;
	var	template_agreement_files_obj_global;
	var	custom_fields_sources_global;

	var	Init = function()
	{
		var		sow_id = $.urlParam("sow_id");

		rand_global = Math.round(Math.random() * 876543234567);

		if(sow_id.length)
			GetSOWFromServer(sow_id);
		else
			system_calls.PopoverError("sow_container", "Некорректный номер договора");

		// --- timecard approval initialization scope
		{
			$("#collapsible_timecard_task_assignment_new_item").on("show.bs.collapse", NewAssignment_ShowHandler);
			$("#new_assignment_submit").on("click", NewAssignment_ClickHandler);

			// --- init new assignment start period
			$(".new_assignment_start")
								.datepicker({
								    dateFormat: DATE_FORMAT_GLOBAL,

									firstDay: 1,
									dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
									dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
									monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
									monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
									changeMonth: true,
									changeYear: true,
									defaultDate: "+0d",
									numberOfMonths: 1,
									yearRange: "1960:2030",
									showOtherMonths: true,
									selectOtherMonths: true
								})
						        .on( "change", function() {
							          $(".new_assignment_end").datepicker( "option", "minDate", $(this).val() );
						        });

			// --- init new assignment end period
			$(".new_assignment_end")
								.datepicker({
								    dateFormat: DATE_FORMAT_GLOBAL,

									firstDay: 1,
									dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
									dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
									monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
									monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
									changeMonth: true,
									changeYear: true,
									defaultDate: "+0d",
									numberOfMonths: 1,
									yearRange: "1960:2030",
									showOtherMonths: true,
									selectOtherMonths: true
								})
						        .on( "change", function() {
							          $(".new_assignment_start").datepicker( "option", "maxDate", $(this).val() );
						        });


			CustomersProjectsTasks_Select_global = new CustomersProjectsTasks_Select(suffix_global);
			CustomersProjectsTasks_Select_global.Init();

			// --- task self assignment
			$("#label_self_task_assignment").on("click", SelfTask_Assignment_ClickHandler);
			
			$("#AreYouSureRemoveCustomField .submit").on("click", RemoveCustomField_ClickHandler);
			$("#AreYouSureRemoveTaskAssignment .submit").on("click", RemoveTaskAssignment_ClickHandler);
			$("#AreYouSureRemoveBTExpenseAssignment .submit").on("click", RemoveBTExpenseAssignment_ClickHandler);

			$("#AreYouSureSubcontractorTaskCreation .submit").on("click", function() 
																			{ 
																				$("#AreYouSureSubcontractorTaskCreation").modal("hide");
																				SubcontractorCreateTasks(true); 
																			});
		}

		// --- agreements generation / removal
		{
			$("#generate_agreement_doc_set").on("click", function() { $("#AreYouSureGenerateAgreementDocSet").modal("show"); });
			$("#AreYouSureGenerateAgreementDocSet .submit").on("click", GenerateAgreementDocSet_ClickHandler);

			$("#remove_agreement_doc_set").on("click", function() { $("#AreYouSureRemoveAgreementDocSet").modal("show"); });
			$("#AreYouSureRemoveAgreementDocSet .submit").on("click", RemoveAgreementDocSet_ClickHandler);
		}

		// --- sow removal
		{
			$("#sow_remove_link").on("click", function() { $("#AreYouSure_RemoveSoW").modal("show"); });
			$("#AreYouSure_RemoveSoW .submit").on("click", RemoveSoW_ClickHandler);
		}

		// --- bt expense template assignment dialog 
		{
			bt_expense_assignment_dialog_global = new agency_bt_expense_template_assignment_dialog();
			bt_expense_assignment_dialog_global.Init();
			bt_expense_assignment_dialog_global.SetSoWID(sow_id);
			bt_expense_assignment_dialog_global.SetSubmitCallback(BTExpenseAssignment_Submit_Callback);
			$("#bt_expense_assignment_new_item_dialog").on("click", bt_expense_assignment_dialog_global.Fire);
		}

		{
			template_agreement_files_obj_global = new template_agreement_files();
			template_agreement_files_obj_global.Init(system_calls.UpdateInputFieldOnServer);
			template_agreement_files_obj_global.SetType("sow");
			template_agreement_files_obj_global.SetHostingTag($("#template_agreement_list"));
		}

		// --- custom fields puller
		{
			$("#pull_out_custom_fields_form_another_sow").on("click", PullOutCustomFieldsFromAnotherSoW_ClickHandler);
			$("#PullOutCustomFieldsModal .submit").on("click", PullOutCustomFieldsFromAnotherSoW_SubmitHandler);
		}
	};

	var BTExpenseAssignment_Submit_Callback = function(bt_expense_templates)
	{
		GetSOWFromServer(data_global.sow[0].id);
	};

	var	GetSOWFromServer = function(sow_id)
	{
		var		currTag = $("#sow_container");


		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_getSoWList",
				include_bt: "true",
				include_tasks: "true",
				include_cost_centers: "true",
				sow_id: sow_id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					if((typeof(data) != "undefined") && (typeof(data.sow) != "undefined") && data.sow.length)
					{
						psow_list_global		= agency_psow_obj_supplemental.GetPSoWArr(data.sow[0]);
						approver_list_global	= agency_approvers_obj.Init(data.sow[0], approver_root_tag_global);

						template_agreement_files_obj_global.SetID(data.sow[0].id);

						RenderSOW(data.sow[0]);
					}
					else
					{
						system_calls.PopoverError("sow_container", "Ошибка в объекте sow");
					}
				}
				else
				{
					console.error("AJAX_getSoW.done(): ERROR: " + data.description);
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

	var	GetEditableTasksListAssignment_DOM = function(sow)
	{
		var		result = $();

		if((typeof(sow) != "undefined") && (typeof(sow.tasks) != "undefined"))
		{
			var		title_row			= $("<div>").addClass("row");
			var		title_customer_col	= $("<div>").addClass("col-xs-4 col-md-2").append("Заказчик");
			var		title_project_col	= $("<div>").addClass("col-xs-4 col-md-3").append("Проект");
			var		title_task_col		= $("<div>").addClass("col-xs-4 col-md-4").append("Задача");
			var		start_task_col		= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("Начало");
			var		end_task_col		= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("Окончание");
			var		title_remove_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("");

			title_row
				.append(title_customer_col)
				.append(title_project_col)
				.append(title_task_col)
				.append(start_task_col)
				.append(end_task_col)
				.append(title_remove_col);

			result = result.add(title_row);

			sow.tasks.forEach(function(task)
			{
				var		task_assignment = system_calls.GetTaskAssignmentObjByTaksID(sow.id, task.id, data_global.task_assignments);

				if((typeof(task_assignment) != "undefined") && (typeof(task_assignment.period_start) != "undefined"))
				{
					var		row = 				$("<div>").addClass("row highlight_onhover zebra_painting task_assignment task_assignment_" + task_assignment.id);
					var		input_customer =	$("<input>").addClass("transparent");
					var		input_project =		$("<input>").addClass("transparent");
					var		input_task =		$("<input>").addClass("transparent");
					var		input_period_start=	$("<input>").addClass("transparent");
					var		input_period_end=	$("<input>").addClass("transparent");
					var		remove_button	=	$("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer");
					var		customer_col = 		$("<div>").addClass("col-xs-4 col-md-2");
					var		project_col = 		$("<div>").addClass("col-xs-4 col-md-3");
					var		task_col = 			$("<div>").addClass("col-xs-4 col-md-4");
					var		period_start = 		$("<div>").addClass("col-xs-4 col-md-1");
					var		period_end = 		$("<div>").addClass("col-xs-4 col-md-1");
					var		remove_col =		$("<div>").addClass("col-xs-4 col-md-1");
					var		temp = [];
					var		task_start_date, task_end_date;

					temp = task_assignment.period_start.split('-');
					task_start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
					temp = task_assignment.period_end.split('-');
					task_end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

					input_customer		.val(system_calls.ConvertHTMLToText(task.projects[0].customers[0].title))
										.attr("data-db_value", task.projects[0].customers[0].title);
					input_project		.val(system_calls.ConvertHTMLToText(task.projects[0].title))
										.attr("data-db_value", task.projects[0].title);
					input_task			.val(system_calls.ConvertHTMLToText(task.title))
										.attr("data-db_value", task.title);
					input_period_start	.val(system_calls.GetFormattedDateFromSeconds(task_start_date.getTime()/1000, "DD/MM/YYYY"))
										.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(task_start_date.getTime()/1000, "DD/MM/YYYY"));
					input_period_end	.val(system_calls.GetFormattedDateFromSeconds(task_end_date.getTime()/1000, "DD/MM/YYYY"))
										.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(task_end_date.getTime()/1000, "DD/MM/YYYY"));

					input_period_start	.datepicker({
										    dateFormat: DATE_FORMAT_GLOBAL,

											firstDay: 1,
											dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
											dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
											monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
											monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
											changeMonth: true,
											changeYear: true,
											defaultDate: "+0d",
											numberOfMonths: 1,
											yearRange: "1960:2030",
											showOtherMonths: true,
											selectOtherMonths: true
										});

					input_period_end	.datepicker({
										    dateFormat: DATE_FORMAT_GLOBAL,

											firstDay: 1,
											dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
											dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
											monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
											monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
											changeMonth: true,
											changeYear: true,
											defaultDate: "+0d",
											numberOfMonths: 1,
											yearRange: "1960:2030",
											showOtherMonths: true,
											selectOtherMonths: true
										});


					input_customer		.attr("data-id", task.projects[0].customers[0].id);
					input_project		.attr("data-id", task.projects[0].id);
					input_task			.attr("data-id", task.id);
					input_period_start	.attr("data-id", task_assignment.id);
					input_period_end	.attr("data-id", task_assignment.id);
					remove_button		.attr("data-id", task_assignment.id);

					input_customer		.attr("data-action", "AJAX_updateCustomerTitle");
					input_project		.attr("data-action", "AJAX_updateProjectTitle");
					input_task			.attr("data-action", "AJAX_updateTaskTitle");
					input_period_start	.attr("data-action", "AJAX_updatePeriodStart");
					input_period_end	.attr("data-action", "AJAX_updatePeriodEnd");
					remove_button		.attr("data-action", "AJAX_deleteTaskAssignment");

					input_customer		.on("change", UpdateTimecardTask_ChangeHandler);
					input_project		.on("change", UpdateTimecardTask_ChangeHandler);
					input_task			.on("change", UpdateTimecardTask_ChangeHandler);
					input_period_start	.on("change", UpdateTimecardTask_ChangeHandler);
					input_period_end	.on("change", UpdateTimecardTask_ChangeHandler);
					remove_button		.on("click",  RemoveTaskAssignment_AreYouSure_ClickHandler);

					customer_col	.append(input_customer)		.append($("<label>"));
					project_col		.append(input_project)		.append($("<label>"));
					task_col		.append(input_task)			.append($("<label>"));
					period_start	.append(input_period_start)	.append($("<label>"));
					period_end		.append(input_period_end)	.append($("<label>"));
					remove_col		.append(remove_button);

					row
						.append(customer_col)
						.append(project_col)
						.append(task_col)
						.append(period_start)
						.append(period_end)
						.append(remove_col);

					result = result.add(row);
				}
				else
				{
					console.error("failed result returned from GetTaskAssignmentObjByTaksID call");
				}
			});
		}
		else
		{
			system_calls.PopoverError("sow_container", "Ошибка в объекте sow");
		}

		return result;
	};

	var	Tab_CostCenter_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		curr_id = curr_tag.attr("data-id");
		var		target_elem_class = curr_tag.attr("data-target_elem_class");
		var		pane_tag = $("." + target_elem_class + "[data-id=\"" + curr_id + "\"]");
		var		psow_map = agency_psow_obj_supplemental.GetPSoWMapByCostCenterID(psow_list_global);
		var		psow;

		if(pane_tag.html().length) {}
		else
		{
			console.debug("---- render Pane.id: " + curr_id);

			if(psow_map[curr_id]) {}
			else 
			{
				// --- if psow_obj doesn't exists in DB, crteate empty object for GUI-rendering purposes only.
				psow = new agency_psow_obj();
				psow.Init();
				psow.SetGlobalData();

				psow_list_global.push(psow);
				psow_map[cost_center.id] = psow;
			}

			$("." + target_elem_class + "[data-id=\"" + curr_id + "\"]").append(psow_map[curr_id].GetDOM());
		}

	};

	// --- this is just stub, doing nothing
/*	var	Tab_Approver_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		curr_id = curr_tag.attr("data-id");
		var		target_elem_class = curr_tag.attr("data-target_elem_class");
		var		pane_tag = $("." + target_elem_class + "[data-id=\"" + curr_id + "\"]");

		if(pane_tag.html().length) {}
		else
		{
			// $("." + target_elem_class + "[data-id=\"" + curr_id + "\"]").append(agency_approvers_obj.GetDOM(curr_id));
		}

	};
*/
	var	GetEditableBTExpenseListAssignment_DOM = function(sow)
	{
		var		result = $();

		if((typeof(sow) != "undefined") && (typeof(sow.bt_expense_templates) != "undefined"))
		{
			var		title_row			= $("<div>").addClass("row");
			var		title_expand_col	= $("<div>").addClass("col-xs-2 col-md-1");
			var		title_bt_expense_col= $("<div>").addClass("col-xs-4 col-md-2").append("Расход");
			var		title_bt_desc_col	= $("<div>").addClass("col-xs-4 col-md-7").append("Описание");
			var		title_remove_col	= $("<div>").addClass("col-xs-2 col-md-2").append("");

			title_row
				.append(title_expand_col)
				.append(title_bt_expense_col)
				.append(title_bt_desc_col)
				.append(title_remove_col);

			result = result.add(title_row);

			sow.bt_expense_templates.forEach(function(bt_expense_template)
			{
				var		bt_expense_assignment = system_calls.GetBTExpenseAssignmentObjByTemplateID(bt_expense_template.id, data_global.bt_expense_assignments);

				if((typeof(bt_expense_assignment) != "undefined"))
				{
					var		row					= $("<div>")	.addClass("row highlight_onhover zebra_painting bt_expense_assignment bt_expense_assignment_" + bt_expense_assignment.id);
					var		expand_button		= $("<i>")		.addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover");
					var		remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer");

					var		expand_col			= $("<div>")	.addClass("col-xs-2 col-md-1");
					var		title_col			= $("<div>")	.addClass("col-xs-4 col-md-2");
					var		description_col		= $("<div>")	.addClass("col-xs-4 col-md-7");
					var		remove_col			= $("<div>")	.addClass("col-xs-2 col-md-2");

					var		collapsible_row		= $("<div>")	.addClass("row collapse");
					var		collapsible_top		= $("<div>")	.addClass("col-xs-12 collapse-top-shadow margin_bottom_20");
					var		collapsible_bottom	= $("<div>")	.addClass("col-xs-12 collapse-bottom-shadow margin_top_20");
					var		collapsible_content	= $("<div>")	.addClass("col-xs-12");

					row					.attr("data-bt_expense_template_id", bt_expense_template.id);
					expand_button
										.attr("data-target", "collapsible_bt_expense_template_" + bt_expense_template.id)
										.attr("data-toggle", "collapse")
										.on("click", function() 
											{
												$("#" + $(this).attr("data-target")).collapse("toggle");
											});

					remove_button		.attr("data-id", bt_expense_assignment.id);
					remove_button		.attr("data-action", "AJAX_deleteBTExpenseAssignment");
					remove_button		.on("click", RemoveBTExpenseAssignment_AreYouSure_ClickHandler);

					collapsible_row		.attr("id", "collapsible_bt_expense_template_" + bt_expense_template.id);

					collapsible_row		.append(collapsible_top)
										.append(collapsible_content.append(GetBTExpenseTemplateLines_DOM(bt_expense_template)))
										.append(collapsible_bottom);

					expand_col			.append(expand_button);
					title_col			.append(bt_expense_template.title);
					description_col		.append(bt_expense_template.agency_comment);
					remove_col			.append(remove_button);

					row
						.append(expand_col)
						.append(title_col)
						.append(description_col)
						.append(remove_col);

					result = result.add(row);
					result = result.add(collapsible_row);
				}
				else
				{
					console.error("failed to find bt_expense_assignment");
				}
			});
		}
		else
		{
			system_calls.PopoverError("sow_container", "Ошибка в объекте sow");
		}

		return result;
	};

	var	GetBTExpenseTemplateLines_DOM = function(bt_expense_template)
	{
		var	result = $();

		var		title_row_content 		= $("<div>")	.addClass("row zebra_painting highlight_onhover");
		var		title_mandatory_col		= $("<div>")	.addClass("col-xs-4 col-md-1").append("Обяз");
		var		title_cash_col			= $("<div>")	.addClass("col-xs-4 col-md-1").append("Нал.");
		var		title_card_col			= $("<div>")	.addClass("col-xs-4 col-md-1").append("Карта");
		var		title_title_col			= $("<div>")	.addClass("hidden-xs hidden-sm col-md-2").append("Название");
		var		title_description_col	= $("<div>")	.addClass("hidden-xs hidden-sm col-md-4").append("Описание");
		var		title_tooltip_col		= $("<div>")	.addClass("hidden-xs hidden-sm col-md-3").append("Подсказка");

		title_row_content
			.append(title_mandatory_col)
			.append(title_cash_col)
			.append(title_card_col)
			.append(title_title_col)
			.append(title_description_col)
			.append(title_tooltip_col);

		result = result.add(title_row_content);


		bt_expense_template.line_templates.forEach(function(line_template)
		{
			var		row_content 	= $("<div>")	.addClass("row zebra_painting highlight_onhover");
			var		mandatory_col	= $("<div>")	.addClass("col-xs-4 col-md-1");
			var		cash_col		= $("<div>")	.addClass("col-xs-4 col-md-1");
			var		card_col		= $("<div>")	.addClass("col-xs-4 col-md-1");
			var		title_col		= $("<div>")	.addClass("col-xs-12 col-md-2");
			var		description_col	= $("<div>")	.addClass("col-xs-12 col-md-4");
			var		tooltip_col		= $("<div>")	.addClass("col-xs-12 col-md-3");

			if(line_template.required == "Y")
				mandatory_col.append("<i class=\"fa fa-exclamation-triangle\" aria-hidden=\"true\"></i>");
			if(line_template.payment.search("cash") >= 0)
				cash_col	.append("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>");
			if(line_template.payment.search("card") >= 0)
				card_col	.append("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>");

			title_col		.append(line_template.title);
			description_col	.append(line_template.description);
			tooltip_col		.append(line_template.tooltip);

			row_content
				.append(mandatory_col)
				.append(cash_col)
				.append(card_col)
				.append(title_col)
				.append(description_col)
				.append(tooltip_col);

			result = result.add(row_content);
		});

		return	result;
	};

	var	RenderSOW = function(sow)
	{
		RenderCommonInfo(sow);
		RenderSoWCustomFields(sow);

		RenderCostCenterTabs(sow);

		$("#task_list")				.empty().append(GetEditableTasksListAssignment_DOM(sow));
		RenderBTExpenseList(sow);


		RenderApprovers(sow);

		RenderSubcontractorCreateTasks(sow);

		template_agreement_files_obj_global.Render();

		RenderAgreementGenerationControlButtons();
	};

	var	RenderAgreementGenerationControlButtons = function()
	{
		if(data_global.sow[0].status == "negotiating")
		{
			$(".row.generate_agreement").show(250);
		}
		else
		{
			$(".row.generate_agreement").hide(250);
		}
	};

	var	RenderCommonInfo = function(sow)
	{
		var	temp_sign_date = sow.sign_date.split('-');
		var	temp_start_date = sow.start_date.split('-');
		var	temp_end_date = sow.end_date.split('-');

		var	sow_sign_date = new Date();
		var	sow_start_date = new Date();
		var	sow_end_date = new Date();

		if(temp_sign_date.length == 3)
			sow_sign_date = new Date(parseInt(temp_sign_date[0]), parseInt(temp_sign_date[1]) - 1, parseInt(temp_sign_date[2]));
		else
			system_calls.PopoverError($(".sow_sign_date"), "Формат даты некорректный используем текущую дату.");

		if(temp_start_date.length == 3)
			sow_start_date = new Date(parseInt(temp_start_date[0]), parseInt(temp_start_date[1]) - 1, parseInt(temp_start_date[2]));
		else
			system_calls.PopoverError($(".sow_start_date"), "Формат даты некорректный используем текущую дату.");

		if(temp_end_date.length == 3)
			sow_end_date = new Date(parseInt(temp_end_date[0]), parseInt(temp_end_date[1]) - 1, parseInt(temp_end_date[2]));
		else
			system_calls.PopoverError($(".sow_end_date"), "Формат даты некорректный используем текущую дату.");

		$(".sow_sign_date")
					.val(system_calls.GetFormattedDateFromSeconds(sow_sign_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(sow_sign_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true
					});
		$(".sow_start_date")
					.val(system_calls.GetFormattedDateFromSeconds(sow_start_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(sow_start_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,
					    maxDate: system_calls.GetFormattedDateFromSeconds(sow_end_date.getTime()/1000, "DD/MM/YYYY"),

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true
					})
			        .on( "change", function() {
				          $(".sow_end_date").datepicker( "option", "minDate", $(this).val() );
			        });
		$(".sow_end_date")
					.val(system_calls.GetFormattedDateFromSeconds(sow_end_date.getTime()/1000, "DD/MM/YYYY"))
					.attr("data-db_value", system_calls.GetFormattedDateFromSeconds(sow_end_date.getTime()/1000, "DD/MM/YYYY"))
					.datepicker({
					    dateFormat: DATE_FORMAT_GLOBAL,
					    minDate: system_calls.GetFormattedDateFromSeconds(sow_start_date.getTime()/1000, "DD/MM/YYYY"),

						firstDay: 1,
						dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
						dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
						monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
						monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
						changeMonth: true,
						changeYear: true,
						defaultDate: "+0d",
						numberOfMonths: 1,
						yearRange: "1960:2030",
						showOtherMonths: true,
						selectOtherMonths: true
					})
			        .on( "change", function() {
				          $(".sow_start_date").datepicker( "option", "maxDate", $(this).val() );
			        });

		$("#sow_number")
			.attr("data-db_value", sow.number)
			.val(sow.number);
		$("#day_rate_subcontractor")
			.attr("data-db_value", sow.day_rate)
			.val(sow.day_rate);
		$("#company_position")
			.attr("data-db_value", sow.company_positions[0].title)
			.val(sow.company_positions[0].title);
		$("#payment_period_service")
			.attr("data-db_value", sow.payment_period_service)
			.val(sow.payment_period_service);
		$("#payment_period_bt")
			.attr("data-db_value", sow.payment_period_bt)
			.val(sow.payment_period_bt);

		$(".sow_sign_date")				.attr("data-script", "agency.cgi");
		$(".sow_start_date")			.attr("data-script", "agency.cgi");
		$(".sow_end_date")				.attr("data-script", "agency.cgi");
		$("#sow_number")				.attr("data-script", "agency.cgi");
		$("#payment_period_service")	.attr("data-script", "agency.cgi");
		$("#payment_period_bt")			.attr("data-script", "agency.cgi");
		$("#day_rate_subcontractor")	.attr("data-script", "agency.cgi");
		$("#company_position")			.attr("data-script", "agency.cgi");

		$(".sow_sign_date")				.attr("data-id", "000");
		$(".sow_start_date")			.attr("data-id", "000");
		$(".sow_end_date")				.attr("data-id", "000");
		$("#sow_number")				.attr("data-id", "000");
		$("#payment_period_service")	.attr("data-id", "000");
		$("#payment_period_bt")			.attr("data-id", "000");
		$("#day_rate_subcontractor")	.attr("data-id", "000");
		$("#company_position")			.attr("data-id", "000");


		$(".sow_sign_date")				.attr("data-sow_id", sow.id);
		$(".sow_start_date")			.attr("data-sow_id", sow.id);
		$(".sow_end_date")				.attr("data-sow_id", sow.id);
		$("#sow_number")				.attr("data-sow_id", sow.id);
		$("#payment_period_service")	.attr("data-sow_id", sow.id);
		$("#payment_period_bt")			.attr("data-sow_id", sow.id);
		$("#day_rate_subcontractor")	.attr("data-sow_id", sow.id);
		$("#company_position")			.attr("data-sow_id", sow.id);

		$(".sow_sign_date")				.attr("data-action", "AJAX_updateSoWSignDate");
		$(".sow_start_date")			.attr("data-action", "AJAX_updateSoWStartDate");
		$(".sow_end_date")				.attr("data-action", "AJAX_updateSoWEndDate");
		$("#sow_number")				.attr("data-action", "AJAX_updateSoWNumber");
		$("#payment_period_service")	.attr("data-action", "AJAX_updateSoWPaymentPeriodService");
		$("#payment_period_bt")			.attr("data-action", "AJAX_updateSoWPaymentPeriodBT");
		$("#day_rate_subcontractor")	.attr("data-action", "AJAX_updateSoWDayRate");
		$("#company_position")			.attr("data-action", "AJAX_updateSoWPosition");

		$(".sow_sign_date")				.on("change", system_calls.UpdateInputFieldOnServer);
		$(".sow_start_date")			.on("change", system_calls.UpdateInputFieldOnServer);
		$(".sow_end_date")				.on("change", system_calls.UpdateInputFieldOnServer);
		$("#sow_number")				.on("change", system_calls.UpdateInputFieldOnServer);
		$("#payment_period_service")	.on("change", system_calls.UpdateInputFieldOnServer);
		$("#payment_period_bt")			.on("change", system_calls.UpdateInputFieldOnServer);
		$("#company_position")			.on("change", system_calls.UpdateInputFieldOnServer)
										.on("input", system_calls.Position_InputHandler);
		$("#day_rate_subcontractor")	.on("change", UpdateDayRate);

	};

	var	UpdateDayRate = function(e)
	{
		var	curr_tag = $(this);
		
		curr_tag.val(system_calls.RoundedTwoDigitSum(parseFloat(curr_tag.val()), 0));

		return system_calls.UpdateInputFieldOnServer(e);
	};

	var	RenderSoWCustomFields = function(sow)
	{
		$(".__sow_custom_field").each(function()
		{
			var		curr_tag = $(this);
			var		var_name = curr_tag.attr("data-var_name");

			curr_tag.empty();

			if(var_name && var_name.length)
			{
				var		custom_field = system_calls.GetSoWCustomFieldObject(var_name, sow.custom_fields);

				if(custom_field)
					curr_tag.append(system_calls.GetEditableSoWCustomField_DOM(custom_field));
			}
			else
			{
				curr_tag.append(common_timecard.GetEditableCustomFields_DOM(sow.custom_fields));
			}

			curr_tag.find(".__sow_custom_field_input").attr("data-script", "agency.cgi");
		});
	};

	var	RenderCostCenterTabs = function(sow)
	{
		$("#cost_center_tabs").empty().append(system_calls.GetCostCenterTabs_DOM(sow.cost_centers, "_sow", Tab_CostCenter_ClickHandler));
	};

	var	RenderBTExpenseList = function(sow)
	{
		$("#bt_expense_list").empty().append(GetEditableBTExpenseListAssignment_DOM(sow));
	};

	var	RenderApprovers = function(sow)
	{
		$(approver_root_tag_global).empty().append(system_calls.GetCostCenterTabs_DOM(sow.cost_centers, "_approvers", null));
		agency_approvers_obj.Render();
		agency_approvers_obj.ClickFirstTab();
	}

	var	RenderSubcontractorCreateTasks = function(sow)
	{
		$("#self_task_assignment").prop("checked", (sow.subcontractor_create_tasks == "Y" ? "checked" : ""));
	};

	var	UpdateTimecardTask_ChangeHandler = function(e)
	{
		var		currTag = $(this);

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: currTag.data("action"),
				id: currTag.data("id"),
				value: currTag.val(),
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					currTag.attr("data-db_value", currTag.val());
				}
				else
				{
					// --- install previous value, due to error
					currTag.val(currTag.attr("data-db_value"));

					console.error(currTag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				currTag.removeAttr("disabled");
			});

	};

	var	RemoveTaskAssignment_AreYouSure_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AreYouSureRemoveTaskAssignment .submit").attr("data-id", currTag.data("id"));
		$("#AreYouSureRemoveTaskAssignment").modal("show");
	};

	var	RemoveBTExpenseAssignment_AreYouSure_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AreYouSureRemoveBTExpenseAssignment .submit").attr("data-id", currTag.data("id"));
		$("#AreYouSureRemoveBTExpenseAssignment").modal("show");
	};

	var	RemoveTaskAssignment_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		assignment_id = currTag.attr("data-id");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteTaskAssignment",
				id: currTag.attr("data-id"),
				value: currTag.val(),
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveTaskAssignment").modal("hide");
					setTimeout(function() { $(".task_assignment_" + assignment_id).hide(300); }, 500);
				}
				else
				{
					// --- install previous value, due to error
					console.error(currTag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				currTag.removeAttr("disabled");
			});

	};

	var	RemoveCustomField_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		target_to_hide = currTag.data("target_to_hide");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/' + currTag.attr("data-script"),
			{
				action: currTag.attr("data-action"),
				id: currTag.attr("data-id"),
				sow_id: currTag.attr("data-sow_id"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveCustomField").modal("hide");
					setTimeout(function() { $(target_to_hide).hide(300); }, 500);
					setTimeout(function() { $(target_to_hide).remove(); }, 2000);
				}
				else
				{
					// --- install previous value, due to error
					console.error(currTag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				currTag.removeAttr("disabled");
			});

	};

	var	RemoveBTExpenseAssignment_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		assignment_id = currTag.attr("data-id");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteBTExpenseAssignment",
				id: currTag.attr("data-id"),
				value: currTag.val(),
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveBTExpenseAssignment").modal("hide");
					setTimeout(function() {
						$(".bt_expense_assignment_" + assignment_id).hide(300);
					}, 300);
					setTimeout(function() {
						$(".bt_expense_assignment_" + assignment_id).remove();
					}, 1000);
				}
				else
				{
					// --- install previous value, due to error
					console.error(currTag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				currTag.removeAttr("disabled");
			});

	};

	var	RemoveSoW_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		approver_id = currTag.attr("data-id");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteSoW",
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					window.location.href = "/cgi-bin/agency.cgi?action=agency_sow_list_template&rand=" + Math.random()*98765432123456;
				}
				else
				{
					// --- install previous value, due to error
					console.error(currTag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
				currTag.removeAttr("disabled");
			});

	};

	var	InitNewTaskAssignment = function()
	{
		$("select.customer[data-random=\"" + suffix_global + "\"]").empty().append(CustomersProjectsTasks_Select_global.GetCustomerList_DOM("0", "0", "0"));
		$("select.project[data-random=\"" + suffix_global + "\"]").empty().append(CustomersProjectsTasks_Select_global.GetProjectList_DOM("0", "0", "0"));
		$("select.task[data-random=\"" + suffix_global + "\"]").empty().append(CustomersProjectsTasks_Select_global.GetTaskList_DOM("0", "0", "0"));
	};

	var	isValidToSubmitNewAssignment = function()
	{
		var	error_message = "";
		var	temp;

		if($(".customer[data-random=\"new\"]").val() === CONST_CHOOSE_CUSTOMER)
		{
			error_message = "Необходимо заполнить название  Заказчика";
			system_calls.PopoverError($(".customer[data-random=\"new\"]"), error_message);
		}
		if($(".project[data-random=\"new\"]").val() === CONST_CHOOSE_PROJECT)
		{
			error_message = "Необходимо заполнить название Проекта";
			system_calls.PopoverError($(".project[data-random=\"new\"]"), error_message);
		}
		if($(".task[data-random=\"new\"]").val() === CONST_CHOOSE_TASK)
		{
			error_message = "Необходимо заполнить название задачи";
			system_calls.PopoverError($(".task[data-random=\"new\"]"), error_message);
		}
		if($(".new_assignment_start").val() === "")
		{
			error_message = "Необходимо указать дату начала назначения";
			system_calls.PopoverError($(".new_assignment_start"), error_message);
		}
		else
		{
			temp = $(".new_assignment_start").val().split("/");
			if(temp.length == 3) {}
			else
			{
				error_message = "Некорректный формат даты начала назначения ";
				system_calls.PopoverError($(".new_assignment_start"), error_message);
			}
		}

		if($(".new_assignment_end").val() === "")
		{
			error_message = "Необходимо указать дату окончания назначения ";
			system_calls.PopoverError($(".new_assignment_end"), error_message);
		}
		else
		{
			temp = $(".new_assignment_end").val().split("/");
			if(temp.length == 3) {}
			else
			{
				error_message = "Некорректный формат даты окончания назначения ";
				system_calls.PopoverError($(".new_assignment_end"), error_message);
			}
		}

		data_global.sow[0].tasks.forEach(function(task)
			{
				if(
					(task.title == $(".task[data-random=\"new\"]").val()) &&
					(task.projects[0].title == $(".project[data-random=\"new\"]").val()) &&
					(task.projects[0].customers[0].title == $(".customer[data-random=\"new\"]").val())
				)
				{
					error_message = "Это назначение уже существует";
					system_calls.PopoverError($(".task[data-random=\"new\"]"), error_message);
				}
			});

		return error_message;
	};

	var NewAssignment_ClickHandler = function(e)
	{
		var	currTag = $(this);
		var	error_message = isValidToSubmitNewAssignment();

		if(error_message.length)
		{
			system_calls.PopoverError(currTag, error_message);
		}
		else
		{
			currTag.button("loading");
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_addTaskAssignment",
					sow_id: data_global.sow[0].id,
					customer: $(".customer[data-random=\"new\"]").val(),
					project: $(".project[data-random=\"new\"]").val(),
					task: $(".task[data-random=\"new\"]").val(),
					period_start: $(".new_assignment_start").val(),
					period_end: $(".new_assignment_end").val(),
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						$("#collapsible_timecard_task_assignment_new_item").collapse("hide");
						ResetNewTimecardAssignment();
						GetSOWFromServer(data_global.sow[0].id);
					}
					else
					{
						console.error("AJAX_getSoW.done(): ERROR: " + data.description);
						system_calls.PopoverError(currTag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}, 500);
				})
				.always(function(data)
				{
					setTimeout(function() {
						currTag.button("reset");
					}, 500);
				});

		}
	};

	var NewAssignment_ShowHandler = function()
	{
		if((typeof agency_global != "undefined") && (typeof agency_global.tasks != "undefined") && agency_global.tasks.length)
		{
			// --- agency object pulled from server
		}
		else
		{
			$(".__loading_indicator").attr("disabled", "disabled");
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_getAgencyInfo",
					include_bt: "true",
					include_tasks: "true",
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						agency_global = data.agencies[0];

						CustomersProjectsTasks_Select_global.SetGlobalData(data.agencies[0].tasks);
						InitNewTaskAssignment();
					}
					else
					{
						console.error("AJAX_getSoW.done(): ERROR: " + data.description);
						system_calls.PopoverError(currTag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}, 500);
				})
				.always(function(data)
				{
					$(".__loading_indicator").removeAttr("disabled");
				});
		}
	};

	var	PullOutCustomFieldsFromAnotherSoW_ClickHandler = function()
	{
		var		curr_tag = $("#PullOutCustomFieldsModal .submit");

		$("#PullOutCustomFieldsModal").modal("show");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_getSoWListWithCustomFields",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					custom_fields_sources_global = data.sow;
					RenderCustomFieldsSources(data.sow);
					$("#PullOutCustomFieldsModal select").trigger("change");

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
			})
			.always(function(data)
			{
			});
	};

	var	PullOutCustomFieldsFromAnotherSoW_SubmitHandler = function()
	{
		var		curr_tag = $(this);
		var		select_tag = $("#PullOutCustomFieldsModal select");
		var		with_values = $("#PullOutCustomFieldsModal .with_values");
		var		sow_id_from = select_tag.val();

		curr_tag.button("loading");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_copyCustomFieldsFromSoW",
				sow_id_from: sow_id_from,
				sow_id_to: data_global.sow[0].id,
				with_values: with_values.prop("checked") ? "Y" : "N",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#PullOutCustomFieldsModal").modal("hide");

					GetSOWFromServer(data_global.sow[0].id);
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
				}, 200);
			})
			.always(function(data)
			{
				curr_tag.button("reset");
			});
	};

	var	SubcontractorCreateTasks = function(new_value)
	{
		var	curr_tag = $("#label_self_task_assignment");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_updateSubcontractorCreateTasks",
				id: "0000000000", // --- fake id
				value: (new_value ? "Y" : "N"),
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global.sow[0].subcontractor_create_tasks = (new_value ? "Y" : "N");
					RenderSubcontractorCreateTasks(data_global.sow[0]);
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
			});
	};

	var	SelfTask_Assignment_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		input_tag = $("#" + $(this).attr("for"));
		var		curr_value = !input_tag.prop("checked"); // --- type bool

		if(curr_value)
		{
			$("#AreYouSureSubcontractorTaskCreation").modal("show");
		}
		else
		{
			SubcontractorCreateTasks(false);
		}

		return false;
	};

	var	GenerateAgreementDocSet_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		curr_tag.button("loading");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_generateSoWAgreementDocuments",
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{

					if(typeof data.filename != "undefined")
					{
						if(data.filename.length)
						{
							$("#AreYouSureGenerateAgreementDocSet").modal("hide");
							window.location.href = "/agreements_sow/" + data.filename + "?rand=" + Math.random() * 654357904;
						}
						else
						{
							setTimeout(function() {system_calls.PopoverError(curr_tag, "Сервер не вернул ссылку на фаил"); }, 100);
						}
					}
					else
					{
						setTimeout(function() {system_calls.PopoverError(curr_tag, "Сервер не вернул ссылку на фаил"); }, 100);
					}
				}
				else
				{
					setTimeout(function()
						{
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}, 100);
				}
			})
			.fail(function(data)
			{
				setTimeout(function()
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 100);
			})
			.always(function(e)
			{
				setTimeout(function()
					{
						curr_tag.button("reset");
					}, 50);
			});
	};

	var	RemoveAgreementDocSet_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		curr_tag.button("loading");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteSoWAgreementDocuments",
				sow_id: data_global.sow[0].id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveAgreementDocSet").modal("hide");

					setTimeout(function() {system_calls.PopoverInfo($("#remove_agreement_doc_set"), "Удалено"); }, 100);
				}
				else
				{
					setTimeout(function()
						{
							system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
						}, 100);
				}
			})
			.fail(function(data)
			{
				setTimeout(function()
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 100);
			})
			.always(function(e)
			{
				setTimeout(function()
					{
						curr_tag.button("reset");
					}, 50);
			});
	};

	var	CustomFieldsSources_GetDOM = function(sow_list)
	{
		var	result		= $();
		var	row			= $("<div>").addClass("row");
		var	col_1		= $("<div>").addClass("col-xs-6");
		var	col_2		= $("<div>").addClass("col-xs-6");

		var	select_tag	= $("<select>")
							.addClass("width_100percent")
							.on("change", CustomFieldsSources_ChangeHandler);
		var	checkbox_tag= $("<input>")
        					.addClass("with_values")
							.attr("type", "checkbox")
							.attr("name", "custom_field_value_trigger")
							.attr("id", "custom_field_value_trigger")
							.on("change", CustomFieldsValue_ChangeHandler);
        var	checkbox_label = $("<label>")
        					.addClass("switcher font_weight_normal")
        					.attr("for", "custom_field_value_trigger")
        					.append("с значениями");

		sow_list.forEach(function(sow)
		{
			var	option = $("<option>")
									.attr("value", sow.id)
									.append(sow.subcontractor_company[0].name + " " + sow.number);

			select_tag.append(option);
		});

		col_1.append(select_tag);
		col_2.append(checkbox_tag).append("&nbsp;").append(checkbox_label);

		return result.add(row.append(col_1).append(col_2));
	};

	var	RenderCustomFieldsSources = function(sow_list)
	{
		$("#PullOutCustomFieldsModal .modal-body .select").empty().append(CustomFieldsSources_GetDOM(sow_list));
	};

	var	isCustomFieldPresentInSoW = function(var_name, sow)
	{
		var		result = false;

		if(sow)
		{
			for (var i = sow.custom_fields.length - 1; i >= 0; i--) {
				if(sow.custom_fields[i].var_name == var_name)
				{
					result = true;
					break;
				}
			}
		}
		else
		{
			console.error("sow not defined");
		}

		return result;
	};

	var	CustomFieldsCopy_GetDOM = function()
	{
		var	result = $();
		var	curr_sow_id = $("#PullOutCustomFieldsModal select").val();
		var	with_values = $("#PullOutCustomFieldsModal .with_values").is(":checked");

		custom_fields_sources_global.forEach(function(sow)
		{
			if(sow.id == curr_sow_id)
			{
				sow.custom_fields.forEach(function(custom_field)
				{
					if(isCustomFieldPresentInSoW(custom_field.var_name, data_global.sow[0]))
					{
					}
					else
					{
						var		row = $("<div>").addClass("row");
						var		col_1 = $("<div>").addClass("col-xs-6").append(custom_field.title);
						var		col_2 = $("<div>").addClass("col-xs-6").append(with_values ? custom_field.value : "");

						result = result.add(row.append(col_1).append(col_2));
					}
				});
			}
		});

		return result;
	};

	var	RenderCustomFiedsCopy = function()
	{
		$("#PullOutCustomFieldsModal .modal-body .info").empty().append(CustomFieldsCopy_GetDOM());
	};

	var CustomFieldsSources_ChangeHandler = function()
	{
		var	curr_tag = $(this);

		RenderCustomFiedsCopy();
	};

	var CustomFieldsValue_ChangeHandler = function()
	{
		RenderCustomFiedsCopy();
	};

	var	ResetNewTimecardAssignment = function()
	{
		$(".customer[data-random=\"new\"]").val("");
		$(".project[data-random=\"new\"]").val("");
		$(".task[data-random=\"new\"]").val("");
		$(".new_assignment_start").val("");
		$(".new_assignment_end").val("");
	};

	return {
		Init: Init,
	};

})();
