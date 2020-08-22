var		autoapprove_settings = autoapprove_settings || {};

autoapprove_settings = (function()
{
	'use strict';

	var		data_global;

	var		JSON_themes = [];
	var 	JSON_jobTitleID = [];
	var 	JSON_certificationVendors = [];
	var 	JSON_certificationTracks = [];
	var 	JSON_CompanyNameID = [];
	var		JSON_AvatarList;  // --- must be global to get access from ShowActiveAvatar
	var		JSON_geoCountry = [];
	var		JSON_geoRegion = [];
	var		JSON_geoLocality = [];
	var		JSON_university = [];
	var		JSON_school = [];
	var		JSON_language = [];
	var		JSON_skill = [];
	var		JSON_book = [];
	var		JSON_dataForProfile = {};
	var		userProfile;
	var		addCarrierCompany = {};
	var		addCertification = {};
	var		addCourse = {};
	var		addSchool = {};
	var		addUniversity = {};
	var		addLanguage = {};
	var		addSkill = {};
	var		addBook = {};
	var		addRecommendation = {};
	var		AutocompleteList = [];

	var	Init = function()
	{
		$.getJSON('/cgi-bin/approver.cgi?action=AJAX_getUserProfile', {param1: "_"})
			.done(function(data) {
				if(data.status === "success")
				{
					if(data.users.length)
					{
						data_global = data;
						JSON_themes = data.themes;

						RenderAutoApproveContent();
					}
				}
				else
				{
					console.debug("Init: ERROR: " + data.description);
				}
			})
			.fail(function() {
				console.error("Init:AJAX_getUserProfile: error parse JSON response");
			});


		ScrollToElementID("#" + system_calls.GetParamFromURL("scrollto"));
	};

	var	ScrollToElementID = function(elementID)
	{
		if((elementID.length > 1) && $(elementID).length) // --- elementID is "#XXXX"
			system_calls.ScrollWindowToElementID(elementID);
	};

	var	RenderAutoApproveContent = function()
	{
		var		result_timecard = $();
		var		result_bt = $();

		data_global.timecard_approvers.forEach(function(item)
			{
				var		psow_id = item.psow[0].id;
				var		div_row = $("<div>").addClass("row");
				var		div_col_psow = $("<div>").addClass("col-xs-8 col-md-3");
				var		div_col_autoapprove = $("<div>").addClass("col-xs-4 col-md-3");

				var		div_switcher = $("<div>").addClass("form-switcher");
				var		input_switcher = $("<input>")
												.attr("id",  "timecard_switcher_input_psow_" + psow_id)
												.attr("type", "checkbox");
				var		label_switcher = $("<label>")
												.addClass("switcher")
												.attr("for", "timecard_switcher_input_psow_" + psow_id)
												.attr("id",  "timecard_switcher_label_psow_" + psow_id)
												.attr("data-type",  "timecard")
												.attr("data-action", "AJAX_triggerAutoapprove")
												.on("click", AutoapproveSwitcher_ClickHandler)
												.attr("data-psow_id", psow_id);

				if(item.auto_approve == "Y")
					input_switcher.attr("checked",  "");

				div_switcher
					.append(input_switcher)
					.append(label_switcher);

				div_col_psow
					.append(item.psow[0].number + " от " + item.psow[0].sign_date);
				div_col_autoapprove
					.append(div_switcher);

				div_row
					.append(div_col_psow)
					.append(div_col_autoapprove);

				result_timecard = result_timecard.add(div_row);
			});

		data_global.bt_approvers.forEach(function(item)
			{
				var		psow_id = item.psow[0].id;
				var		div_row = $("<div>").addClass("row");
				var		div_col_psow = $("<div>").addClass("col-xs-8 col-md-3");
				var		div_col_autoapprove = $("<div>").addClass("col-xs-4 col-md-3");

				var		div_switcher = $("<div>").addClass("form-switcher");
				var		input_switcher = $("<input>")
												.attr("id",  "bt_switcher_input_psow_" + psow_id)
												.attr("type", "checkbox");
				var		label_switcher = $("<label>")
												.addClass("switcher")
												.attr("for", "bt_switcher_input_psow_" + psow_id)
												.attr("id",  "bt_switcher_label_psow_" + psow_id)
												.attr("data-type",  "bt")
												.attr("data-action", "AJAX_triggerAutoapprove")
												.on("click", AutoapproveSwitcher_ClickHandler)
												.attr("data-psow_id", psow_id);

				if(item.auto_approve == "Y")
					input_switcher.attr("checked",  "");

				div_switcher
					.append(input_switcher)
					.append(label_switcher);

				div_col_psow
					.append(item.psow[0].number + " от " + item.psow[0].sign_date);
				div_col_autoapprove
					.append(div_switcher);

				div_row
					.append(div_col_psow)
					.append(div_col_autoapprove);

				result_bt = result_bt.add(div_row);
			});

		$("#auto_approve_timecard").empty().append(result_timecard);
		$("#auto_approve_bt").empty().append(result_bt);
	};

	var AutoapproveSwitcher_ClickHandler = function(e)
	{
		var  	currTag = $(this);
		var		psow_id = currTag.data("psow_id");
		var		type = currTag.data("type");
		var		inputTag = $("#" + type + "_switcher_input_psow_" + psow_id);
		var		new_state = "Y";

		if(inputTag.prop("checked")) new_state = "N";

		inputTag.attr("disabled", "");

		$.getJSON("/cgi-bin/approver.cgi?action=AJAX_setAutoapprove&type=" + type + "&psow_id=" + psow_id + "&new_state=" + new_state + "&rand=" + Math.round(Math.random() * 100000000))
		.done(function(data)
		{
			if(data.result == "success")
			{
				// --- update GUI
				if(new_state == "Y") inputTag.attr("checked", "");
				else inputTag.removeAttr("checked");

				// --- update data_global with new state
				data_global.timecard_approvers.forEach(function(approver, i)
				{
					if(approver.psow[0].id == psow_id) approver.auto_approve = new_state;
				});
			}
			else
			{
				console.debug("ERROR: " + data.description);
				system_calls.PopoverError(currTag, "Ошибка: " + data.description);
			}
		})
		.fail(function(data)
		{
			console.debug("ERROR: fail to parse JSON-server response");
			system_calls.PopoverError(currTag, "Ошибка JSON ответа сервера");
		})
		.always(function(e)
		{
			inputTag.removeAttr("disabled");
		});


		return true;
	};

	return {
		Init: Init,
	};

})();
