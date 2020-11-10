var	subcontractor_bt = subcontractor_bt || {};

var	subcontractor_bt = (function()
{
    'use strict';

	var	data_global;
	var	current_sow_global = "";
	var	action_global = "";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	bt_start_date_global;
	var	bt_end_date_global;
	var	new_item_date_global;
	var	last_selected_currency_global = "EUR"; // --- default currency
	var	bt_destination_country_id_global = ""; // --- predict allowance country from bt_destination

	var	Init = function()
	{
		SetInitialParamsFromURI();

		InitBTDates();
		LoadInitialData();

		$("#sowSelector")			.on("change", ChangeSOWSelect_ChangeHandler);
		$("#bt_submit_btn")			.on("click", BTSubmit_ClickHandler);
		$("#bt_save_btn")			.on("click", BTSave_ClickHandler);
		$("#bt_remove_btn")			.on("click", function() { $("#AreYouSureRemoveBT").modal("show"); });
		$("#collapsible_new_item")	.on("show.bs.collapse", CollapsibleNewItem_ShowHandler);

		$("#AreYouSureRemoveBT .submit")			.on("click", ConfirmBTRemove_ClickHandler);
		$("#AreYouSureChangeSoW .submit")			.on("click", ConfirmSOWChange_ClickHandler);
		$("#AreYouSureRemoveExpenseItem .submit")	.on("click", ConfirmExpenseItemRemove_ClickHandler);

		$("#AddGeneralImageButton")	.on("change", AddGeneralImageButton_ChangeHandler);

		$("#bt_destination")		.autocomplete({
										source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getLocalityAutocompleteList_2",
										select: BTDestination_SelectHandler,
									})
									.on("change", SubmitLocalityIfUnknown_ChangeHandler)
									.on("input", function() { $(this).attr("data-id", ""); });

	};

	var	SetInitialParamsFromURI = function()
	{
		var		bt_id = $.urlParam("bt_id");
		var		sow_id = $.urlParam("sow_id");

		if(bt_id.length)
		{
			if(parseInt(bt_id))
			{
				action_global = "load_bt";
			}
			else console.error("bt_id(" + bt_id + ") not a number");
		}
		else if(sow_id.length)
		{
			if(parseInt(sow_id))
			{
				action_global = "craft_bt";
				UpdateSoWID("" + sow_id);
			}
			else console.error("sow_id(" + sow_id + ") not a number");
		}
		else
		{
			action_global = "craft_bt";
		}
	};

	var	CollapsibleNewItem_ShowHandler = function(e)
	{
		var		currTag = $(this);
		var		date_picker = currTag.find(".hasDatepicker");

		if(date_picker.val().length) {}
		else
		{
			var		curr_date = new Date();

			date_picker
				.val(system_calls.GetFormattedDateFromSeconds(curr_date.getTime()/1000, "DD/MM/YYYY"))
				.change();
		}	


	};

	var	ChangeSOWSelect_ChangeHandler = function(e)
	{
		var		currTag = $(this);
		var		currTagID = currTag.attr("id");
		var		current_sow = $("select#" + currTagID + " option:selected").data("id");

		$("#AreYouSureChangeSoW .submit").attr("data-id", current_sow);
		$("#AreYouSureChangeSoW").modal("show");

		// --- keep the old value until customer confirm
		$("#sowSelector option[data-id='" + current_sow_global + "']").prop("selected", "selected");
	};

	var	ConfirmExpenseItemRemove_ClickHandler = function()
	{
		var		removing_tag = $("#AreYouSureRemoveExpenseItem .submit").data("target_element_id");
		var		bt_expense_id = $("#" + removing_tag).data("bt_expense_id");


		if(parseInt(bt_expense_id))
		{
			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					action:"AJAX_removeExpense",
					bt_expense_id: bt_expense_id,
				})
				.done(function(data) {
					if(data.status == "success")
					{
						$("#AreYouSureRemoveExpenseItem").modal("hide");
						setTimeout(function() { $("#" + removing_tag).hide(300); }, 300);
						setTimeout(function() { $("#" + removing_tag).remove(); }, 600);
					}
					else
					{
						system_calls.PopoverError("bt", "Ошибка: " + data.description);
					}

				})
				.fail(function(data) {
					system_calls.PopoverError("bt", "Ошибка ответа сервера");
				});
		}
		else
		{
			system_calls.PopoverError("bt", "Не найден идентификатор расхода");
		}
	};

	var	ConfirmBTRemove_ClickHandler = function()
	{
		var	currTag = $("#AreYouSureRemoveBT .submit");
		var	bt_id = $("#bt").data("bt_id");

		// $("#AreYouSureRemoveBT").modal("hide");

		if(parseInt(bt_id))
		{
			currTag.button("loading");

			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					action:"AJAX_removeBT",
					bt_id: bt_id,
				})
				.done(function(data) {
					if(data.status == "success")
					{
						window.location.href = "/cgi-bin/subcontractor.cgi?action=bt_list_template&rand=" + Math.random()*98765432123456;
					}
					else
					{
						console.error("AJAX_removeBT.done(): ERROR: " + data.description);
						system_calls.PopoverError("bt", "Ошибка: " + data.description);
					}

				})
				.fail(function(data) {
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");
				})
				.always(function(e) {
					setTimeout(function() {
						currTag.button("reset");
					}, 500);
				});
		}
		else
		{
			system_calls.PopoverError(currTag, "Не найден идентификатор командировки");
		}
	};

	var	ConfirmSOWChange_ClickHandler = function()
	{
		$("#AreYouSureChangeSoW").modal("hide");
		UpdateSoWID($("#AreYouSureChangeSoW .submit").attr("data-id"));
		$("#sowSelector option[data-id='" + current_sow_global + "']").prop("selected", "selected");

		InitBTLayout();
	};

