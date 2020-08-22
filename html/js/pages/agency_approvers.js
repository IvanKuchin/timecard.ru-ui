var	agency_approver_obj = function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	DB_FORMAT_GLOBAL = "YYYY-MM-DD";
	var	DEFAULT_DATE = "2001-01-01";
	var random_global;
	var	data_global;
	var	rand_global;
	var	details_area_state_global = "in";
	var base_row_state_global = "hidden";
	var expand_button_state_global = "hidden";
	var remove_button_state_global = "hidden";
	var	submit_button_global = "hidden";

	var	submit_callback_global;

	var	Init = function()
	{
		do
		{
			random_global = Math.floor(Math.random() * 4567890987654321);
		} while($("div.__approver[data-random=\"" + random_global + "\"]").length);
	};

	var	SetGlobalData = function(data_init)
	{
		data_global = data_init;
	};

	var	SetType = function(item_type)
	{
		data_global.type = item_type;
	};

	var	GetID = function()
	{
		return data_global.id;
	};

	var	GetContractPSoWID = function()
	{
		return data_global.contract_psow_id;
	};

	var	GetDOM = function()
	{
		var		result = $();

		result = result.add(row);

		return	result;
	};


	return {
		Init: Init,
		GetID: GetID,
		GetContractPSoWID: GetContractPSoWID,
		SetGlobalData: SetGlobalData,
		SetType: SetType,
		GetDOM: GetDOM,
	};
};


