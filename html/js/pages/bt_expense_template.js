var	bt_expense_template_obj = function()
{
	'use strict';

	var random_global;
	var	data_global;
	var	expense_lines_area_state_global = "";
	var expand_button_state_global = "";
	var remove_button_state_global = "";
	var	expense_template_lines_global = [];
	var	expense_submit_button_global = "hidden";

	var	submit_callback_global;

	var	Init = function()
	{
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__bt_expense_template[data-random=\"" + random_global + "\"]").length);
	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init 				== "undefined") data_init = {};
		if(typeof data_init.id				== "undefined") data_init.id = "0";
		if(typeof data_init.title			== "undefined") data_init.title = "";
		if(typeof data_init.agency_comment	== "undefined") data_init.agency_comment = "";
		if(typeof data_init.line_templates	== "undefined") data_init.line_templates = [];

		data_global = data_init;

		data_init.line_templates.forEach(function(line_template)
		{
			var		temp_bt_expense_lines;

			temp_bt_expense_lines = new bt_expense_template_line_obj();
			temp_bt_expense_lines.Init();
			temp_bt_expense_lines.SetGlobalData(line_template);

			temp_bt_expense_lines.Set_Title_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_Description_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_Tooltip_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_DocType_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_PaymentCash_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_PaymentCard_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_RequiredDoc_ChangeCallback(BTExpenseLine_PostCheck_ChangeCallback);
			temp_bt_expense_lines.Set_Remove_ClickCallback(BTExpenseLine_Remove_ClickCallback);

			expense_template_lines_global.push(temp_bt_expense_lines);
		});
	};

	var	BTExpenseLine_PostCheck_ChangeCallback = function(curr_tag, ChangeField_Callback)
	{
		if(curr_tag.attr("data-id") == "0")
		{

		}
		else
		{
			// var	error_message = curr_line.CheckValidity();
			var		curr_random = curr_tag.attr("data-random");
			var		curr_line = FindLineByRandom(curr_random);

			if(CheckValidity($(".__expense_template_line_submit_button[data-random=\"" + curr_line.GetRandom() + "\"]")))
			{
				var		json_params = {};


				json_params.action					= curr_tag.attr("data-action");
				json_params.id						= curr_tag.attr("data-id");
				json_params.bt_expense_template_id	= data_global.id;

				if(curr_tag.attr("for"))
				{
					var	input_tag_id = curr_tag.attr("for");
					var	input_tag = $("#" + input_tag_id);

					json_params.value = !input_tag.prop("checked");
				}
				else
					json_params.value = curr_tag.val();


				$.post('/cgi-bin/agency.cgi?rand=' + Math.floor(Math.random() * 1435267980867), json_params)
					.done(function(unparsed_data)
					{
						var data =	(
									function(raw)
									{
										try
										{
											return JSON.parse(raw);
										}
										catch(e)
										{
											return false;
										}
									})(unparsed_data);
						if(data)
						{
							if(data.result == "success")
							{
								ChangeField_Callback(curr_tag, "");
							}
							else
							{
								console.error(curr_tag.data("action") + "$.post().done(): ERROR: " + data.description);
								ChangeField_Callback(curr_tag, "Ошибка: " + data.description);
							}
						}
						else
						{
							console.error(curr_tag.data("action") + "$.post().done(): ERROR: parsing JSON");
							ChangeField_Callback(curr_tag, "Ошибка ответа сервера");
						}
					})
					.fail(function(e)
					{
						console.error(curr_tag.data("action") + "$.post().fail()");
						ChangeField_Callback(curr_tag, "Ошибка ответа сервера");
					})
					.always(function(e)
					{
						curr_tag.removeAttr("disabled");
					});
			}
	

		}

	};

	var	BTExpenseLine_Remove_ClickCallback = function(curr_tag, ChangeField_Callback)
	{
		// --- ChangeField_Callback - function declared in Line object to signal fail in this function
		// --- curr_tag
		// --- error_message
		// ChangeField_Callback(curr_tag, "fail to change " + curr_tag.attr("data-action"));
		var		line_random = curr_tag.attr("data-random");

		for(var i = 0; i < expense_template_lines_global.length; ++i)
		{
			if(line_random == expense_template_lines_global[i].GetRandom())
			{
				expense_template_lines_global.splice(i, 1);
				break;
			}
		}
	};

	var	GetDOM = function()
	{
		var		result = $();

		var		row = 						$("<div>").addClass("row __bt_expense_template highlight_onhover zebra_painting expense_template_" + data_global.id);
		var		open_button =				$("<i>").addClass("fa fa-expand padding_close cursor_pointer animate_scale_onhover " + expand_button_state_global);
		var		input_title =				$("<input>").addClass("transparent __bt_template_title expense_template_" + data_global.id).attr("placeholder", "Название");
		var		input_comment =				$("<input>").addClass("transparent __bt_template_description expense_template_" + data_global.id).attr("placeholder", "Коментарий (необязательно)");
		var		taxable_wrapper = 			$("<div>").addClass("form-switcher");
		var		input_taxable =				$("<input>").addClass("transparent __bt_template_taxable expense_template_" + data_global.id).attr("placeholder", "Налогооблагаемый");
		var		label_taxable =				$("<label>").addClass("switcher");
		var		remove_button	=			$("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover  " + remove_button_state_global);
		var		open_col = 					$("<div>").addClass("col-xs-2 col-md-1");
		var		title_col = 				$("<div>").addClass("col-xs-4 col-md-2");
		var		taxable_col = 				$("<div>").addClass("col-xs-4 col-md-2");
		var		comment_col = 				$("<div>").addClass("col-xs-8 col-xs-offset-2 col-md-6 col-md-offset-0");
		var		remove_col =				$("<div>").addClass("col-xs-2 col-md-1");
		var		submit_button =				$("<button>").addClass("btn btn-primary form-control " + expense_submit_button_global).append("Сохранить");
		var		temp = [];

		// --- render collapsible part
		var		row_collapsible =			$("<div>").addClass("row collapse " + expense_lines_area_state_global);
		var		row_submit = 				$("<div>").addClass("row __expense_template_submit expense_template_" + data_global.id);
		var		submit_col = 				$("<div>").addClass("col-xs-12 col-md-offset-10 col-md-2");

		row_collapsible		.attr("id", "collapsible_bt_expense_template_" + data_global.id)
							.append($("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20").append("<p>"));

		expense_template_lines_global.forEach(function(expense_template_line)
		{
			var	temp_bt_expense_lines;
			var	col_container = $("<div>").addClass("col-xs-12 zebra_painting");

			row_collapsible.append(col_container.append(expense_template_line.GetDOM()));
		});

		// --- scoping "add new expense_template_line"
		{
			var		col_container	= $("<div>").addClass("col-xs-12");
			var		add_button		= $("<i>").addClass("fa fa-plus-circle fa-2x padding_close cursor_pointer animate_scale_onhover");

			add_button		.on("click", Add_ExpenseTemplateLineToExistingTemplate_ClickHandler)
							.attr("data-expense_template_id", data_global.id);

			
			row_collapsible.append(col_container.append(add_button));
		}

		row_collapsible		.append($("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20").append("<p>"));

		open_button			.attr("data-target", "collapsible_bt_expense_template_" + data_global.id)
							.attr("data-toggle", "collapse");


		// --- render main info part
		input_title			.val(data_global.title)
							.attr("data-db_value", data_global.title);
		input_comment		.val(data_global.agency_comment)
							.attr("data-db_value", data_global.agency_comment);
		input_taxable		.prop("checked", data_global.taxable == "Y" ? "checked" : "")
							.attr("type", "checkbox")
							.attr("id",   "input_bt_expense_taxable_" + data_global.id)
							.attr("name", "input_bt_expense_taxable_" + data_global.id)
							.attr("data-db_value", data_global.title);
		label_taxable		
							.attr("id",   "label_bt_expense_taxable_" + data_global.id)
							.attr("for",  "input_bt_expense_taxable_" + data_global.id)
							.attr("data-db_value", data_global.title)
							.attr("title", "Налогооблагаемый");

		open_button			.attr("data-id", data_global.id);
		input_title			.attr("data-id", data_global.id);
		input_taxable		.attr("data-id", data_global.id);
		label_taxable		.attr("data-id", data_global.id);
		input_comment		.attr("data-id", data_global.id);
		remove_button		.attr("data-id", data_global.id);
		submit_button		.attr("data-id", data_global.id);

		row					.attr("data-random", random_global);
		open_button			.attr("data-random", random_global);
		input_title			.attr("data-random", random_global);
		input_taxable		.attr("data-random", random_global);
		label_taxable		.attr("data-random", random_global);
		input_comment		.attr("data-random", random_global);
		remove_button		.attr("data-random", random_global);
		submit_button		.attr("data-random", random_global);

		input_title			.attr("data-action", "AJAX_updateExpenseTemplateTitle");
		input_comment		.attr("data-action", "AJAX_updateExpenseTemplateAgencyComment");
		input_taxable		.attr("data-action", "AJAX_updateExpenseTemplateTaxable");
		label_taxable		.attr("data-action", "AJAX_updateExpenseTemplateTaxable");
		remove_button		.attr("data-action", "AJAX_deleteExpenseTemplate");
		submit_button		.attr("data-action", "AJAX_submitExpenseTemplate");

		open_button			.on("click",  TriggerCollapsible_ClickHandler);
		input_title			.on("change", system_calls.UpdateInputFieldOnServer);
		input_taxable		.on("click",  system_calls.UpdateInputFieldOnServer);
		input_comment		.on("change", system_calls.UpdateInputFieldOnServer);
		remove_button		.on("click",  RemoveExpenseTemplate_AreYouSure_ClickHandler);
		submit_button		.on("click",  SubmitExpenseTemplate_ClickHandler);

		open_col			.append(open_button);
		title_col			.append(input_title	)		.append($("<label>"));
		taxable_col			.append(taxable_wrapper.append(input_taxable).append(label_taxable));
		comment_col			.append(input_comment)		.append($("<label>"));
		remove_col			.append(remove_button);
		submit_col			.append(submit_button);

		label_taxable		.tooltip({ animation: "animated bounceIn", placement: "top"});

		row
			.append(open_col)
			.append(title_col)
			.append(taxable_col)
			.append(comment_col)
			.append(remove_col);

		row_submit
			.append(submit_col);

		result = result.add(row);
		result = result.add(row_collapsible);
		result = result.add(row_submit);

		return	result;
	};


	var	TriggerCollapsible_ClickHandler = function(e)
	{
		var		collapsible_tag_id = $(this).attr("data-target");
		$("#" + collapsible_tag_id).collapse("toggle");
	};

	var	Add_ExpenseTemplateLineToExistingTemplate_ClickHandler = function()
	{
		var	curr_tag								= $(this);
		var	new_expense_template_line;
		var	new_expense_template_line_container_col	= $("<div>").addClass("col-xs-12 zebra_painting");
		var	control_buttons_container_col			= $("<div>").addClass("col-xs-12");
		var	submit_button							= $("<button>").addClass("btn btn-primary form-control").append("Сохранить");
		var	cancel_button							= $("<button>").addClass("btn btn-default form-control").append("Отменить");
		var	isNewExpenseTemplate					= (curr_tag.attr("data-expense_template_id") == "0");

		new_expense_template_line = new bt_expense_template_line_obj();
		new_expense_template_line		.Init();
		new_expense_template_line		.SetGlobalData();
		new_expense_template_line		.Set_Remove_ClickCallback(BTExpenseLine_Remove_ClickCallback);

		expense_template_lines_global	.push(new_expense_template_line);

		// --- disable "required option" if it is existing expense template
		if(isNewExpenseTemplate)
		{} 
		else
		{
			new_expense_template_line.Set_RequiredDoc_Value(false);
			// new_expense_template_line.Disable_RequiredOption();
		}

		submit_button
									.addClass("__expense_template_line_submit_button")
									.attr("data-random", new_expense_template_line.GetRandom())
									.attr("data-action", "AJAX_addExpenseTemplateLine")
									.on("click", AddExpenseTemplateLine_ClickHandler);
		cancel_button				.attr("data-random", new_expense_template_line.GetRandom())
									.on("click", function()
												{ 
													var	curr_tag = $(this);
													var	curr_random = curr_tag.attr("data-random");
													var	remove_tags = $("div.row[data-random=\"" + curr_random + "\"]").parent();

													BTExpenseLine_Remove_ClickCallback(curr_tag);

													remove_tags.hide(200);
													setTimeout(function() {  remove_tags.remove(); }, 300);
												});

		new_expense_template_line_container_col	.append(new_expense_template_line.GetDOM());
		control_buttons_container_col			.append(
													$("<div>")	.addClass("row __expense_template_line_control_buttons")
																.attr("data-random", new_expense_template_line.GetRandom())
																.append(
																	$("<div>").addClass("col-xs-6 col-md-2 col-md-offset-8 form-group").append(
																		submit_button
																	)
																)
																.append(
																	$("<div>").addClass("col-xs-6 col-md-2 form-group").append(
																		cancel_button
																	)
																)
												);

		new_expense_template_line_container_col	.insertBefore(curr_tag.parent());

		if(isNewExpenseTemplate) {}
		else control_buttons_container_col.insertBefore(curr_tag.parent());
	};

	var	HideControlButtons = function(random_local)
	{
		$("div.row.__expense_template_line_control_buttons[data-random=\"" + random_local + "\"]").parent().hide(200);
	};

	var	AddExpenseTemplateLine_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		curr_random = curr_tag.attr("data-random");
		var		curr_line = FindLineByRandom(curr_random);

		if((typeof(curr_line) != "undefined"))
		{
			// var	error_message = curr_line.CheckValidity();

			if(CheckValidity($(".__expense_template_line_submit_button[data-random=\"" + curr_line.GetRandom() + "\"]")))
			{
				var		json_params = {};
				var		line_params = curr_line.GetExpenseTemplateLineData();

				json_params.action					= curr_tag.data("action");
				json_params.bt_expense_template_id	= data_global.id;

				for(var key in line_params)
					json_params[key] = line_params[key];

				$.post('/cgi-bin/agency.cgi?rand=' + Math.floor(Math.random() * 1435267980867), json_params)
					.done(function(unparsed_data)
					{
						var data =	(
									function(raw)
									{
										try
										{
											return JSON.parse(raw);
										}
										catch(e)
										{
											return false;
										}
									})(unparsed_data);
						if(data)
						{
							if(data.result == "success")
							{
								HideControlButtons(curr_line.GetRandom());
								curr_line.UpdateID(data.bt_expense_line_template.id);
								curr_line.SetGlobalData(data.bt_expense_line_template);
							}
							else
							{
								console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
								system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
							}
						}
						else
						{
							console.error(curr_tag.data("action") + ".done(): ERROR: parsing JSON");
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						}
					})
					.fail(function(e)
					{
						curr_tag.val(curr_tag.attr("data-db_value"));
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					})
					.always(function(e)
					{
						curr_tag.removeAttr("disabled");
					});
			}

/*			else
			{
				system_calls.PopoverError(curr_tag, error_message);
			}
*/
		}
	};

	var DefaultExpand = function()
	{
		expense_lines_area_state_global = "in";
	};

	var ExpandButton = function(state)
	{
		expand_button_state_global = state;
	};

	var RemoveButton = function(state)
	{
		remove_button_state_global = state;
	};

	var	ExpenseSubmitButton = function(state)
	{
		expense_submit_button_global = state;
	};

	var	CheckDuplicateLineTitles = function()
	{
		var		result = true;

		if(expense_template_lines_global.length >= 2)
		{
			var		uniq_line_templates = [];

			expense_template_lines_global.forEach(function(item)
			{
				uniq_line_templates.push(item.GetTitle());
			});

			uniq_line_templates.sort();
			jQuery.unique(uniq_line_templates);

			if(uniq_line_templates.length == expense_template_lines_global.length) {}
			else 
			{
				result = false;
			}
		}
		else
		{

		}

		return result;
	};

	var	CheckValidity = function(submit_button)
	{
		var		result = true;
		var		title		= $("input.__bt_template_title.expense_template_" + data_global.id);
		var		description	= $("input.__bt_template_description.expense_template_" + data_global.id);

		if(title.val() === "")
		{
			system_calls.PopoverError(title, "Название обязательно");
			system_calls.PopoverError(submit_button, "Название обязательно");
			result = false;
		}

		if(typeof(expense_template_lines_global) == "undefined")
		{
			troubleshooting.PopoverError(submit_button, "ОШИБКА в обьекте expense_template_lines_global.");
			result = false;
		}
		else if(!CheckDuplicateLineTitles())
		{
			system_calls.PopoverError(submit_button, "Два документа с одинаковым названием");
			result = false;
		}
		else
		{
			if(expense_template_lines_global.length)
			{
				for (var i = 0; i < expense_template_lines_global.length; i++) {
					var		error_message = expense_template_lines_global[i].CheckValidity();

					if(error_message)
					{
						system_calls.PopoverError(submit_button, error_message);
						result = false;
						break;
					}
				}
			}
			else
			{
				system_calls.PopoverError(submit_button, "Необходимо добавить по крайней мере 1 док-т для проверки.");
				system_calls.PopoverError($("i.fa-plus-circle[data-expense_template_id=\"" + data_global.id + "\"]"), "Необходимо добавить по крайней мере 1 док-т для проверки.");
				result = false;
			}
		}
		return result;
	};

	var	SubmitExpenseTemplate_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	expense_template_id = data_global.id;

		if(CheckValidity(curr_tag))
		{
			// --- add new expense template
			var		cgi_params = 
			{
				action: "AJAX_addExpenseTemplate",
				bt_expense_template_id: data_global.id,
				bt_expense_template_title: $("input.__bt_template_title.expense_template_" + expense_template_id).val(),
				bt_expense_template_description: $("input.__bt_template_description.expense_template_" + expense_template_id).val(),
			};

			expense_template_lines_global.forEach(function(expense_template_line)
			{
				var		arr = expense_template_line.GetExpenseTemplateLineData();

				for(var key in arr)
				{
					cgi_params[key] = arr[key];
				}

			});

			// curr_tag.button("loading");

			$.post('/cgi-bin/agency.cgi?rand=' + Math.floor(Math.random() * 1435267980867), cgi_params)
				.done(function(json_data)
				{
					var	data = JSON.parse(json_data);

					if(data.result == "success")
					{
						if(typeof(submit_callback_global) == "function")
						{
							submit_callback_global();
						}
					}
					else
					{
						// --- install previous value, due to error
						console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
				.always(function()
				{
					curr_tag.button("reset");
				});

		}
		else
		{
			console.error("ERROR: check expense template validity");
		}
	};

	var SetSubmitCallback = function(f)
	{
		submit_callback_global = f;
	};

	var FindLineByRandom = function(random_local)
	{
		var result;

		for(var i = 0; i < expense_template_lines_global.length; ++i)
		{
			if(expense_template_lines_global[i].GetRandom() == random_local)
			{
				result = expense_template_lines_global[i];
			}
		}

		return result;
	};

	var	RemoveExpenseTemplate_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveExpenseTemplate .submit").attr("data-id", curr_tag.data("id"));
		$("#AreYouSureRemoveExpenseTemplate").modal("show");
	};

	return {
		Init: Init,
		SetGlobalData: SetGlobalData,
		GetDOM: GetDOM,
		DefaultExpand: DefaultExpand,
		ExpandButton: ExpandButton,
		RemoveButton: RemoveButton,
		ExpenseSubmitButton: ExpenseSubmitButton,
		SetSubmitCallback: SetSubmitCallback,
	};
};