/*
	var	GetSOWSelectBox = function(active_sow_id)
	{
		var		result = $();

		if((typeof(data_global) == "undefined") || (typeof(data_global.sow) == "undefined"))
		{
			console.error("data_global or data_global.sow is undefined");
		}
		else
		{
			data_global.sow.forEach(function(sow_item)
				{
					if(sow_item.status == "signed")
					{
						if(isDateInFutureOrMonthAgo(sow_item.end_date) || (sow_item.id == active_sow_id))
						{
							var		tag = $("<option>")	.append(sow_item.agency_company_id[0].name + ": " + sow_item.number + " от " + sow_item.sign_date)
														.attr("data-id", sow_item.id)
														.attr("value", sow_item.id);

							if(sow_item.id == active_sow_id) tag.attr("selected", "selected");

							result = result.add(tag);
						}
						else
						{
							// don't render because it too old
						}
					}
				});
		}

		return result;
	};
*/
	var	GetCustomerSelectBox = function(active_sow_id)
	{
		var		result = $();

		if((typeof(data_global) == "undefined") || (typeof(data_global.sow) == "undefined"))
		{
			console.error("data_global or data_global.sow is undefined");
		}
		else
		{
			var		customer_map = new Map();
			var		sow_map = new Map();

			for(var i = 0; i < data_global.sow.length; ++i)
			{
				if(data_global.sow[i].id == active_sow_id)
				{
					for(var j = 0; j < data_global.sow[i].tasks.length; ++j)
					{
						var		customer_obj = data_global.sow[i].tasks[j].projects[0].customers[0];
						customer_map[customer_obj.id] = customer_obj;
					}
				}

				sow_map[data_global.sow[i].id] = data_global.sow[i];
			}

			Object.keys(customer_map).forEach(function(key)
			{
				var		tag = $("<option>")	.append(customer_map[key].title)
											.attr("data-id", customer_map[key].id)
											.attr("value", customer_map[key].id);

				if(customer_map[key].id == data_global.customer_id) tag.attr("selected", "selected");

				result = result.add(tag);
			});
		}

		return result;
	};

	var	CustomerSelectBox_OnloadRender = function(active_sow_id)
	{
		$("#customerSelector").empty().append(GetCustomerSelectBox(active_sow_id));
	};

	var	LoadInitialData = function()
	{
		var		currTag = $("#sowSelector");

		if(action_global == "craft_bt")
		{
			$("button.__loading_indicator").button("loading");

			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					action:"AJAX_getSoWList",
					include_tasks:"true",
					include_bt:"true"
				})
				.done(function(data) {
					var		i;

					if(data.status == "success")
					{
						if(data.sow.length)
						{
							data_global = data;
							if(current_sow_global === "")
							{
								for(i = 0; i < data.sow.length; ++i)
								{
									if(system_calls.isDateInFutureOrMonthAgo(data.sow[i].end_date) && (data.sow[i].status == "signed"))
									{
										UpdateSoWID(data.sow[i].id);
									}
								}
							}
							if(current_sow_global == "")
							{
									system_calls.PopoverError(currTag, "Нет активных SoW. Подпишите SoW c агенством.");
							}
							else
							{
								system_calls.SOWSelectBox_OnloadRender(data_global, current_sow_global);
								InitBTLayout();
							}
						}
						else
						{
							console.error("AJAX_getMyBT.done(): ERROR: sow-array is empty");
							system_calls.PopoverError(currTag, "Ошибка: не подписано ни одного SoW");
						}
					}
					else
					{
						console.error("AJAX_getMyBT.done(): ERROR: " + data.description);
						system_calls.PopoverError(currTag, "Ошибка: " + data.description);
					}

				})
				.fail(function(data) {
					setTimeout(function() {
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}, 500);
				})
				.always(function(data) {
					setTimeout(function() {
						$("button.__loading_indicator").button("reset");
					}, 500);
				});
		}
		else if(action_global == "load_bt")
		{
			$("button.__loading_indicator").button("loading");

			$.getJSON(
				'/cgi-bin/subcontractor.cgi',
				{
					action:"AJAX_getBTEntry",
					bt_id: $.urlParam("bt_id")
				})
				.done(function(data)
				{
					if(data.status == "success")
					{
						if((typeof(data.bt) != "undefined") && (data.bt.length))
						{
							var		error_message;

							data_global = data.bt[0];
							if(current_sow_global === "") UpdateSoWID(data.bt[0].sow[0].id);
							system_calls.SOWSelectBox_OnloadRender(data_global, current_sow_global);

							error_message = MainInfo_OnloadRender(data.bt[0]);
							InitExpenseItemLayout();

							if(error_message === "")
							{
								for (var i = 0; i < data.bt[0].expenses.length; i++)
								{
									setTimeout(ExpenseInfo_OnloadRender, i * 250, data.bt[0].expenses[i]);
/*
											error_message = ExpenseInfo_OnloadRender(data.bt[0].expenses[i]);

											if(error_message.length)
											{
												console.error("AJAX_getBTEntry.done(): ERROR: ExpenseInfo_OnloadRender return error: " + error_message);
												system_calls.PopoverError(currTag, "Ошибка: " + error_message);
												break;
											}
*/
								}
							}
							else
							{
								console.error("AJAX_getBTEntry.done(): ERROR: return error: " + error_message);
								system_calls.PopoverError(currTag, "Ошибка: " + error_message);
							}
						}
						else
						{
							console.error("AJAX_getBTEntry.done(): ERROR: bt is empty");
							system_calls.PopoverError(currTag, "Ошибка: командировка не найдена");
						}
					}
					else
					{
						console.error("AJAX_getBTEntry.done(): ERROR: " + data.description);
						system_calls.PopoverError(currTag, "Ошибка: " + data.description);
					}

				})
				.fail(function(data) {
					setTimeout(function() {
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}, 500);
				})
				.always(function(data) {
					setTimeout(function() {
						$("button.__loading_indicator").button("reset");
						if	($("#bt").data("bt_status") == "approved")
						{
							$(".__loading_indicator").hide(); 
							$(".__remove_button").hide(); 
						}
						
						if(	($("#bt").data("bt_status") == "pending_approve") ||
							($("#bt").data("bt_status") == "submit")
						) 
						{
							$(".__loading_indicator").hide(); 
						}
					}, 500);
				});
		}
		else
		{
			console.error("unknown action. \"action_global\" have to be explicitly stated");
			system_calls.PopoverError("bt", "неизвестно совершаемое действие");
		}
	};

	var	InitBTDates = function()
	{
		bt_start_date_global = $("#bt_start_date").datepicker({
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
		bt_end_date_global = $("#bt_end_date").datepicker({
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

		$("#bt_start_date").on("change", StartDate_ChangeHandler);
		$("#bt_end_date").on("change", EndDate_ChangeHandler);
	};

	var	InitBTLayout = function()
	{
		if($("#bt").data("bt_id")) {} else $("#bt").attr("data-bt_id", "0");
		$("#bt_destination").val("");
		$("#bt_purpose").val("");
		$("#bt_start_date").val("");
		$("#bt_end_date").val("");
		bt_end_date_global.datepicker( "option", "minDate", "");
		bt_start_date_global.datepicker( "option", "maxDate", "");

		InitExpenseItemLayout();

		CustomerSelectBox_OnloadRender(current_sow_global);

		$("#expense_items").empty();

	};

	var	InitExpenseItemLayout = function()
	{
		$("#expense_item_new").empty().append(GetExpenseLayout_DOM({}));
		$("#expense_item_new .expense_item_payment_type_cash").click();
	};

	var	GetExpenseLayout_DOM = function(expense)
	{
		var		result 						= $();
		var		expense_item_random			= GetRandomWithPrefix("expense_item_");

		var		container 					= $("<div>").addClass("col-xs-12");

		var		expense_item_remove_row		= $("<div>").addClass("row");
		var		first_row					= $("<div>").addClass("row");
		var		second_row					= $("<div>").addClass("row expense_amount");
		var		control_buttons_row			= $("<div>").addClass("row");
		var		fold_docs_row				= $("<div>").addClass("row");

		// --- mobile remove button will be added to fold_docs_row
		var		expense_item_remove_col_mob	= $("<div>").addClass("col-xs-6 visible-xs visible-sm");
		var		expense_item_remove_col_desk= $("<div>").addClass("col-md-1 col-md-offset-11 visible-md visible-lg");
		var		expense_item_docs			= $("<div>").addClass("expense_item_docs");
		var		date_col		 			= $("<div>").addClass("col-xs-6 col-md-2");
		var		payment_type_col			= $("<div>").addClass("col-xs-6 col-md-2");
		var		type_col		 			= $("<div>").addClass("col-xs-12 col-md-4");
		var		comment_col		 			= $("<div>").addClass("col-xs-12 col-md-4 collapse in expense_item_xs_collapse_" + expense_item_random);
		var		price_domestic_col			= $("<div>").addClass("col-xs-4 col-md-2");
		var		price_foreign_col			= $("<div>").addClass("col-xs-4 col-md-2");
		var		currency_col		 		= $("<div>").addClass("col-xs-4 col-md-2");
		var		currency_nominal_col		= $("<div>").addClass("col-xs-4 col-md-2 collapse in expense_item_xs_collapse_" + expense_item_random);
		var		currency_name_col			= $("<div>").addClass("col-xs-4 col-md-2 collapse in expense_item_xs_collapse_" + expense_item_random);
		var		currency_value_col			= $("<div>").addClass("col-xs-4 col-md-2 collapse in expense_item_xs_collapse_" + expense_item_random);
		var		control_button_ok_col		= $("<div>").addClass("col-xs-6 col-md-2 col-md-offset-8");
		var		control_button_reset_col	= $("<div>").addClass("col-xs-6 col-md-2");
		var		fold_docs_col_mob			= $("<div>").addClass("col-xs-6 visible-xs visible-sm");
		var		fold_docs_col_desk			= $("<div>").addClass("col-md-1 visible-md visible-lg");

		var		expense_item_remove_button_mob;
		var		expense_item_remove_button_desk;
		var		fold_docs_button_mob;
		var		fold_docs_button_circle_mob;
		var		fold_docs_button_folder_mob;
		var		fold_docs_button_desk;
		var		type_select;
		var		date_input;
		var		payment_type_div, payment_type_input, payment_type_label;
		var		payment_type_cash, payment_type_spacer, payment_type_card;
		var		comment_input;
		var		price_domestic_input;
		var		price_foreign_input;
		var		currency_value_input;
		var		currency_nominal_input;
		var		currency_name_input;
		var		control_button_ok;
		var		control_button_reset;

		container
						.addClass("expense_item")
						.attr("id", "expense_item_" + expense_item_random)
						.attr("data-bt_expense_id", "0")
						.attr("data-random", expense_item_random);

		second_row
						.attr("data-random", expense_item_random);

		type_select = $("<select>")
						.attr("id", "expense_item_type_" + expense_item_random)
						.attr("data-random", expense_item_random)
						.addClass("form-control form-group")
						.on("change", GetExpenseLines_ChangeHandler);
		data_global.sow.forEach(function(sow)
			{
				if(sow.id == current_sow_global)
				{
					type_select.append($("<option>")
						.attr("value", "")
						.append("Выберите тип расхода")
					);
					sow.bt_expense_templates.forEach(function(item)
					{
						type_select.append(
							$("<option>")
								.attr("value", item.id)
								.append(item.title)
										);
					});
				}
			});

		date_input = $("<input>")
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
									.addClass("form-control form-group expense_item_date expense_item_date_" + expense_item_random)
									.attr("data-random", expense_item_random)
									.attr("placeholder", "Дата")
									.on("forcus", function()
										{
											$(this)
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
												.addClass("form-control form-group")
												.attr("placeholder", "Дата");
										})
									.on("change", NewDate_ChangeHandler);

		payment_type_div	= $("<span>")
									.addClass("arrows_centering")
									.attr("data-random", expense_item_random)
									.attr("id", "expense_item_payment_type_" + expense_item_random);
		payment_type_cash	= $("<span>")
									.attr("id", "expense_item_payment_type_cash_" + expense_item_random)
									.attr("data-random", expense_item_random)
									.data("payment_type", "cash")
									.addClass("animateClass cursor_pointer expense_item_payment_type_cash")
									.on("click", ExpensePaymentType_ClickHandler)
									.append("наличные");
		payment_type_spacer = $("<span>").append("&nbsp;");
		payment_type_card	= $(" <span>")
									.attr("id", "expense_item_payment_type_card_" + expense_item_random)
									.attr("data-random", expense_item_random)
									.data("payment_type", "card")
									.addClass("animateClass cursor_pointer")
									.on("click", ExpensePaymentType_ClickHandler)
									.append("карта");
		payment_type_div.append(payment_type_cash);
		payment_type_div.append(payment_type_spacer);
		payment_type_div.append(payment_type_card);

		comment_col
									.attr("id", "expense_item_comment_col_" + expense_item_random);
		currency_nominal_col
									.attr("id", "expense_item_currency_nominal_col_" + expense_item_random);
		currency_name_col
									.attr("id", "expense_item_currency_name_col_" + expense_item_random);
		currency_value_col
									.attr("id", "expense_item_currency_value_col_" + expense_item_random);

		comment_input 		= $("<input>")
									.attr("id", "expense_item_comment_" + expense_item_random)
									.attr("placeholder", "коментарий (необязательно)")
									.attr("maxlength", "256")
									.attr("data-random", expense_item_random)
									.addClass("form-control form-group");
		price_domestic_input = $("<input>")
									.attr("id", "expense_item_price_domestic_" + expense_item_random)
									.attr("placeholder", "цена в руб.")
									.attr("type", "number")
									.attr("step", "1000")
									.attr("maxlength", "7")
									.attr("data-random", expense_item_random)
									.addClass("form-control form-group expense_item_price_domestic");
		price_foreign_input = $("<input>")
									.attr("id", "expense_item_price_foreign_" + expense_item_random)
									.attr("placeholder", "цена в валюте")
									.attr("type", "number")
									.attr("step", "10")
									.attr("maxlength", "7")
									.addClass("form-control form-group")
									.attr("data-random", expense_item_random)
									.on("keyup", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); })
									.on("change", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); });
		currency_nominal_input = $("<input>")
									.attr("id", "expense_item_currency_nominal_" + expense_item_random)
									.attr("placeholder", "номинал")
									.attr("type", "number")
									.addClass("form-control form-group")
									.attr("data-random", expense_item_random)
									.on("keyup", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); })
									.on("change", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); });
		currency_name_input = $("<input>")
									.attr("id", "expense_item_currency_name_" + expense_item_random)
									.attr("placeholder", "название")
									.attr("data-random", expense_item_random)
									.addClass("form-control form-group");
		currency_value_input = $("<input>")
									.attr("id", "expense_item_currency_value_" + expense_item_random)
									.attr("placeholder", "курс")
									.attr("type", "number")
									.addClass("form-control form-group")
									.attr("data-random", expense_item_random)
									.on("keyup", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); })
									.on("change", function(e) { return ForeignPrice_ChangeHandler(expense_item_random); });
		currency_col
									.attr("data-random", expense_item_random)
									.attr("id", "expense_item_currency_col_" + expense_item_random);
		expense_item_docs
									.addClass("collapse in expense_item_xs_collapse_" + expense_item_random)
									.attr("data-random", expense_item_random)
									.attr("id", "expense_item_docs_" + expense_item_random);

		control_buttons_row
									.attr("id", "expense_item_control_row_" + expense_item_random);
		control_button_ok = $("<button>")
									.attr("id", "expense_item_control_ok_" + expense_item_random)
									.addClass("btn btn-primary form-control form-group")
									.attr("data-random", expense_item_random)
									.append("OK")
									.on("click", ExpenseElementSubmit_ClickHandler);
		control_button_reset = $("<button>")
									.attr("id", "expense_item_contol_reset_" + expense_item_random)
									.addClass("btn btn-default form-control form-group")
									.attr("data-random", expense_item_random)
									.append("Очистить")
									.on("click", ExpenseElementReset_ClickHandler);

		fold_docs_row
									.addClass("")
									.attr("id", "expense_fold_docs_row_" + expense_item_random)
									.hide();

		fold_docs_button_mob = $("<button>")
									.addClass("btn btn-default form-control form-group")
									.attr("data-random", expense_item_random)
									.attr("data-target", ".expense_item_xs_collapse_" + expense_item_random)
									.attr("data-toggle", "collapse")
									.append("Развернуть");

		fold_docs_button_desk = $("<i>")
									.addClass("fa fa-folder-open-o")
									.attr("data-random", expense_item_random)
									.attr("data-target", "#expense_item_docs_" + expense_item_random)
									.attr("data-toggle", "collapse")
									.attr("aria-hidden", "true");

		expense_item_remove_row
									.addClass("form-group")
									.attr("id", "expense_item_remove_row_" + expense_item_random)
									.hide();
		expense_item_remove_button_mob = $("<i>")
									.addClass("fa fa-times-circle fa-3x text-danger float_right __remove_button")
									.attr("data-random", expense_item_random)
									.on("click", AreYouSure_ExpenseItemRemove_ClickHandler)
									.attr("aria-hidden", "true");
		expense_item_remove_button_desk = $("<i>")
									.addClass("fa fa-times-circle float_right __remove_button")
									.attr("data-random", expense_item_random)
									.on("click", AreYouSure_ExpenseItemRemove_ClickHandler)
									.attr("aria-hidden", "true");

		expense_item_remove_col_mob.append(expense_item_remove_button_mob);
		expense_item_remove_col_desk.append(expense_item_remove_button_desk);
		date_col.append(date_input);
		payment_type_col.append(payment_type_div);
		comment_col.append(comment_input);
		type_col.append(type_select);
		price_domestic_col.append(price_domestic_input);
		price_foreign_col.append(price_foreign_input);
		currency_nominal_col.append(currency_nominal_input);
		currency_name_col.append(currency_name_input);
		currency_value_col.append(currency_value_input);
		control_button_ok_col.append(control_button_ok);
		control_button_reset_col.append(control_button_reset);
		fold_docs_col_mob.append(fold_docs_button_mob);
		fold_docs_col_desk.append(fold_docs_button_desk);

		expense_item_remove_row
			.append(expense_item_remove_col_desk);
		first_row
			.append(date_col)
			.append(payment_type_col)
			.append(type_col)
			.append(comment_col);

		second_row
			.append(price_domestic_col)
			.append(currency_col)
			.append(price_foreign_col)
			.append(currency_nominal_col)
			.append(currency_name_col)
			.append(currency_value_col);

		control_buttons_row
			.append(control_button_ok_col)
			.append(control_button_reset_col);

		fold_docs_row
			.append(fold_docs_col_mob)
			.append(fold_docs_col_desk)
			.append(expense_item_remove_col_mob);

		container
			.append(expense_item_remove_row)
			.append(first_row)
			.append(second_row)
			.append(fold_docs_row)
			.append(expense_item_docs)
			.append(control_buttons_row);


		// --- scoping initial values assignment
		if(typeof(expense) != "undefined")
		{
			var	bt_expense_date = "";

			// console.debug("--- expense " + expense.bt_expense_templates[0].title);

			if(typeof(expense.date) != "undefined") bt_expense_date = ConvertSQLDateToPageFormat(expense.date);
			if(bt_expense_date.length)
			{
				if(typeof(bt_expense_date) != "undefined") 					date_input.val(bt_expense_date);
				if(typeof(expense.id) != "undefined")						container.attr("data-bt_expense_id", expense.id);
				if(typeof(expense.bt_expense_templates) != "undefined")		type_select.find("option[value='" + expense.bt_expense_templates[0].id + "']").prop("selected", true);
				if(typeof(expense.comment) != "undefined") 					comment_input.val(system_calls.ConvertHTMLToText(expense.comment));
				if(typeof(expense.price_domestic) != "undefined") 			price_domestic_input.val(parseFloat(expense.price_domestic) || "");
				if(typeof(expense.price_foreign) != "undefined") 			price_foreign_input.val(parseFloat(expense.price_foreign) || "");
				if(typeof(expense.currency_nominal) != "undefined") 		currency_nominal_input.val(parseFloat(expense.currency_nominal) || "");
				if(typeof(expense.currency_name) != "undefined") 			currency_name_input.val(system_calls.ConvertHTMLToText(expense.currency_name));
				if(typeof(expense.currency_value) != "undefined") 			currency_value_input.val(parseFloat(expense.currency_value) || "");

				// --- get expense lines
				if(	
					(typeof(expense.bt_expense_templates) != "undefined") &&
					expense.bt_expense_templates.length &&
					(typeof(expense.bt_expense_templates[0].line_templates) != "undefined") &&
					expense.bt_expense_templates[0].line_templates.length
				)
				{
					expense_item_docs.append(GetExpenseLineLayout_DOM(expense.bt_expense_templates[0], expense));

				}
				else
				{
					console.error("line_templates missed from expense.id(" + expense.id + ") object");
				}

				// --- payment type should be after expense_lines 
				// --- hide unnecessary expense_lines depends on payment type cash or card
				if(typeof(expense.payment_type) != "undefined")
				{
					payment_type_div.data("payment_type", expense.payment_type);
					if(expense.payment_type == "cash") payment_type_cash.addClass("label label-default");
					if(expense.payment_type == "card") payment_type_card.addClass("label label-default");

					container.find("div.row.expense_item_doc").hide();
					container.find("div.row.expense_item_doc." + expense.payment_type).show();
				}

				container = ConvertExpenseLookDOMFromNewToEdit(container);
			}
		}

		result = result.add(container);

		return result;
	};

	var	AreYouSure_ExpenseItemRemove_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");

		if($(".expense_item").length == 2)
		{
			system_calls.PopoverError(currTag, "Нельзя удалять единственный расход");
		}
		else
		{
			$("#AreYouSureRemoveExpenseItem .submit").data("target_element_id", "expense_item_" + expense_item_random);
			$("#AreYouSureRemoveExpenseItem").modal("show");
		}

	};

	var	isRequiredDoc = function(sow_id, bt_expense_template_id, doc_id)
	{
		var	result = true;

		for(var i = 0; i < data_global.sow.length; ++i)
		{
			if(data_global.sow[i].id == sow_id)
			{
				for(var j = 0; j < data_global.sow[i].bt_expense_templates.length; ++j)
				{
					if(data_global.sow[i].bt_expense_templates[j].id == bt_expense_template_id)
					{
						for(var k = 0; k < data_global.sow[i].bt_expense_templates[j].line_templates.length; ++k)
						{
							if(data_global.sow[i].bt_expense_templates[j].line_templates[k].id == doc_id)
							{
								if(data_global.sow[i].bt_expense_templates[j].line_templates[k].required == "N") result = false;
								break;
							}
						}
						break;
					}
				}
				break;
			}
		}

		return result;
	};

	var	CheckExpenseItemDocsValidity = function($pressed_button, expense_item_random)
	{
		var		currTag = $pressed_button;
		var		result = true;

		var		curr_sow_id = $("#sowSelector").val();
		var		expense_item_payment_type = $("#expense_item_payment_type_" + expense_item_random).data("payment_type");

		$("#expense_item_docs_" + expense_item_random + " .expense_item_doc_main_field").each(function()
		{
			var		expense_item_doc = $(this);
			var		expense_item_doc_payment = expense_item_doc.data("payment");
			var		expense_item_doc_random = expense_item_doc.data("random");
			var		$expense_item_doc_main_field_tag = $("#expense_item_doc_main_field_" + expense_item_doc_random);

			if(expense_item_doc_payment.search(expense_item_payment_type) >= 0)
			{
				// --- this doc assigned to chosen payment type 
							
				if(isRequiredDoc(curr_sow_id, $expense_item_doc_main_field_tag.data("bt_expense_template_id"), $expense_item_doc_main_field_tag.data("bt_expense_line_template_id")))
				{
					var		element_dom_type = $expense_item_doc_main_field_tag.data("dom_type");
					if(element_dom_type == "image")
					{
						if($expense_item_doc_main_field_tag.attr("src").search("blob:") === 0)
						{
							// --- correct, nothing to do
						}
						else if($expense_item_doc_main_field_tag.attr("src").search("expense_lines/"))
						{
							// --- correct, nothing to do
						}
						else
						{
							result = false;
							system_calls.PopoverError(currTag, "Загрузите фото обязательного документа");
							system_calls.PopoverError($expense_item_doc_main_field_tag.attr("id"), "Загрузите фото обязательного документа");
						}
					}
					else if(element_dom_type == "input")
					{
						if($expense_item_doc_main_field_tag.val().length)
						{
							// --- correct, nothing to do
						}
						else
						{
							result = false;
							system_calls.PopoverError(currTag, "Введите значение в обязательное поле");
							system_calls.PopoverError($expense_item_doc_main_field_tag.attr("id"), "Введите значение в обязательное поле");
						}
					}
					else if(element_dom_type == "allowance")
					{
						if($expense_item_doc_main_field_tag.val().length)
						{
							// --- correct, nothing to do
						}
						else
						{
							result = false;
							system_calls.PopoverError(currTag, "Введите значение в обязательное поле");
							system_calls.PopoverError($expense_item_doc_main_field_tag.attr("id"), "Введите значение в обязательное поле");
						}
					}
					else
					{
						console.error("unknown expense doc.id(" + expense_item_doc_main_field_tag.data("bt_expense_line_template_id") +  ") type(" + element_dom_type + ")");
					}
				}
			}

		});

		return result;
	};


	var	CheckExpenseItemValidity = function($pressed_button, expense_item_random)
	{
		var		currTag = $pressed_button;
		var		result = false;

		var		curr_sow_id = $("#sowSelector").val();
		var		expense_item_type_id = $("#expense_item_type_" + expense_item_random).val();
		var		template_bt_expense_item;

		if($("#expense_item_" + expense_item_random).data("bypass_check_validity") == "Y")
		{
			// --- bypass check allowed just once
			$("#expense_item_" + expense_item_random).removeData("bypass_check_validity");	
			result = true;
		}
		else
		{
			if(curr_sow_id === "")
			{
				system_calls.PopoverError(currTag, "Выберите SoW");
				system_calls.PopoverError("sowSelector", "Выберите SoW");
			}
			else if(expense_item_type_id === "")
			{
				system_calls.PopoverError(currTag, "Выберите тип расхода");
				system_calls.PopoverError("expense_item_type_" + expense_item_random, "Выберите тип расхода");
			}
			else
			{

				data_global.sow.forEach(function(sow_item)
				{
					if(sow_item.id == curr_sow_id)
					{
						sow_item.bt_expense_templates.forEach(function(expense_item)
						{
							if(expense_item.id == expense_item_type_id)
							{
								template_bt_expense_item = expense_item;
							}
						});
					}
				});

				if(typeof(template_bt_expense_item) == "undefined")
				{
					troubleshooting.PopoverError(currTag.attr("id"), "ошибка загрузки списка документов", "template_bt_expense_item not found for sow_id(" + curr_sow_id + "), expense_item_id(" + expense_item_type_id + ")", "");
				}
				else
				{
					if(!$(".expense_item_date_" + expense_item_random).val().match(/^\d{1,2}\/\d{1,2}\/\d{4}$/))
					{
						var		date_tag_id = $(".expense_item_date_" + expense_item_random).attr("id");
						system_calls.PopoverError(currTag, "Укажите дату расхода");
						system_calls.PopoverError(date_tag_id, "Укажите дату расхода");
					}
					else if(!$("#expense_item_price_domestic_" + expense_item_random).val().match(/^[\d\.]+$/))
					{
						system_calls.PopoverError(currTag, "Укажите сумму в руб.");
						system_calls.PopoverError("expense_item_price_domestic_" + expense_item_random, "Укажите сумму в руб.");
					}
					else if($("#expense_item_price_foreign_" + expense_item_random).val().length && !$("#expense_item_price_foreign_" + expense_item_random).val().match(/^[\d\.]+$/))
					{
						system_calls.PopoverError(currTag, "Укажите сумму в валюте");
						system_calls.PopoverError("expense_item_price_foreign_" + expense_item_random, "Укажите сумму в валюте");
					}
					else if($("#expense_item_price_foreign_" + expense_item_random).val().length && !$("#expense_item_currency_nominal_" + expense_item_random).val().match(/^\d+$/))
					{
						system_calls.PopoverError(currTag, "Укажите номинал валюты");
						system_calls.PopoverError("expense_item_currency_nominal_" + expense_item_random, "Укажите номинал валюты");
					}
					else if($("#expense_item_price_foreign_" + expense_item_random).val().length && !$("#expense_item_currency_value_" + expense_item_random).val().match(/^[\d\.]+$/))
					{
						system_calls.PopoverError(currTag, "Укажите курс обмена");
						system_calls.PopoverError("expense_item_currency_value_" + expense_item_random, "Укажите курс обмена");
					}
					else if($("#expense_item_price_foreign_" + expense_item_random).val().length && ($("#expense_item_currency_name_" + expense_item_random).val().length ===0))
					{
						system_calls.PopoverError(currTag, "Укажите название валюты");
						system_calls.PopoverError("expense_item_currency_name_" + expense_item_random, "Укажите название валюты");
					}
					else if($("#expense_item_price_foreign_" + expense_item_random).val().length && ( $("#expense_item_price_domestic_" + expense_item_random).val() != system_calls.RoundedTwoDigitMul(system_calls.RoundedTwoDigitDiv($("#expense_item_price_foreign_" + expense_item_random).val(), $("#expense_item_currency_nominal_" + expense_item_random).val()), $("#expense_item_currency_value_" + expense_item_random).val()) ))
					{
						system_calls.PopoverError(currTag, "Сумма в рублях не соответсвует сумме в валюте и курсу обмена");
						system_calls.PopoverError("expense_item_price_domestic_" + expense_item_random, "Сумма в рублях не соответсвует сумме в валюте и курсу обмена");
					}
					else if(!CheckExpenseItemDocsValidity(currTag, expense_item_random))
					{
						// --- ErrorPopover alarmed from confition function
					}
					else
					{
						result = true;
					}
				}

			}
		}
		
		return result;
	};

	var	CheckBTValidity = function($pressed_button)
	{
		var		currTag = $pressed_button;
		var		result = false;

		var		curr_sow_id = $("#sowSelector").val();
		var		template_bt_expense_item;

		if(curr_sow_id === "")
		{
			system_calls.PopoverError(currTag, "Выберите договор в рамках которого вы отчитываетесь");
			system_calls.PopoverError("sowSelector", "Выберите договор в рамках которого вы отчитываетесь");
		}
		else if($("#bt_destination").val() === "")
		{
			system_calls.PopoverError(currTag, "Укажите пункт назначения");
			system_calls.PopoverError("bt_destination", "Укажите пункт назначения");
		}
		else if($("#bt_purpose").val() === "")
		{
			system_calls.PopoverError(currTag, "Укажите цель поездки");
			system_calls.PopoverError("bt_purpose", "Укажите цель поездки");
		}
		else if(!$("#bt_start_date").val().match(/^\d{1,2}\/\d{1,2}\/\d{4}$/))
		{
			system_calls.PopoverError(currTag, "Укажите день убытия");
			system_calls.PopoverError("bt_start_date", "Укажите день убытия");
		}
		else if(!$("#bt_end_date").val().match(/^\d{1,2}\/\d{1,2}\/\d{4}$/))
		{
			system_calls.PopoverError(currTag, "Укажите день прибытия");
			system_calls.PopoverError("bt_end_date", "Укажите день прибытия");
		}
		else if($("#customerSelector").val() === "")
		{
			system_calls.PopoverError(currTag, "Укажите заказчика");
			system_calls.PopoverError("bt_end_date", "Укажите заказчика");
		}
		else
		{
			var		total_bt_amount = 0;

			$("#expense_items .expense_item_price_domestic").each(function()
			{
				var		currTag = $(this);

				if(parseFloat(currTag.val()))
				{
					total_bt_amount += parseFloat(currTag.val());
				}
			});

			if(total_bt_amount)
			{
				var		expense_items_result = true;

				$("#expense_items .expense_item").each(function()
				{
					var		expense_item = $(this);
					var		expense_item_random = expense_item.data("random");

					expense_items_result &= CheckExpenseItemValidity(currTag, expense_item_random);
				});

				if(expense_items_result) // --- all expense items are correct
				{
					result = true;
				}
			}
			else
			{
				system_calls.PopoverError(currTag, "Нет возмещаемых расходов.");
			}
		}

		return result;
	};

	var	CollectFormData = function()
	{
		var		formData = new FormData();
		var		is_pdf = "";

		formData.append("bt_id", $("#bt").data("bt_id"));
		formData.append("sow_id", $("#sowSelector").val());
		formData.append("customer_id", $("#customerSelector").val());
		formData.append("destination", $("#bt_destination").val());
		formData.append("bt_purpose", $("#bt_purpose").val());
		formData.append("bt_start_date", $("#bt_start_date").val());
		formData.append("bt_end_date", $("#bt_end_date").val());
		$("#expense_items .expense_item").each(function()
		{
			var		expense_item = $(this);
			var		expense_item_random = expense_item.data("random");

			formData.append("expense_item_random_" + expense_item_random,			expense_item_random); // --- unique expense_id over the request course
			formData.append("bt_expense_id_" + expense_item_random,					expense_item.data("bt_expense_id")); // --- bt_expenses.id in DB
			formData.append("expense_item_date_" + expense_item_random,				$(".expense_item_date_" + expense_item_random).val());
			formData.append("expense_item_payment_type_" + expense_item_random,		$("#expense_item_payment_type_" + expense_item_random).data("payment_type"));
			formData.append("expense_item_type_" + expense_item_random,				$("#expense_item_type_" + expense_item_random).val());
			formData.append("expense_item_comment_" + expense_item_random,			$("#expense_item_comment_" + expense_item_random).val());
			formData.append("expense_item_price_domestic_" + expense_item_random,	$("#expense_item_price_domestic_" + expense_item_random).val());
			formData.append("expense_item_price_foreign_" + expense_item_random,	$("#expense_item_price_foreign_" + expense_item_random).val());
			formData.append("expense_item_currency_nominal_" + expense_item_random,	$("#expense_item_currency_nominal_" + expense_item_random).val());
			formData.append("expense_item_currency_name_" + expense_item_random,	$("#expense_item_currency_name_" + expense_item_random).val());
			formData.append("expense_item_currency_value_" + expense_item_random,	$("#expense_item_currency_value_" + expense_item_random).val());

			$("#expense_item_docs_" + expense_item_random + " .expense_item_doc").each(function()
			{
				var		expense_item_doc = $(this);
				var		expense_item_doc_random = expense_item_doc.data("random");

				formData.append("expense_item_doc_random_" + expense_item_doc_random,		expense_item_doc_random); // --- unique expense_id over the request course
				formData.append("expense_item_parent_random_" + expense_item_doc_random,	expense_item_random);
				formData.append("expense_item_doc_id_" + expense_item_doc_random,			$("#expense_item_doc_main_field_" + expense_item_doc_random).data("bt_expense_line_template_id"));
				formData.append("expense_line_id_" + expense_item_doc_random,				$("#expense_item_doc_main_field_" + expense_item_doc_random).data("bt_expense_line_id"));
				formData.append("expense_item_doc_dom_type_" + expense_item_doc_random,		$("#expense_item_doc_main_field_" + expense_item_doc_random).data("dom_type"));
				formData.append("expense_item_doc_comment_" + expense_item_doc_random,		$("#expense_item_doc_comment_" + expense_item_doc_random).val());
				
				if($("#expense_item_doc_main_field_" + expense_item_doc_random).data("dom_type") == "image")
				{
					if(
						(typeof($("#expense_item_doc_main_field_" + expense_item_doc_random).data("original_file")) == "object") &&
						(typeof($("#expense_item_doc_main_field_" + expense_item_doc_random).data("original_file").name) == "string")
					)
					{
						is_pdf = system_calls.isPdf($("#expense_item_doc_main_field_" + expense_item_doc_random).data("original_file").name);

						formData.append("expense_item_doc_main_field_" + expense_item_doc_random, $("#expense_item_doc_main_field_" + expense_item_doc_random).data("original_file"), "expense_item_doc_main_field_" + expense_item_doc_random + (is_pdf ? ".pdf" : ".jpg"));
					}
				}
				else if($("#expense_item_doc_main_field_" + expense_item_doc_random).data("dom_type") == "input")
				{
					formData.append("expense_item_doc_main_field_" + expense_item_doc_random,	$("#expense_item_doc_main_field_" + expense_item_doc_random).val());
				}
				else if($("#expense_item_doc_main_field_" + expense_item_doc_random).data("dom_type") == "allowance")
				{
					formData.append("expense_item_doc_main_field_" + expense_item_doc_random,	$("#expense_item_doc_main_field_" + expense_item_doc_random).val());
				}
				else
				{
					console.debug("error in expense_item_doc_main_field_" + expense_item_doc_random + " dom_type(" + $("#expense_item_doc_main_field_" + expense_item_doc_random).data("dom_type") + ")");
				}
			});
		});

		return formData;
	};

	var	SendBTToServer = function(currTag, action)
	{
		currTag.button("loading");

		if(CheckBTValidity(currTag))
		{
			var		formData = CollectFormData();

			formData.append("action", "AJAX_submitBT");
			formData.append("action_type", action);

			$.ajax({
				url: "/cgi-bin/subcontractor.cgi",
				cache: false,
				contentType: false,
				processData: false,
				async: true,
				data: formData,
				type: 'post',
				success: function(server_response) 
				{
					var		data = JSON.parse(server_response);
					var		suffix = "";

					if(data.result == "success")
					{
						window.location.href = "/cgi-bin/subcontractor.cgi?action=bt_list_template&rand=" + Math.random()*98765432123456;
					}
					else
					{
						if((typeof(data.file_id) != "undefined"))
						{
							suffix = " (" + $("#" + data.file_id).attr("data-file_name") + ")";
							$("#" + data.file_id).addClass("animate_danger_box_shadow");
							setTimeout(function() { $("#" + data.file_id).removeClass("animate_danger_box_shadow"); }, 6000);
						}

						system_calls.PopoverError(currTag, "Ошибка: " + data.description + suffix);
					}

					setTimeout(function() {
						currTag.button("reset");
					}, 500);
				},
				error: function(server_response) {
					console.debug("fail to get server response");
					system_calls.PopoverError(currTag, "Ошибка ответа сервера");

					setTimeout(function() {
						currTag.button("reset");
					}, 500);
				}
			});
		}
		else
		{
			setTimeout(function()
			{
				currTag.button("reset");
			}, 500);
		}
	};

	var	BTSubmit_ClickHandler = function(e)
	{
		var		currTag = $(this);

		SendBTToServer(currTag, "submit");
	};

	var	BTSave_ClickHandler = function(e)
	{
		var		currTag = $(this);

		SendBTToServer(currTag, "save");
	};

	// --- change expense form look 
	var	ConvertExpenseLookDOMFromNewToEdit = function(moving_tag)
	{
		var		expense_item_random = moving_tag.data("random");

		moving_tag.addClass("single_block box-shadow--6dp");

		// --- this helps to avoid confusion with 2 ways unfolding expense_item_docs
		// --- 1) changing document type
		// --- 2) changing doc_fold_unfold button
		moving_tag.find("#expense_item_type_" + expense_item_random).attr("disabled", "");

		// --- collapse all excessive elements
		if((system_calls.GetCurrentGridOption() == "xs") || (system_calls.GetCurrentGridOption() == "sm"))
		{
			// --- mobile collapse
			moving_tag.find(".expense_item_xs_collapse_" + expense_item_random).collapse();
		}
		else
		{
			// --- desktop collapse
			moving_tag.find("#expense_item_docs_" + expense_item_random).collapse();
		}

		moving_tag.find("#expense_item_control_row_" + expense_item_random).hide();
		moving_tag.find("#expense_fold_docs_row_" + expense_item_random).show();
		moving_tag.find("#expense_item_remove_row_" + expense_item_random).show();

		return moving_tag;
	};

	var	ExpenseElementSubmit_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");


		if(CheckExpenseItemValidity(currTag, expense_item_random))
		{
			var		moving_tag = $("#expense_item_" + expense_item_random);

			$("#collapsible_new_item").collapse("hide");

			setTimeout(function()
			{
				moving_tag.hide();

				moving_tag = ConvertExpenseLookDOMFromNewToEdit(moving_tag);

				$("#expense_items").append(moving_tag);
				moving_tag.show(200);
				InitExpenseItemLayout();
			}, 200);
		}

	};

	var	ExpenseElementReset_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");

		InitExpenseItemLayout();
	};

	var	ExpensePaymentType_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");
		var		new_payment_type = currTag.data("payment_type");
		var		curr_payment_type = $("#expense_item_payment_type_" + expense_item_random).data("payment_type");

		if(new_payment_type == curr_payment_type)
		{
			// --- do nothing
		}
		else
		{
			$("#expense_item_payment_type_" + new_payment_type + "_" + expense_item_random).addClass("label label-default");
			$("#expense_item_payment_type_" + curr_payment_type + "_" + expense_item_random).removeClass("label label-default");
			$("#expense_item_payment_type_" + expense_item_random).data("payment_type", new_payment_type);

			// $("div.row.expense_item_doc").hide(200);
			// $("div.row.expense_item_doc." + $("#expense_item_payment_type_" + expense_item_random).data("payment_type")).show(200);

			$("#expense_item_docs_" + expense_item_random + " div.expense_item_doc").each(function()
				{
					var		expense_item_doc_tag = $(this);
					var		tag_classes = expense_item_doc_tag.attr("class");

					if(tag_classes.search(new_payment_type) >= 0) expense_item_doc_tag.show(200);
					else if(tag_classes.search(curr_payment_type) >= 0) expense_item_doc_tag.hide(200);
				});
		}
	};

	var	GetExpenseLineLayout_DOM = function(bt_expense_template, expense)
	{
		var	result = $();

		bt_expense_template.line_templates.forEach(function(expense_line_template)
		{
			var		random = GetRandomWithPrefix("expense_item_doc_");
			var		row = $("<div>").addClass("row expense_item_doc " + expense_line_template.payment);
			var		field_col = $("<div>").addClass("col-xs-6 col-md-2");
			var		title_col = $("<div>").addClass("col-xs-6 col-md-6");
			var		comment_col = $("<div>").addClass("col-xs-12 col-md-4");

			var		doc_type;
			var		title, doc_title;
			var		comment;
			var		file_name = "";
			var		allowances;
			var		option;
			var		i;

			row
				.attr("id", "expense_item_doc_" + random)
				.attr("data-random", random);

			if(expense_line_template.dom_type == "image")
			{
				var		doc_preview = $("<span>")
							.addClass("fa fa-eye float_right cursor_pointer")
							.attr("aria-hidden", "true")
							.attr("id", "expense_item_doc_main_field_preview_" + random)
							.attr("data-random", random)
							.on("click", PreviewDocumentImage_ClickHandler);

				doc_type = $("<img>")
							.addClass("max_100px_100percents niceborder form-group expense_item_doc_main_field")
							.attr("id", "expense_item_doc_main_field_" + random)
							.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
							.attr("data-random", random)
							.attr("data-bt_expense_line_id", "0")
							.attr("data-bt_expense_line_template_id", expense_line_template.id)
							.attr("data-bt_expense_template_id", expense_line_template.bt_expense_template_id)
							.attr("data-payment", expense_line_template.payment)
							.attr("data-dom_type", expense_line_template.dom_type)
							.on("load", PreuploadDocumentImage_LoadHandler)
							.on("click", PreuploadDocumentImage_ClickHandler);

				system_calls.AddDragNDropFile(doc_type, PreuploadDocumentImage_LoadHandler);

				doc_type = doc_type.add(doc_preview);
			}
			else if(expense_line_template.dom_type == "input")
			{
				doc_type = $("<input>")
							.addClass("form-control form-group expense_item_doc_main_field")
							.attr("id", "expense_item_doc_main_field_" + random)
							.attr("placeholder", expense_line_template.title)
							.attr("data-bt_expense_line_id", "0")
							.attr("data-bt_expense_line_template_id", expense_line_template.id)
							.attr("data-bt_expense_template_id", expense_line_template.bt_expense_template_id)
							.attr("data-payment", expense_line_template.payment)
							.attr("data-dom_type", expense_line_template.dom_type)
							.attr("data-random", random);
			}
			else if(expense_line_template.dom_type == "allowance")
			{
				doc_type = $("<select>")
							.addClass("form-control form-group expense_item_doc_main_field")
							.attr("id", "expense_item_doc_main_field_" + random)
							.attr("placeholder", expense_line_template.title)
							.attr("data-bt_expense_line_id", "0")
							.attr("data-bt_expense_line_template_id", expense_line_template.id)
							.attr("data-bt_expense_template_id", expense_line_template.bt_expense_template_id)
							.attr("data-payment", expense_line_template.payment)
							.attr("data-dom_type", expense_line_template.dom_type)
							.attr("data-random", random)
							.on("change", AllowanceCountry_ChangeHandler);

				if(expense_line_template.allowances)
				{
					allowances = expense_line_template.allowances;

					doc_type.append(
									$("<option>")
										.append("Выберите страну")
										.attr("data-country_id", "0")
										.attr("data-amount", "0")
									);
					for (i = allowances.length - 1; i >= 0; i--) 
					{
						option = $("<option>")
											.append(allowances[i].countries[0].title)
											.attr("value", allowances[i].countries[0].title)
											.attr("data-country_id", allowances[i].countries[0].id)
											.attr("data-amount", allowances[i].amount);

						if(allowances[i].countries[0].id == bt_destination_country_id_global)
						{
							option.prop("selected", "selected");
							setTimeout(function(){ $("#expense_item_doc_main_field_" + random).trigger("change"); }, 500);
						}

						// --- disable expense money input fields
						setTimeout(function() 
						{ 
							var		expense_amount_tag_random = doc_type.closest(".expense_item").find(".expense_item_price_domestic").attr("data-random");

							DisableExpenseAmountFields(expense_amount_tag_random); 
						}, 500);

						doc_type.append(option);
					}
				}
				else
				{
					console.error("allowances array required in allowance template");
				}
			}
			else
			{
				console.error("unknown expense_line_template.dom_type(" + expense_line_template.dom_type + ")");
			}

			doc_title = $("<span>").append(expense_line_template.title + (expense_line_template.required == "N" ? " (необязательно)" : "") + " ");
			if(expense_line_template.tooltip.length)
			{
				var		doc_tooltip = expense_line_template.tooltip;
				var		title_info = $("<i>")
										.addClass("fa fa-info-circle expense_item_doc_title_info")
										.attr("aria-hidden", "true")
										.attr("id", "expense_item_doc_title_info_" + random)
										.on("click", function() { system_calls.PopoverInfo($(this).attr("id"), doc_tooltip); });
				doc_title = doc_title.add(title_info);
			}
			title = $("<div>")
							.addClass("h4")
							.append(doc_title);
			title = title.add(
					$("<div>")
							.append(expense_line_template.description)
					);

			comment = $("<input>")
							.addClass("form-control form-group expense_item_doc_comment")
							.attr("id", "expense_item_doc_comment_" + random)
							.attr("placeholder", "коментарий (необязательно)")
							.attr("data-random", random);

			field_col.append(doc_type);
			title_col.append(title);
			comment_col.append(comment);


			row
				.append(field_col)
				.append(title_col)
				.append(comment_col);


			// --- enrich empty DOM-model with values from expense object
			if((typeof(expense) != "undefined") && (typeof(expense.bt_expense_lines) != "undefined"))
			{
				for (i = 0; i < expense.bt_expense_lines.length; i++)
				{
					if(expense.bt_expense_lines[i].bt_expense_line_template_id == expense_line_template.id)
					{
						if(typeof(expense.bt_expense_lines[i].value) != "undefined")
						{
							if(typeof(expense.bt_expense_lines[i].id) != "undefined") doc_type.attr("data-bt_expense_line_id", expense.bt_expense_lines[i].id);
							else console.error("expense.bt_expense_lines[" + i + "].id missed");
							if(typeof(expense.bt_expense_lines[i].comment) != "undefined") comment.val(system_calls.ConvertHTMLToText(expense.bt_expense_lines[i].comment));
							else console.error("expense.bt_expense_lines[" + i + "].comment missed in expense.bt_expense_lines[i].id(" + expense.bt_expense_lines[i].id + ")");

							if(typeof(expense.bt_expense_lines[i].value) != "undefined")
							{
								if(expense.bt_expense_lines[i].value.length)
								{
									if(expense_line_template.dom_type == "image")
									{
										system_calls.SetExpenseItemDocTagAttributes(doc_type, expense.bt_expense_lines[i].value);

// TODO: remove Jul 1
/*										file_name = expense.bt_expense_lines[i].value;
										if(file_name.search(".jpg") > 0)
										{
											doc_type
												.attr("src", "/images/expense_lines/" + file_name)
												.attr("data-file_type", "image")
												.attr("data-file", "/images/expense_lines/" + file_name);
										}
										else if(file_name.search(".pdf") > 0)
										{
											doc_type
												.attr("src", "/images/pages/common/pdf.png")
												.attr("data-file_type", "pdf")
												.attr("data-file", "/images/expense_lines/" + file_name);
										}
*/
									}
									else if(expense_line_template.dom_type == "input")
									{
										doc_type.val(expense.bt_expense_lines[i].value);
									}
									else if(expense_line_template.dom_type == "allowance")
									{
										doc_type.val(expense.bt_expense_lines[i].value);
									}
									else
									{
										console.error("unknown expense_line_template.dom_type(" + expense_line_template.dom_type + ")");
									}
								}
							}
							else
							{
								console.error("expense.bt_expense_lines[" + i + "].value missed in expense.bt_expense_lines[i].id(" + expense.bt_expense_lines[i].id + ")");
							}

							break;
						}
					}
				}	
			}

			result = result.add(row);
		});

		return result;
	};

	var	GetExpenseLines_ChangeHandler = function()
	{
		var		result = $();
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");
		var		payment_type = $("#expense_item_payment_type_" + expense_item_random).data("payment_type");

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.bt_expense_templates.forEach(function(expense_item)
				{
					if(expense_item.id == currTag.val())
					{
						result = result.add(GetExpenseLineLayout_DOM(expense_item));

/*
						expense_item.line_templates.forEach(function(doc)
						{
							var		random = GetRandomWithPrefix("expense_item_doc_");
							var		row = $("<div>").addClass("row expense_item_doc " + doc.payment);
							var		field_col = $("<div>").addClass("col-xs-6 col-md-2");
							var		title_col = $("<div>").addClass("col-xs-6 col-md-6");
							var		comment_col = $("<div>").addClass("col-xs-12 col-md-4");

							var		doc_type;
							var		title, doc_title;
							var		comment;

							row
								.attr("id", "expense_item_doc_" + random)
								.attr("data-random", random);

							if(doc.dom_type == "image")
							{
								var		doc_preview = $("<span>")
											.addClass("fa fa-eye float_right cursor_pointer")
											.attr("aria-hidden", "true")
											.attr("id", "expense_item_doc_main_field_preview_" + random)
											.attr("data-random", random)
											.on("click", PreviewDocumentImage_ClickHandler);

								doc_type = $("<img>")
											.addClass("max_100px_100percents niceborder form-group expense_item_doc_main_field")
											.attr("id", "expense_item_doc_main_field_" + random)
											.attr("src", "/images/pages/edit_profile/cloud_arrow.jpg")
											.attr("data-random", random)
											.attr("data-bt_expense_line_id", "0")
											.attr("data-bt_expense_line_template_id", doc.id)
											.attr("data-bt_expense_template_id", doc.bt_expense_template_id)
											.attr("data-payment", doc.payment)
											.attr("data-dom_type", doc.dom_type)
											.on("load", PreuploadDocumentImage_LoadHandler)
											.on("click", PreuploadDocumentImage_ClickHandler);
								doc_type = doc_type.add(doc_preview);
							}
							else if(doc.dom_type == "input")
							{
								doc_type = $("<input>")
											.addClass("form-control form-group expense_item_doc_main_field")
											.attr("id", "expense_item_doc_main_field_" + random)
											.attr("placeholder", doc.title)
											.attr("data-bt_expense_line_id", "0")
											.attr("data-bt_expense_line_template_id", doc.id)
											.attr("data-bt_expense_template_id", doc.bt_expense_template_id)
											.attr("data-payment", doc.payment)
											.attr("data-dom_type", doc.dom_type)
											.attr("data-random", random);
							}
							else
							{
								console.error("unknown doc.dom_type(" + doc.dom_type + ")");
							}

							doc_title = $("<span>").append(doc.title + (doc.required == "N" ? " (необязательно)" : "") + " ");
							if(doc.tooltip.length)
							{
								var		doc_tooltip = doc.tooltip;
								var		title_info = $("<i>")
														.addClass("fa fa-info-circle expense_item_doc_title_info")
														.attr("aria-hidden", "true")
														.attr("id", "expense_item_doc_title_info_" + random)
														.on("click", function() { system_calls.PopoverInfo($(this).attr("id"), doc_tooltip); });
								doc_title = doc_title.add(title_info);
							}
							title = $("<div>")
											.addClass("h4")
											.append(doc_title);
							title = title.add(
									$("<div>")
											.append(doc.description)
									);

							comment = $("<input>")
											.addClass("form-control form-group expense_item_doc_comment")
											.attr("id", "expense_item_doc_comment_" + random)
											.attr("placeholder", "коментарий (необязательно)")
											.attr("data-random", random);

							field_col.append(doc_type);
							title_col.append(title);
							comment_col.append(comment);


							row
								.append(field_col)
								.append(title_col)
								.append(comment_col);

							result = result.add(row);
						});

*/					}
				});
			}
		});


		if(payment_type.length)
		{
			$("#expense_item_docs_" + expense_item_random).hide(200);

			setTimeout(function()
			{
				$("#expense_item_docs_" + expense_item_random).empty().append(result);
				$("#expense_item_docs_" + expense_item_random + " div.row.expense_item_doc").hide();
				$("#expense_item_docs_" + expense_item_random + " div.row.expense_item_doc." + $("#expense_item_payment_type_" + expense_item_random).data("payment_type")).show();
				$("#expense_item_docs_" + expense_item_random).show(200);
			}, 200);
		}
	};

	var	GetRandomWithPrefix = function(prefix)
	{
		var		random;

		do
		{
			random = Math.round(Math.random() * 45769320976);
		} while($("#" + prefix + random).length);

		return random;
	};

	var	NewDate_ChangeHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");
		var		selected_date;
		var		options = $();

		if(currTag.val().length)
		{
			var		temp = currTag.val().split("/");

			if(temp.length == 3)
			{
				selected_date = new Date(parseInt(temp[2]), parseInt(temp[1]) - 1, parseInt(temp[0]));

				$("#expense_item_currency_col_" + expense_item_random).empty().append("<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>");

				$.getJSON(
					'/cgi-bin/subcontractor.cgi',
					{
						action:"AJAX_getCurrencyRateList",
						date:system_calls.GetFormattedDateFromSeconds(selected_date.getTime() / 1000, "YYYY-MM-DD")
					})
					.done(function(data) {
								if(data.status == "success")
								{
									if(data.rates.length)
									{
										var		select_tag = $("<select>")
																	.addClass("form-control")
																	.attr("id", "expense_item_currency_selector_" + expense_item_random)
																	.on("change", function() { SelectCurrency_ChangeHandler(expense_item_random); } );

										data.rates.sort(function(a, b)
										{
											var		result = 0;
											if(a.char_code < b.char_code) result = -1;
											if(a.char_code > b.char_code) result = 1;

											return result;
										});

										data.rates.forEach(function(rate)
										{
											var		option_tag = $("<option>")
																		.attr("data-char_code", rate.char_code)
																		.attr("data-nominal", rate.nominal)
																		.attr("data-name", rate.name)
																		.attr("data-value", rate.value)
																		.attr("value", rate.char_code)
																		.append(rate.char_code);


											options = options.add(option_tag);
											select_tag.append(options);
										});

										if(last_selected_currency_global.length) select_tag.val(last_selected_currency_global);
										$("#expense_item_currency_col_" + expense_item_random).empty().append(select_tag);

										// --- dont move it up
										// --- SelectCurrency_ChangeHandler must be called after DOM built
										SelectCurrency_ChangeHandler(expense_item_random);
									}
									else
									{
										system_calls.PopoverError(currTag, "Нет данных курса обмена за эту дату");
										$("#expense_item_currency_col_" + expense_item_random).empty();
									}
								}
								else
								{
									system_calls.PopoverError(currTag, "Ошибка: " + data.description);
									console.error("ERROR: " + data.description);
									$("#expense_item_currency_col_" + expense_item_random).empty();
								}

						})
					.fail(function(data) {
						setTimeout(function() {
							$("#expense_item_currency_col_" + expense_item_random).empty();
							system_calls.PopoverError(currTag, "Ошибка ответа сервера");
						}, 500);
					});
			}
			else
			{
				console.error("wrond date format");
				system_calls.PopoverError(currTag, "некорректный формат даты. Необходимо: ДД/ММ/ГГГГ");
			}
		}

	};

	var	SelectCurrency_ChangeHandler = function(expense_item_random)
	{
		var		currTag = $("#expense_item_currency_selector_" + expense_item_random).children(":selected");

		$("#expense_item_currency_nominal_" + expense_item_random).val(currTag.data("nominal"));
		$("#expense_item_currency_name_" + expense_item_random).val(currTag.data("name"));
		$("#expense_item_currency_value_" + expense_item_random).val(currTag.data("value"));
		last_selected_currency_global = currTag.data("char_code");

		ForeignPrice_ChangeHandler(expense_item_random);
	};

	var	ForeignPrice_ChangeHandler = function(expense_item_random)
	{
		var		price_foreign_input = $("#expense_item_price_foreign_" + expense_item_random);
		var		price_domestic_input = $("#expense_item_price_domestic_" + expense_item_random);

		if(price_foreign_input.val())
		{
			if(!$("#expense_item_currency_nominal_" + expense_item_random).val())
				$("#expense_item_currency_nominal_" + expense_item_random).val(1);
			if($("#expense_item_currency_value_" + expense_item_random).val())
			{
				price_domestic_input.val(
					system_calls.RoundedTwoDigitMul(
						system_calls.RoundedTwoDigitDiv(
							price_foreign_input.val(),
							$("#expense_item_currency_nominal_" + expense_item_random).val()
						),
						$("#expense_item_currency_value_" + expense_item_random).val()
					)
				);
			}
			else
			{
				system_calls.PopoverError("expense_item_currency_value_" + expense_item_random, "Необходимо ввести курс с 4-мя знаками после запятой");
			}
		}
	};

	var	PreviewDocumentImage_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		expense_item_random = currTag.data("random");
		var		orig_image = $("#expense_item_doc_main_field_" + expense_item_random);
		var		tmpURLObj;

		if((orig_image.attr("data-file_type") == "jpg"))
		{
			system_calls.Exif_RemoveClasses($("#ImagePreviewModal_Img"));
			orig_image.attr("class").split(" ").forEach(function(class_name)
			{
				if(class_name.search("exif_") >= 0) $("#ImagePreviewModal_Img").addClass(class_name);
			});

			$("#ImagePreviewModal_Img").attr("src", orig_image.attr("data-file"));
			$("#ImagePreviewModal").modal("show");
		}
		// --- create new expense item doc
		else if((orig_image.attr("data-file_type") == "pdf"))
		{
			window.open(orig_image.attr("data-file"), '_blank');
		}
		else
		{
			console.error("Can't preview unknown file type.");
		}

	};

	var	PreuploadDocumentImage_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AddGeneralImageButton")
			.data("target_element_id", currTag.attr("id"))
			.click();
	};

	var	PreuploadDocumentImage_LoadHandler = function(e)
	{
		var		currTag = $(this);

		if(currTag.attr("src").length)
		{
			if(currTag.attr("src").search("blob:") === 0)
			{
				// --- exif-js check if ".exifdata" exists and doesn't referesh it for new picture
				// --- you should remove it manually
				delete currTag[0].exifdata;
				system_calls.Exif_RemoveClasses(currTag);
				system_calls.Exif_FixOrientation(currTag);
			}
		}
	};

	var	AddGeneralImageButton_ChangeHandler = function(e)
	{
		var		currTag = $(this);
		if(e.target.files.length)
		{
			var		target_element_id = currTag.data("target_element_id");
			var		imgPreview = $("#" + target_element_id);

			system_calls.SetExpenseItemDocTagAttributes(imgPreview, "", e.target.files[0]);

// TODO: remove Jul 1
/*			var		tmpURLObj = URL.createObjectURL(e.target.files[0]);

			imgPreview.data("original_file", e.target.files[0]);

			if(system_calls.isPdf(e.target.files[0].name))
			{
				imgPreview.attr("src", "/images/pages/common/pdf.png");
			}
			else
			{
				imgPreview.attr("src", tmpURLObj);
			}
*/
		}
		else
		{
			// --- "cancel" pressed in image upload window
		}
	};

	var	GetBTStatus_DOM = function(status)
	{
		var		status_icon = $("<i>").addClass("fa margin_left_13");

		if(status == "approved")
		{
			status_icon	.addClass("fa-check-circle color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-placement", "top")
						.attr("title", "подтверждено");
		}
		if(status == "saved")
		{
			status_icon	.addClass("fa-floppy-o color_grey")
						.attr("data-toggle", "tooltip")
						.attr("data-placement", "top")
						.attr("title", "сохранено");
		}
		if(status == "submit")
		{
			status_icon	.addClass("fa-clock-o color_orange")
						.attr("data-toggle", "tooltip")
						.attr("data-placement", "top")
						.attr("title", "ожидает подтверждения");
		}
		if(status == "rejected")
		{
			status_icon	.addClass("fa-times color_red")
						.attr("data-toggle", "tooltip")
						.attr("data-placement", "top")
						.attr("title", "отклонено");
		}

		status_icon.tooltip({ animation: "animated bounceIn"});

		return status_icon;
	};

	var MainInfo_OnloadRender = function(bt)
	{
		var		error_string = "";
		var 	temp_arr;
		var		bt_start_date, bt_end_date;

		bt_start_date = ConvertSQLDateToPageFormat(bt.date_start);
		if(bt_start_date.length)
		{

			bt_end_date = ConvertSQLDateToPageFormat(bt.date_end);
			if(bt_end_date.length)
			{
				$("#bt").attr("data-bt_id", bt.id);
				$("#bt").attr("data-bt_status", bt.status);
				CustomerSelectBox_OnloadRender(current_sow_global);
				$("#bt_destination").val(system_calls.ConvertHTMLToText(bt.place));
				$("#bt_purpose").val(system_calls.ConvertHTMLToText(bt.purpose));
				$("#bt_start_date").val(bt_start_date);
				$("#bt_end_date").val(bt_end_date);
				$("#bt_status").append(GetBTStatus_DOM(bt.status));
			}
			else
			{
				error_string = "некорректный формат даты в БД (должен быть YYYY-MM-DD)";
				console.error("incorrect DB return from DB(" + bt.date_end + "), date format must be YYYY-MM-DD");
			}
		}
		else
		{
			error_string = "некорректный формат даты в БД (должен быть YYYY-MM-DD)";
			console.error("incorrect DB return from DB(" + bt.date_start + "), date format must be YYYY-MM-DD");
		}

		return error_string;
	};

	var	ExpenseInfo_OnloadRender = function(expense)
	{
		var	error_string = "";
		var	expense_item_random = $("#expense_item_new > div:first").data("random");
		var	bt_expense_date;

		$("#expense_items").append(GetExpenseLayout_DOM(expense));

		return error_string;
	};

	var	ConvertSQLDateToPageFormat = function(sql_date)
	{
		var	result = "";
		var	temp_arr = sql_date.split("-");

		if(temp_arr.length == 3) 
		{
				result = temp_arr[2] + "/" + temp_arr[1] + "/" + temp_arr[0];			
		}

		return result;
	};

	var UpdateSoWID = function(new_sow_id)
	{
		if(current_sow_global != new_sow_id)
		{
			current_sow_global = new_sow_id;

			// --- do smth on sow_id change
		}
	};


	var	StartDate_ChangeHandler = function(e)
	{
		bt_end_date_global.datepicker( "option", "minDate", $.datepicker.parseDate( DATE_FORMAT_GLOBAL, $(this).val() ));
		// $("input.expense_item_date").datepicker( "option", "minDate", $.datepicker.parseDate( DATE_FORMAT_GLOBAL, $(this).val() ));

		// --- do smth on start date change
		UpdateAllwoanceTags();
	};

	var	EndDate_ChangeHandler = function(e)
	{
		bt_start_date_global.datepicker( "option", "maxDate", $.datepicker.parseDate( DATE_FORMAT_GLOBAL, $(this).val() ));
		// $("input.expense_item_date").datepicker( "option", "maxDate", $.datepicker.parseDate( DATE_FORMAT_GLOBAL, $(this).val() ));

		// --- do smth on end date change
		UpdateAllwoanceTags();
	};

	var	GetBTDuration = function()
	{
		var	bt_start_date_arr	= $("#bt_start_date")	.val().split(/\//);
		var	bt_end_date_arr		= $("#bt_end_date")		.val().split(/\//);
		var	duration			= 0 ;
		var	start_date;
		var	end_date;

		if((bt_start_date_arr.length == 3) && (bt_end_date_arr.length == 3))
		{
			start_date	= new Date(parseInt(bt_start_date_arr[2]),	parseInt(bt_start_date_arr[1]),	parseInt(bt_start_date_arr[0]));
			end_date	= new Date(parseInt(bt_end_date_arr[2]),	parseInt(bt_end_date_arr[1]),	parseInt(bt_end_date_arr[0]));

			duration		= (end_date - start_date) / (3600 * 24 * 1000) + 1;
		}

		return	duration;
	};

	var	UpdateAllwoanceTag = function(curr_tag)
	{
		var	amount			= parseFloat(curr_tag.find("option:selected").attr("data-amount"));
		var	cost_tag		= curr_tag.closest(".expense_item").find(".expense_item_price_domestic");

		cost_tag.val(system_calls.RoundedTwoDigitMul(amount, GetBTDuration()));

	};

	var	UpdateAllwoanceTags = function()
	{
		$("[data-dom_type=\"allowance\"]").each(function() { return UpdateAllwoanceTag($(this)); });
	};

	var	DisableExpenseAmountFields = function(random)
	{
		$(".expense_amount[data-random=\"" + random + "\"] input").prop("disabled", "disabled");
	};

	var	AllowanceCountry_ChangeHandler = function(e)
	{
		return UpdateAllwoanceTag($(this));
	};

	var	BTDestination_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;
		var		curr_tag = $(this);

		curr_tag.attr("data-id", id);

		bt_destination_country_id_global = ui.item.country_id;
	};

	var	SubmitLocalityIfUnknown_ChangeHandler = function(e)
	{
		var	curr_tag = $(this);

		if(curr_tag.val().length)
		{
			if(curr_tag.attr("data-id") && curr_tag.attr("data-id").length) {}
			else
			{
				$.getJSON(
					'/cgi-bin/ajax_anyrole_1.cgi',
					{
						action:	"AJAX_submitUnknownLocality",
						value:	curr_tag.val(),
					})
					.done(function(data) 
					{
					});
			}
		}
	};

/*
	var	RunWorker = function()
	{
		if(window.Worker)
		{
			var		helperWorker = new Worker("/js/pages/subcontractor_bt_worker.js");

			helperWorker.onmessage = function(e)
			{
				allowances_global = e.data.allowances;
			};

			setTimeout(function ()
			{
				helperWorker.postMessage(current_sow_global);
			}, 1021);
		}
		else
		{
			setTimeout(function ()
				{
					// --- AJAX jobTitle download
					$.getJSON('/cgi-bin/subcontractor.cgi?action=AJAX_getBTWorkerData', {sow_id: current_sow_global})
							.done(function(data) 
							{
								allowances_global = data.allowances;
							});
				}, 1021);
		} // --- End Worker
	};
*/


	return {
		Init: Init,
	};

})();