var	agency_approvers_obj = (function()
{
	'use strict';

	var	sow_global;
	var	root_target_global;
	var	bt_approvers = [];
	var	timecard_approvers = [];

	var	Init = function(sow, root_target)
	{
		sow_global = sow;
		root_target_global = root_target;

		$("#AreYouSureRemoveTaskApprover .submit").on("click", RemoveTaskApprover_ClickHandler);
		$("#AreYouSureRemoveBTExpenseApprover .submit").on("click", RemoveBTExpenseApprover_ClickHandler);
	};

	var	Approver_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag			= $(this);
		var		curr_action			= curr_tag.attr("data-action");
		var		cost_center_id		= GetActiveTab().attr("data-id");
		var		psow_id				= Get_PSoWID_By_CostCenterID(cost_center_id, sow_global);


		curr_tag.button("loading");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: curr_action,
				new_value: id,
				psow_id: psow_id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					setTimeout(function() {
						curr_tag.val("");
					}, 250);

					if(curr_action == "AJAX_addBTExpenseApproverToPSoW")
					{
						sow_global.bt_approvers = data.bt_approvers;
						RenderActiveTab();
					}
					if(curr_action == "AJAX_addTimecardApproverToPSoW")
					{
						sow_global.timecard_approvers = data.timecard_approvers;
						RenderActiveTab();
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
			.always(function(e)
			{
				curr_tag.button("reset");
			});

	};

	var	Get_PSoWID_By_CostCenterID = function(cost_center_id, sow)
	{
		var		result = "";

		for (var i = sow.psow.length - 1; i >= 0; i--) {
			if(sow.psow[i].cost_center_id == cost_center_id)
			{
				result = sow.psow[i].id;
				break;
			}
		}

		return result;
	};

	var	RemoveTaskApprover_AreYouSure_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AreYouSureRemoveTaskApprover .submit").attr("data-id", currTag.data("id"));
		$("#AreYouSureRemoveTaskApprover").modal("show");
	};

	var	RemoveBTExpenseApprover_AreYouSure_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AreYouSureRemoveBTExpenseApprover .submit").attr("data-id", currTag.data("id"));
		$("#AreYouSureRemoveBTExpenseApprover").modal("show");
	};

	var	RemoveTaskApprover_ClickHandler = function(e)
	{
		var		currTag = $(this);
		var		approver_id = currTag.attr("data-id");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteTimecardApproverFromPSoW",
				id: currTag.attr("data-id"),
				value: currTag.val(),
				sow_id: sow_global.id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveTaskApprover").modal("hide");
					setTimeout(function() {
						$(".task_approver_" + approver_id).hide(300);
					}, 500);
					setTimeout(function() {
						$(".task_approver_" + approver_id).remove();

						sow_global.timecard_approvers = data.timecard_approvers;
						RenderActiveTab();
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

	var	RemoveBTExpenseApprover_ClickHandler = function(e)
	{
		var		currTag				= $(this);
		var		approver_id			= currTag.attr("data-id");

		currTag.attr("disabled", "");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: "AJAX_deleteBTExpenseApproverFromPSoW",
				id: currTag.attr("data-id"),
				value: currTag.val(),
				sow_id: sow_global.id,
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveBTExpenseApprover").modal("hide");
					setTimeout(function() {
						$(".bt_expense_approver_" + approver_id).hide(300);
					}, 500);
					setTimeout(function() {
						$(".bt_expense_approver_" + approver_id).remove();

						sow_global.bt_approvers = data.bt_approvers;
						RenderActiveTab();
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

	var	GetDraggableApprovers_DOM = function(psow_id, approver_type)
	{
		var		result = $();

		var		approver_col	= $("<div>")	.addClass("col-xs-12 col-md-4 form-group");
		var		approver_ul		= $("<ul>")
												.css("list-style-type", "none")
												.css("padding-left", "0px")
												.on("sortupdate", Approver_SortupdateHandler)
												.sortable({placeholder: "ui-state-highlight"})
												.disableSelection();

		var		approver_list_src = [];
		var		approver_list_dst = [];
		var		remove_click_handler;
		var		remove_class;

		if(approver_type == "timecard")
		{ 
			approver_list_src = sow_global.timecard_approvers;
			remove_click_handler = RemoveTaskApprover_AreYouSure_ClickHandler;
			remove_class = "task_approver_";
			approver_ul.attr("data-action", "AJAX_updateTimecardApproverOrder");
		}
		else if(approver_type == "bt")
		{
			approver_list_src = sow_global.bt_approvers;
			remove_click_handler = RemoveBTExpenseApprover_AreYouSure_ClickHandler;
			remove_class = "bt_expense_approver_";
			approver_ul.attr("data-action", "AJAX_updateBTApproverOrder");
		}
		else 
		{
			console.error("unknown approver_type(" + approver_type + ")");
		}

		for(var x in approver_list_src)
		{
			if(approver_list_src[x].contract_psow_id == psow_id)
			{
				approver_list_dst.push(approver_list_src[x]);
			}
		}

		approver_list_dst.sort(function(a, b)
			{
				var	cmp_result = 0;

				if(a.approver_order == b.approver_order) { cmp_result = 0; }
				if(a.approver_order >  b.approver_order) { cmp_result = 1; }
				if(a.approver_order <  b.approver_order) { cmp_result = -1; }

				return cmp_result;
			});

		approver_list_dst.forEach(function(approver)
		{
			var	container			= $("<li>") 	.addClass("ui-state-default")
													.addClass(remove_class + approver.id);
			var	remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_top_2px padding_right_2px  cursor_pointer float_right");
			var	user_profile_link	= $("<a>")		.attr("href", "/userprofile/" + approver.users[0].id + "?rand=" + Math.random() * 34567890);
			var	href_text			= (parseInt(approver.approver_order) ? "&nbsp;(" + approver.approver_order + ") " : "") +
										approver.users[0].name + " " + approver.users[0].nameLast;

			container
						.attr("data-id", approver.id);

			remove_button
						.on("click", remove_click_handler)
						.attr("data-id", approver.id);

			user_profile_link
						.append(href_text);

			container
						.append(user_profile_link)
						.append("&nbsp;")
						.append(remove_button);

			approver_ul	
						.append(container)
						.append($("<span>").append("&nbsp;"));
		});

		result = result.add(approver_col.append(approver_ul));

		return result;
	};


	var Approver_SortupdateHandler = function(event, ui)
	{
		var	ul_tag			= $(this).closest("ul");
		var	id_arr			= [];
		var	action			= ul_tag.attr("data-action");
		var	cost_center_id	= GetActiveTab().attr("data-id");
		var	psow_id			= Get_PSoWID_By_CostCenterID(cost_center_id, sow_global);

		if(action.length)
		{
			ul_tag.find("li").each(function()
			{
				id_arr.push($(this).attr("data-id"));
			});

			console.debug("bt approvers sortupdate (" + id_arr.join(' ') + ")");

			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: action,
					psow_id: psow_id,
					value: id_arr.join(','),
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						if(action == "AJAX_updateBTApproverOrder")
						{
							sow_global.bt_approvers = data.bt_approvers;
							Render(cost_center_id);
						}
						if(action == "AJAX_updateTimecardApproverOrder")
						{
							sow_global.timecard_approvers = data.timecard_approvers;
							Render(cost_center_id);
						}
					}
					else
					{
						system_calls.PopoverError(ul_tag, "Ошибка: " + data.description);
/*						
						if(action == "AJAX_updateBTApproverOrder")
						{
							Render(cost_center_id);
						}
						if(action == "AJAX_updateTimecardApproverOrder")
						{
							Render(cost_center_id);
						}
*/
					}
				})
				.fail(function(data)
				{
					system_calls.PopoverError(ul_tag, "Ошибка ответа сервера");
/*
					if(action == "AJAX_updateBTApproverOrder")
					{
						Render(cost_center_id);
					}
					if(action == "AJAX_updateTimecardApproverOrder")
					{
						Render(cost_center_id);
					}
*/
				})
				.always(function(e)
				{
				});
		}
		else
		{
			console.error("data-action attribute have to be assigned to <ul> tag");
		}
	};

	var	GetDOM = function(cost_center_id)
	{
		var		result 				= $();

		var		psow_id				= Get_PSoWID_By_CostCenterID(cost_center_id, sow_global);

		if(psow_id.length)
		{
			var		tc_root_div			= $("<div>")	.addClass("timecard_approvers");
			var		tc_input_row		= $("<div>")	.addClass("row");
			var		tc_input_col		= $("<div>")	.addClass("col-xs-12 form-group");
			var		tc_input_tag		= $("<input>")	.addClass("form-control transparent")
														.attr("placeholder", "ФИО утвердителя таймкарт")
														.attr("data-action", "AJAX_addTimecardApproverToPSoW")
														.autocomplete({
															source: "/cgi-bin/agency.cgi?action=AJAX_getApproversAutocompleteList&psow_id=" + psow_id,
															select: Approver_SelectHandler,
														});
			var		tc_approvers_row	= $("<div>")	.addClass("row");
			var		tc_approvers_col	= $("<div>")	.addClass("col-xs-12 form-group");

			var		bt_root_div			= $("<div>")	.addClass("bt_approvers");
			var		bt_input_row		= $("<div>")	.addClass("row");
			var		bt_input_col		= $("<div>")	.addClass("col-xs-12 form-group");
			var		bt_input_tag		= $("<input>")	.addClass("form-control transparent")
														.attr("placeholder", "ФИО утвердителя командировочных расходов")
														.attr("data-action", "AJAX_addBTExpenseApproverToPSoW")
														.autocomplete({
															source: "/cgi-bin/agency.cgi?action=AJAX_getApproversAutocompleteList&psow_id=" + psow_id,
															select: Approver_SelectHandler,
														});
			var		bt_approvers_row	= $("<div>")	.addClass("row");
			var		bt_approvers_col	= $("<div>")	.addClass("col-xs-12 form-group");


			tc_root_div
					.append(tc_input_row
										.append(tc_input_col.append(tc_input_tag).append($("<label>")))
										.append(GetDraggableApprovers_DOM(psow_id, "timecard"))
							)
					.append(tc_approvers_row.append(tc_approvers_col));
			bt_root_div
					.append(bt_input_row
										.append(bt_input_col.append(bt_input_tag).append($("<label>")))
										.append(GetDraggableApprovers_DOM(psow_id, "bt"))
							)
					.append(bt_approvers_row.append(bt_approvers_col));

			result = result
						.add(tc_root_div)
						.add(bt_root_div);
		}
		else
		{
			console.error("psow_id not found by cost_center_id(" + cost_center_id + ")");
		}


		return result;
	};

	var	Render = function(cost_center_id)
	{
		var	cost_center_id_to_render = [];
		var	x;

		if(typeof(cost_center_id) == "undefined")
		{
			for(x in sow_global.cost_centers)
			{
				cost_center_id_to_render.push(sow_global.cost_centers[x].id);
			}
		}
		else
		{
			cost_center_id_to_render.push(cost_center_id);
		}

		cost_center_id_to_render.forEach(function(cc_id)
		{
			var	curr_tag = $(root_target_global).find(".tab-content .tab-pane[data-id=\"" + cc_id + "\"]");

			curr_tag.empty().append(GetDOM(curr_tag.attr("data-id")));
		});
	};

	var	GetActiveTab = function()
	{
		return $(root_target_global + " .tab-content .tab-pane:visible");
	};

	var	RenderActiveTab = function()
	{
		return Render(GetActiveTab().attr("data-id"));
	};

	var ClickTab = function(obj)
	{
		if(typeof(obj) == "undefined")
		{
			console.error("obj must be jQuery tab object");
		}
		else
		{
			obj.find("a").click();
		}
	};

	var ClickFirstTab = function()
	{
		var tabs = $(root_target_global + " li.nav-tabs");

		if(tabs.length)
		{
			ClickTab(tabs.eq(0));
		}
	};

	return {
		Init: Init,
		Render: Render,
		ClickFirstTab: ClickFirstTab,
	};
})();
