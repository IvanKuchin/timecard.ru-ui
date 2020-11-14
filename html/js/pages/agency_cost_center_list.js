var	agency_cost_center_list = agency_cost_center_list || {};

var	agency_cost_center_list = (function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	rand_global;

	var	cost_centers_global = [];
	var new_cost_center_global = {};
	var	countries_obj_global;

	var	Init = function()
	{
		rand_global = Math.round(Math.random() * 876543234567);

		GetAgencyInfoFromServer();

		// system_calls.SetCurrentScript("agency.cgi");

		$("#AreYouSureRemoveCostCenter .submit").on("click", ConfirmCostCenterRemove_ClickHandler);

	};

	var	GetAgencyInfoFromServer = function()
	{
		var		curr_tag = $("#cost_center_container");


		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getAgencyInfo",
				include_bt: "false",
				include_tasks: "true",
				include_countries: "true",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					if((typeof(data) != "undefined") && (typeof(data.agencies) != "undefined") && data.agencies.length && (typeof(data.countries) != "undefined") && data.countries.length)
					{
						countries_obj_global = data.countries;
						cost_centers_global = agency_cost_center_arr.CraftCostCenterObjects(data.agencies[0]);

						RenderCostCenterList(data.agencies[0]);

						// --- new Cost Center requires country_list object for mailing_address and legal_address
						// --- countries_obj will be re-used from data_global_object
						InitNewCostCenter();
					}
					else
					{
						system_calls.PopoverError("cost_center_container", "Ошибка в объекте agencies");
					}
				}
				else
				{
					console.error("AJAX_getAgencyInfo.done(): ERROR: " + data.description);
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

	var	GetEditableCostCenterList_DOM = function()
	{
		var		result = $();

		var		title_row			= $("<div>").addClass("row form-group");
		var		title_open_col		= $("<div>").addClass("col-xs-2 col-md-1").append("");
		var		title_expense_col	= $("<div>").addClass("col-xs-4 col-md-2").append("Центр затрат");
		var		title_comment_col	= $("<div>").addClass("col-xs-6 col-md-8").append("");
		var		title_remove_col	= $("<div>").addClass("hidden-xs hidden-sm col-md-1").append("");

		var		i = 0;

		title_row
			.append(title_open_col)
			.append(title_expense_col)
			.append(title_comment_col)
			.append(title_remove_col);

		result = result.add(title_row);

		cost_centers_global.forEach(function(cost_center)
		{
			cost_center.SetCountriesObj(countries_obj_global);
			result = result.add(cost_center.GetDOM());
		});

		return result;

	};

	var	RenderCostCenterList = function(agency)
	{
		$("#cost_center_list").empty().append(GetEditableCostCenterList_DOM());
	};

	var	ConfirmCostCenterRemove_ClickHandler = function()
	{
		var		curr_tag = $(this);
		var		id = curr_tag.attr("data-id");

		curr_tag.attr("disabled", "");

		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_deleteCostCenter",
				id: curr_tag.attr("data-id"),
				value: "fake",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveCostCenter").modal("hide");
					setTimeout(function() { $("#collapsible_cost_center_" + id).collapse("hide"); } , 100);
					setTimeout(function() { $(".cost_center_" + id).hide(300); } , 300);
					setTimeout(function() { $(".cost_center_" + id).remove(); } , 1000);
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

	var	InitNewCostCenter = function()
	{
		new_cost_center_global = new agency_cost_center_obj();
		new_cost_center_global.Init();
		new_cost_center_global.SetGlobalData();
		new_cost_center_global.DefaultExpand();
		new_cost_center_global.RemoveButton("hidden");
		new_cost_center_global.ExpandButton("hidden");
		new_cost_center_global.EnableTINButton("true");
		new_cost_center_global.ResetFormButton("", InitNewCostCenter);
		new_cost_center_global.SubmitButton("");
		new_cost_center_global.SetSubmitCallback(NewCostCenter_Callback);
		new_cost_center_global.SetCountriesObj(countries_obj_global);

		$("#new_cost_center_template").empty().append(new_cost_center_global.GetDOM());
	};

	var	NewCostCenter_Callback = function()
	{
		$("#collapsible_cost_center_new_item").collapse("hide");
		InitNewCostCenter();
		GetAgencyInfoFromServer();
	};

	return {
		Init: Init,
	};

})();
