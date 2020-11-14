var	subcontractor_company_edit = subcontractor_company_edit || {};

var	subcontractor_company_edit = (function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	rand_global;
	var	company_edit_obj_global = new company_info_edit();

	var	Init = function()
	{
		rand_global = Math.round(Math.random() * 876543234567);

		system_calls.SetCurrentScript("subcontractor.cgi");
		company_edit_obj_global.Init(system_calls.UpdateInputFieldOnServer);
		GetCompanyInfoFromServer();
	};

	var	GetCompanyInfoFromServer = function()
	{
		var		curr_tag = $("#company_container");


		$.getJSON(
			"/cgi-bin/subcontractor.cgi",
			{
				action: "AJAX_getCompanyInfo",
				include_countries: "true",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					if((typeof(data) != "undefined") && (typeof(data.companies) != "undefined") && data.companies.length && (typeof(data.countries) != "undefined") && data.countries.length)
					{
						company_edit_obj_global.SetCountriesObj(data.countries);
						RenderCompanyPage(data.companies[0]);
					}
					else
					{
						system_calls.PopoverError("company_container", "Ошибка в объекте companies");
					}
				}
				else
				{
					console.error("AJAX_getCompanyInfo.done(): ERROR: " + data.description);
					system_calls.PopoverError(curr_tag.attr("id"), "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				setTimeout(function() {
					system_calls.PopoverError(curr_tag.attr("id"), "Ошибка ответа сервера");
				}, 500);
			});
	};

	var	RenderCompanyPage = function(company)
	{
		$("#company_container").empty().append(company_edit_obj_global.GetDOM(company));
	};

	var	Switcher_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		input_tag = $("#" + $(this).attr("for"));
		var		curr_value = !input_tag.prop("checked");

		$.getJSON(
			"/cgi-bin/subcontractor.cgi",
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

					console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
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


	return {
		Init: Init,
	};

})();
