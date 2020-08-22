var	bank_edit = function(suffix, callback_func)
{
	'use strict';

	var	callback_global = (typeof(callback_func) == "function" ? callback_func : undefined);
	var	suffix_global = suffix;
	var	bank_global;

	var	Init = function()
	{
	};

	var	Render = function(bank, dom_model)
	{
		dom_model = dom_model || $("body");

		if(bank)
		{
			bank_global = bank;

			dom_model.find(("#bank_bik_"		+ suffix_global))
													.val(bank.bik)
													.attr("data-db_value", bank.bik)
													.attr("data-id", bank.id);
			dom_model.find(("#bank_account_"	+ suffix_global))
													.val(bank.account)
													.attr("data-db_value", bank.account);
			dom_model.find(("#bank_name_"		+ suffix_global))
													.val(system_calls.ConvertHTMLToText(bank.title))
													.attr("data-db_value", system_calls.ConvertHTMLToText(bank.title));
		}
		else
		{
			$("#bank_name_" + suffix_global).val("");
			$("#bank_account_" + suffix_global).val("");
		}
		BlockNameAndAccountFields(dom_model);
	};

	var	RollbackToPrevValue = function()
	{
		var	curr_tag = $("body").find(("#bank_bik_" + suffix_global));

		curr_tag.val(curr_tag.attr("data-db_value"));
	};

	var	GetDOM = function(bank)
	{
		var		result = $();

		var		row_bank			= $("<div>")	.addClass("row form-group");
		var		col_bank_title		= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_bank_bik		= $("<div>")	.addClass("col-xs-8 col-md-2");
		var		col_bank_name		= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-0 col-md-5");
		var		col_bank_account	= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-0 col-md-3");
		var		input_bik			= $("<input>")	.addClass("form-control transparent");
		var		input_name			= $("<input>")	.addClass("form-control transparent");
		var		input_account		= $("<input>")	.addClass("form-control transparent");

		var		info_obj1					= new InfoObj();
		var		bank_obj					= info_obj1.GetDOM("BANK", "fake_param");
											  info_obj1.SetInfoDOM(system_calls.GetBankInfo_DOM(bank));

/*
		var		row_bank_info		= $("<div>")	.addClass("row form-group");
		var		col_bank_info		= $("<div>")	.addClass("col-xs-12");
		var		div_bank_info		= $("<div>")	.addClass("alert alert-info")	.attr("role", "alert");
		var		bank_info_button	= $("<i>")		.addClass("fa fa-question-circle cursor_pointer")	.attr("aria-hidden", "true");
*/
		bank_global = bank;

		input_bik		.attr("id", "bank_bik_" + suffix_global)	.attr("placeholder", "БИК")
																	.attr("data-action", "AJAX_updateCompanyBankID");
		input_name		.attr("id", "bank_name_" + suffix_global)	.attr("placeholder", "Название");
		input_account	.attr("id", "bank_account_" + suffix_global).attr("placeholder", "Корр. счет");
/*
		row_bank_info	.attr("id", "bank_info_row_" + suffix_global);
		div_bank_info	.attr("id", "bank_info_col_" + suffix_global);
		bank_info_button.attr("id", "bank_info_button_" + suffix_global);

		row_bank_info	.hide();
*/

		input_bik		.on("change", BIK_ChangeHandler);
		input_name		.on("change", SubmitNewBIK);	
		input_account	.on("change", SubmitNewBIK);	
/*	
		bank_info_button.on("click", BankInfo_ClickHandler);

		row_bank_info
			.append(col_bank_info	.append(div_bank_info));
*/
		row_bank
			// .append(col_bank_title	.append("Банк: ")		.append(bank_info_button))
			.append(col_bank_title	.append("Банк: ")		.append(bank_obj.button))
			.append(col_bank_bik	.append(input_bik)		.append($("<label>")))
			.append(col_bank_name	.append(input_name)		.append($("<label>")))
			.append(col_bank_account.append(input_account)	.append($("<label>")));

		result = result	.add(bank_obj.info)
						.add(row_bank);

		Render(bank, result);

		return result;
	};

	var BlockNameAndAccountFields = function(dom_model)
	{
		dom_model = dom_model || $("body");

		if(
			dom_model.find(("#bank_bik_" + suffix_global)).val().length && 
			dom_model.find(("#bank_account_" + suffix_global)).val().length && 
			dom_model.find(("#bank_name_" + suffix_global)).val().length
		)
		{
			dom_model.find(("#bank_name_" + suffix_global)).attr("disabled", "");
			dom_model.find(("#bank_account_" + suffix_global)).attr("disabled", "");
		}
		else
		{
			dom_model.find(("#bank_name_" + suffix_global)).removeAttr("disabled");
			dom_model.find(("#bank_account_" + suffix_global)).removeAttr("disabled");
		}
	};

	var	BIK_ChangeHandler = function(e)
	{
		var		curr_tag = $(this);
		var		curr_bik = curr_tag.val();
		var		update_required = true;

		// --- check BIK validity
		if(curr_bik.substr(0, 2) == "04")
		{
			if(curr_bik.length == 9)
			{

			}
			else
			{
				update_required = false;
				curr_tag.val(curr_tag.attr("data-db_value"));
				system_calls.PopoverError(curr_tag, "Введен некорректный БИК");
			}
		}

		if(update_required)
		{
			MakeNameAndAccountAssumption();
		}
	};

	var	SubmitNewBIK = function()
	{
		var	name	= $("#bank_name_" + suffix_global).val();
		var	account = $("#bank_account_" + suffix_global).val();
		var	bik 	= $("#bank_bik_" + suffix_global).val();

		if(name.length && account.length && bik.length)
		{
			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_submitNewBank",
					name: name,
					account: account,
					bik: bik,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						Render(data.banks[0]);

						if(typeof(callback_global) == "function") callback_global($("#bank_bik_" + suffix_global));
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				});
		}
	};

	var	MakeNameAndAccountAssumption = function()
	{
		var	bik 	= $("#bank_bik_" + suffix_global).val();
		var	curr_tag = "bank_bik_" + suffix_global;

		// if(bik.length)
		{
			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getBankInfoByBIK",
					bik: bik,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						Render(data.banks[0]);

						if(typeof(callback_global) == "function") callback_global($("#bank_bik_" + suffix_global));
					}
					else
					{
						RollbackToPrevValue();

						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					RollbackToPrevValue();

					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				});
		}
	};
/*
	var	BankInfo_ClickHandler = function()
	{
		$("#bank_info_col_" + suffix_global).empty().append(system_calls.GetBankInfo_DOM(bank_global));
		$("#bank_info_row_" + suffix_global).show(200);
		setTimeout(function() { $("#bank_info_row_" + suffix_global).hide(200); }, 5000);
	};
*/
	return {
		Init: Init,
		GetDOM: GetDOM,
	};

};
