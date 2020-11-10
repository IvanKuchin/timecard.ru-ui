var	bt_expense_template_line_obj = function()
{
	'use strict';

	var	data_global;
	var	isRemovable = true;
	var	random_global;
	var	title_change_callback;
	var	description_change_callback;
	var	tooltip_change_callback;
	var	doc_type_change_callback;
	var	payment_cash_change_callback;
	var	payment_card_change_callback;
	var	required_doc_change_callback;
	var	remove_click_callback;
	var	isPaymentCashEnabled_global = true;
	var	isPaymentCardEnabled_global = true;
	var	isRequiredEnabled_global = true;

	var	Init = function()
	{
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__bt_expense_template_line[data-random=\"" + random_global + "\"]").length);
	};

	var	GetRandom = function()
	{
		return random_global;
	};

	var	GetTitle = function()
	{
		return $("input.__bt_template_line_title[data-random=\"" + GetRandom() + "\"]").val();
	};

	var	Disable_CashPaymentOption = function()
	{
		isPaymentCashEnabled_global = false;
	};

	var	Disable_CardPaymentOption = function()
	{
		isPaymentCardEnabled_global = false;
	};

	var	Disable_RequiredOption = function()
	{
		isRequiredEnabled_global = false;
	};

	var	SetGlobalData = function(data_init)
	{
		if(typeof data_init					== "undefined") data_init = {};
		if(typeof data_init.id				== "undefined") data_init.id = "0";
		if(typeof data_init.bt_expense_line == "undefined") data_init.bt_expense_line = "0";
		if(typeof data_init.dom_type 		== "undefined") data_init.dom_type = "image";
		if(typeof data_init.title 			== "undefined") data_init.title = "";
		if(typeof data_init.description		== "undefined") data_init.description = "";
		if(typeof data_init.tooltip			== "undefined") data_init.tooltip = "";
		if(typeof data_init.payment			!= "undefined")
		{
			data_init.payment_cash = (data_init.payment.search("cash") >= 0 ? true : false);
			data_init.payment_card = (data_init.payment.search("card") >= 0 ? true : false);
		}
		if(typeof data_init.payment_cash	== "undefined") data_init.payment_cash = true;
		if(typeof data_init.payment_card	== "undefined") data_init.payment_card = true;
		if(typeof data_init.required		== "undefined") data_init.required = true;
		else
		{
			data_init.required = (data_init.required == "Y");
		}

		data_global = data_init;
	};

	var	Set_PaymentCash_Value			= function(param) { data_global.payment_cash = param; };
	var	Set_PaymentCard_Value			= function(param) { data_global.payment_card = param; };
	var	Set_RequiredDoc_Value			= function(param) { data_global.required = param; };
	var	Set_Removable_Flag				= function(param) { isRemovable = param; };

	var	Set_Title_ChangeCallback		= function(f) { if(typeof f == "function") title_change_callback = f; };
	var	Set_Description_ChangeCallback	= function(f) { if(typeof f == "function") description_change_callback = f; };
	var	Set_Tooltip_ChangeCallback		= function(f) { if(typeof f == "function") tooltip_change_callback = f; };
	var	Set_DocType_ChangeCallback		= function(f) { if(typeof f == "function") doc_type_change_callback = f; };
	var	Set_PaymentCash_ChangeCallback	= function(f) { if(typeof f == "function") payment_cash_change_callback = f; };
	var	Set_PaymentCard_ChangeCallback	= function(f) { if(typeof f == "function") payment_card_change_callback = f; };
	var	Set_RequiredDoc_ChangeCallback	= function(f) { if(typeof f == "function") required_doc_change_callback = f; };
	var	Set_Remove_ClickCallback		= function(f) { if(typeof f == "function") remove_click_callback = f; };

	var	UpdateID = function(newID)
	{
		if((typeof(newID) != "undefined") && newID.length)
		{
			data_global.id = newID;
			$(".__bt_template_line_title[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_description[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_tooltip[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_dom_type[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_payment_cash[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_payment_card[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_required[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
			$(".__bt_template_line_remove[data-random=\"" + GetRandom() + "\"]").attr("data-id", data_global.id);
		}
		else
		{
			console.error("ERROR: newID is empty");
		}

	};

	var	GetDOM = function()
	{
		var	row = $("<div>")
								.addClass("row expense_template_line __bt_expense_template_line expense_template_line_" + data_global.id)
								.attr("data-random", random_global)
								.attr("data-id", data_global.id);
		var	col_title = $("<div>")
								.addClass("col-xs-12 col-md-2 __bt_template_line_title");
		var	col_description = $("<div>")
								.addClass("col-xs-12 col-md-2 __bt_template_line_description");
		var	col_tooltip = $("<div>")
								.addClass("col-xs-6 col-md-2 __bt_template_line_tooltip");
		var	col_dom_type = $("<div>")
								.addClass("col-xs-6 col-md-2 __bt_template_line_dom_type");
		var	col_payment_cash = $("<div>")
								.addClass("col-xs-3 col-md-1 __bt_template_line_payment_cash");
		var	col_payment_card = $("<div>")
								.addClass("col-xs-3 col-md-1 __bt_template_line_payment_card");
		var	col_required = $("<div>")
								.addClass("col-xs-3 col-md-1 __bt_template_line_required");
		var	col_remove = $("<div>")
								.addClass("col-xs-3 col-md-1 __bt_template_line_remove");

		var	input_title	= $("<input>")
								.addClass("transparent __bt_template_line_title")
								.attr("placeholder", "Наименование")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("data-action", "AJAX_updateExpenseTemplateLineTitle")
								.on("change", Title_ChangeHandler)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.title)
								.val(data_global.title);
		var	input_description = $("<input>")
								.addClass("transparent __bt_template_line_description")
								.attr("placeholder", "Описание (необязательно)")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("data-action", "AJAX_updateExpenseTemplateLineDescription")
								.on("change", Description_ChangeHandler)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.description)
								.val(data_global.description);
		var	input_tooltip = $("<input>")
								.addClass("transparent __bt_template_line_tooltip")
								.attr("placeholder", "Подсказка (необязательно)")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("data-action", "AJAX_updateExpenseTemplateLineTooltip")
								.on("change", Tooltip_ChangeHandler)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.tooltip)
								.val(data_global.tooltip);
		var	select_dom_type = $("<select>")
								.addClass("form-group  transparent __bt_template_line_dom_type")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.on("change", DomType_ChangeHandler)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.dom_type)
								.attr("data-action", "AJAX_updateExpenseTemplateLineDomType");
		var	switch_payment_cash = $("<div>")
								.addClass("form-switcher");
		var	switch_payment_cash_input = $("<input>")
								.addClass("__bt_template_line_payment_cash")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "input_bt_expense_line_payment_cash_" + random_global)
								.attr("name", "input_bt_expense_line_payment_cash_" + random_global)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.payment_cash)
								.prop("checked", data_global.payment_cash ? "checked" : "");
		var	switch_payment_cash_label = $("<label>")
								.addClass("switcher")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "label_bt_expense_line_payment_cash_" + random_global)
								.attr("for", "input_bt_expense_line_payment_cash_" + random_global)
								.attr("data-action", "AJAX_updateExpenseTemplateLinePaymentCash")
								.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.on("click", PaymentCash_ClickHandler)
								.attr("title", "Оплата наличными");
		var	switch_payment_card = $("<div>")
								.addClass("form-switcher");
		var	switch_payment_card_input = $("<input>")
								.addClass("__bt_template_line_payment_card")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "input_bt_expense_line_payment_card_" + random_global)
								.attr("name", "input_bt_expense_line_payment_card_" + random_global)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.payment_card)
								.prop("checked", data_global.payment_card ? "checked" : "");
		var	switch_payment_card_label = $("<label>")
								.addClass("switcher")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "label_bt_expense_line_payment_card_" + random_global)
								.attr("for", "input_bt_expense_line_payment_card_" + random_global)
								.attr("data-action", "AJAX_updateExpenseTemplateLinePaymentCard")
								.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.on("click", PaymentCard_ClickHandler)
								.attr("title", "Оплата картой");
		var	switch_required = $("<div>")
								.addClass("form-switcher");
		var	switch_required_input = $("<input>")
								.addClass("__bt_template_line_required")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "input_bt_expense_line_required_" + random_global)
								.attr("name", "input_bt_expense_line_required_" + random_global)
								.attr("data-bt_expense_line", data_global.bt_expense_line)
								.attr("data-original_value", data_global.required)
								.prop("checked", data_global.required ? "checked" : "");
		var	switch_required_label = $("<label>")
								.addClass("switcher")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.attr("type", "checkbox")
								.attr("id", "label_bt_expense_line_required_" + random_global)
								.attr("for", "input_bt_expense_line_required_" + random_global)
								.attr("data-action", "AJAX_updateExpenseTemplateLineRequired")
								.attr("data-toggle", "tooltip")
								.attr("data-placement", "top")
								.on("click", RequiredDoc_ClickHandler)
								.attr("title", "Обязательный док-т");
		var remove_button = $("<i>")
								.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover __bt_template_line_remove")
								.attr("data-action", "AJAX_deleteExpenseTemplateLine")
								.attr("data-random", random_global)
								.attr("data-id", data_global.id)
								.on("click", Remove_ClickHandler);

		select_dom_type
						.append(
							$("<option>")
								.append("Картинка")
								.attr("value", "image")
						)
						.append(
							$("<option>")
								.append("Поле ввода")
								.attr("value", "input")
						)
						.append(
							$("<option>")
								.append("Надбавка")
								.attr("value", "allowance")
						);
		select_dom_type.val(data_global.dom_type);

		input_title = input_title.add($("<label>"));
		input_description = input_description.add($("<label>"));
		input_tooltip = input_tooltip.add($("<label>"));

		if(isRequiredEnabled_global) 	{} else {switch_required_input		.attr("disabled", ""); }
		if(isPaymentCardEnabled_global)	{} else {switch_payment_card_input	.attr("disabled", ""); }
		if(isPaymentCashEnabled_global)	{} else {switch_payment_cash_input	.attr("disabled", ""); }

		switch_payment_cash.append(switch_payment_cash_input).append(switch_payment_cash_label);
		switch_payment_card.append(switch_payment_card_input).append(switch_payment_card_label);
		switch_required.append(switch_required_input).append(switch_required_label);

		col_title		.append(input_title);
		col_description	.append(input_description);
		col_tooltip		.append(input_tooltip);
		col_dom_type	.append(select_dom_type);
		col_payment_cash.append(switch_payment_cash);
		col_payment_card.append(switch_payment_card);
		col_required	.append(switch_required);
		if(isRemovable) col_remove.append(remove_button);

		row
			.append(col_title)
			.append(col_description)
			.append(col_tooltip)
			.append(col_dom_type)
			.append(col_payment_cash)
			.append(col_payment_card)
			.append(col_required)
			.append(col_remove);

		switch_required_label		.tooltip({ animation: "animated bounceIn"});
		switch_payment_card_label	.tooltip({ animation: "animated bounceIn"});
		switch_payment_cash_label	.tooltip({ animation: "animated bounceIn"});

		return row;
	};

	var	Title_ChangeHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof title_change_callback == "function")
			return title_change_callback(currTag, Input_ChangeCallback);

		return true;
	};

	var	Description_ChangeHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof description_change_callback == "function")
			return description_change_callback(currTag, Input_ChangeCallback);

		return true;
	};

	var	Tooltip_ChangeHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof tooltip_change_callback == "function")
			return tooltip_change_callback(currTag, Input_ChangeCallback);

		return true;
	};

	var	DomType_ChangeHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof doc_type_change_callback == "function")
			return doc_type_change_callback(currTag, Input_ChangeCallback);

		return true;
	};

	var	PaymentCash_ClickHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof payment_cash_change_callback == "function")
			return payment_cash_change_callback(currTag, Switch_ChangeCallback);

		return true;
	};

	var	PaymentCard_ClickHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof payment_card_change_callback == "function")
			return payment_card_change_callback(currTag, Switch_ChangeCallback);

		return true;
	};

	var	RequiredDoc_ClickHandler	= function(e)
	{
		var	currTag = $(this);

		if(typeof required_doc_change_callback == "function")
		{
			return required_doc_change_callback(currTag, Switch_ChangeCallback);
		}

		return true;
	};

	var	Remove_ClickHandler	= function(e)
	{
		var	currTag = $(this);

		{
			// --- remove if empty
			if(
				($("input.__bt_template_line_title[data-random=\"" + random_global + "\"]").attr("data-id") == 0)
				&&
				($("input.__bt_template_line_title[data-random=\"" + random_global + "\"]").val().length === 0)
				&&
				($("input.__bt_template_line_description[data-random=\"" + random_global + "\"]").val().length == 0)
				&&
				($("input.__bt_template_line_tooltip[data-random=\"" + random_global + "\"]").val().length == 0)
			)
			{
				// --- remove if empty and new
				RemoveMe();
			}
			else
			{
				$("#AreYouSureRemoveExpenseTemplateLine").data("callback_func", AreYouSure_RemoveExpenseTemplateLine_ClickHandler);
				$("#AreYouSureRemoveExpenseTemplateLine").modal("show");
			}
		}


		return true;
	};

	var	AreYouSure_RemoveExpenseTemplateLine_ClickHandler = function()
	{
		var	remove_button = $("i.__bt_template_line_remove[data-random=\"" + random_global + "\"]");
		var	curr_tag = $("#AreYouSureRemoveExpenseTemplateLine button.submit");

		curr_tag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: remove_button.data("action"),
				id: remove_button.attr("data-id"),
				value: "fake_value",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveExpenseTemplateLine").modal("hide");
					RemoveMe();
				}
				else
				{
					// --- install previous value, due to error
					curr_tag.val(curr_tag.attr("data-db_value"));

					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
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
	};

	var	RemoveMe = function()
	{
		var		remove_tag = $("span").attr("data-random", random_global);

		if(typeof remove_click_callback == "function")
		{
			remove_click_callback(remove_tag, Switch_ChangeCallback);
		}
		setTimeout(function() { $("div.row[data-random=\"" + random_global + "\"]").parent().hide(200); }, 300);
		setTimeout(function() { $("div.row[data-random=\"" + random_global + "\"]").parent().remove(); }, 600);
	};

	// --- <input> and <select> are having same behavior with .val()
	// --- these two can be served by the same function
	var	Input_ChangeCallback = function(currTag, error_message)
	{
		var	original_value = currTag.attr("data-original_value");
		var	new_value = currTag.val();

		if(error_message.length)
		{
			system_calls.PopoverError(currTag, error_message);
			currTag.val(original_value);
		}
		else
		{
			currTag.attr("data-original_value", new_value);
		}
	};

	var	Switch_ChangeCallback = function(currTag, error_message)
	{
		var	checkbox_tag = $("#" + currTag.attr("for"));
		var	original_value = JSON.parse(checkbox_tag.attr("data-original_value"));
		var	new_value = !original_value;

		if(error_message.length)
		{
			system_calls.PopoverError(currTag, error_message);
			checkbox_tag.prop("checked", original_value);
		}
		else
		{
			checkbox_tag.prop("checked", new_value);
			checkbox_tag.attr("data-original_value", new_value);
		}

	};

	var	CheckValidity = function()
	{
		var	error_message = "";

		var	title_input			= $("input.__bt_template_line_title[data-random=\"" + random_global + "\"]");
		var	tooltip_input		= $("input.__bt_template_line_tooltip[data-random=\"" + random_global + "\"]");
		var	description_input	= $("input.__bt_template_line_description[data-random=\"" + random_global + "\"]");
		var	cash_switch			= $("#input_bt_expense_line_payment_cash_" + random_global + "");
		var	card_switch			= $("#input_bt_expense_line_payment_card_" + random_global + "");
		var	cash_label			= $("#label_bt_expense_line_payment_cash_" + random_global + "");
		var	card_label			= $("#label_bt_expense_line_payment_card_" + random_global + "");

		if(title_input.val().length === 0)
		{
			error_message = "Не указано наименование документа";
			system_calls.PopoverError(title_input, error_message);
		}
		else if (!cash_switch.prop("checked") && !card_switch.prop("checked"))
		{
			error_message = "Выберите форму оплаты";
			system_calls.PopoverError(cash_label, error_message);
			system_calls.PopoverError(card_label, error_message);
		}

		return error_message;
	};

	var	GetExpenseTemplateLineData = function()
	{
		var	title				= $("input.__bt_template_line_title[data-random=\"" + random_global + "\"]");
		var	tooltip				= $("input.__bt_template_line_tooltip[data-random=\"" + random_global + "\"]");
		var	description			= $("input.__bt_template_line_description[data-random=\"" + random_global + "\"]");
		var	dom_type			= $("select.__bt_template_line_dom_type[data-random=\"" + random_global + "\"]");
		var	is_cash				= $("#input_bt_expense_line_payment_cash_" + random_global);
		var	is_card				= $("#input_bt_expense_line_payment_card_" + random_global);
		var	is_required			= $("#input_bt_expense_line_required_" + random_global);
		var	arr					= [];

		arr["bt_expense_template_line_random_" + random_global]			= random_global;
		arr["bt_expense_template_line_title_" + random_global]			= title.val();
		arr["bt_expense_template_line_tooltip_" + random_global]		= tooltip.val();
		arr["bt_expense_template_line_description_" + random_global]	= description.val();
		arr["bt_expense_template_line_dom_type_" + random_global]		= dom_type.val();
		arr["bt_expense_template_line_is_cash_" + random_global]		= is_cash.prop("checked");
		arr["bt_expense_template_line_is_card_" + random_global]		= is_card.prop("checked");
		arr["bt_expense_template_line_is_required_" + random_global]	= is_required.prop("checked");

		return arr;
	};

	return {
		Init: Init,
		SetGlobalData: SetGlobalData,
		UpdateID: UpdateID,
		GetTitle: GetTitle,
		GetDOM: GetDOM,
		CheckValidity: CheckValidity,
		GetRandom: GetRandom,
		Disable_RequiredOption: Disable_RequiredOption,
		Disable_CardPaymentOption: Disable_CardPaymentOption,
		Disable_CashPaymentOption: Disable_CashPaymentOption,
		Set_PaymentCash_Value: Set_PaymentCash_Value,
		Set_PaymentCard_Value: Set_PaymentCard_Value,
		Set_RequiredDoc_Value: Set_RequiredDoc_Value,
		Set_Removable_Flag: Set_Removable_Flag,
		Set_Title_ChangeCallback: Set_Title_ChangeCallback,
		Set_Description_ChangeCallback: Set_Description_ChangeCallback,
		Set_Tooltip_ChangeCallback: Set_Tooltip_ChangeCallback,
		Set_DocType_ChangeCallback: Set_DocType_ChangeCallback,
		Set_PaymentCash_ChangeCallback: Set_PaymentCash_ChangeCallback,
		Set_PaymentCard_ChangeCallback: Set_PaymentCard_ChangeCallback,
		Set_RequiredDoc_ChangeCallback: Set_RequiredDoc_ChangeCallback,
		Set_Remove_ClickCallback: Set_Remove_ClickCallback,
		GetExpenseTemplateLineData:GetExpenseTemplateLineData,
	};
};
