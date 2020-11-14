var	agency_bt_approvals = agency_bt_approvals || {};

var	agency_bt_approvals = (function()
{
	"use strict";

	var	data_global;

	var	Init = function()
	{
		UpdateBTList();

		$(".filter").on("click", Filter_ClickHandler);
	};

	var	UpdateBTList = function()
	{
		var		currTag = $("#bt_list_title");


		$.getJSON(
			"/cgi-bin/agency.cgi",
			{
				action: "AJAX_getApprovalsList",
				object: "bt",
				filter: "submit"
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					data_global = data;

					RenderApprovalsList("my_only");
				}
				else
				{
					console.error("AJAX_getApprovalsList.done(): ERROR: " + data.description);
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

	// --- filter:
	//				my_only - display only bt require your approval
	//				all		- display all pending approvals
	//
	// PS: this instance didn't merged with bt_list due to control buttons logic
	var	GetBTListDOM = function(bt_list, sow, filter)
	{
		var		result = $();

		if((typeof(bt_list) == "undefined"))
		{
			console.error("bt_list is undefined");
		}
		else
		{
			var		timeFormat = "MM/DD/YYYY HH:mm";
			var		bt_belongs_to_sow = [];
			var		sow_id = sow.id;
			var		customer_map = new Map();

			sow.tasks.forEach(function(task)
			{
				var		customer_obj = task.projects[0].customers[0];
				customer_map[customer_obj.id] = customer_obj;
			});

			bt_list.forEach(function(item)
			{
				if(item.contract_sow_id == sow_id) bt_belongs_to_sow.push(item);
			});

			bt_belongs_to_sow.sort(function(a, b)
			{
				var		arrA = a.date_start.split(/\-/);
				var		arrB = b.date_start.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});


			bt_belongs_to_sow.forEach(function(bt_item)
				{
					var		should_i_act_on_bt = system_calls.shouldIActOnObject(bt_item);
					var		good_to_show = false;

					if((filter == "my_only") && should_i_act_on_bt) good_to_show = true;
					else if(filter == "all") good_to_show = true;

					if(good_to_show)
					{
						if(bt_item.date_start.length && bt_item.date_end.length)
						{
							var		visible_row = $("<div>").addClass("row highlight_onhover");
							var		collapsible_row = $("<div>").addClass("row")
																.addClass("collapse out sow")
																.attr("id", "collapsible_bt_" + bt_item.id);
							var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
							var		timeinterval_col = $("<div>").addClass("col-xs-10 col-md-2");
							var		total_hours_col = $("<div>").addClass("hidden-xs hidden-sm col-md-9");
							var		title =  $("<span>")
												.addClass("link bt_title")
												.append(system_calls.ConvertDateSQLToHuman(bt_item.date_start) + " - " + system_calls.ConvertDateSQLToHuman(bt_item.date_end))
												.attr("id", "bt_title_" + bt_item.id)
		 										.attr("data-toggle", "collapse")
		 										.attr("data-target", "#collapsible_bt_" + bt_item.id)
		 										.attr("data-bt_id", bt_item.id)
		 										.on("click", BTCollapsible_ClickHandler);
							var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
																.append("<p></p>");
							var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
																.append("<p></p>");

							var		collapsible_content_col = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_bt_" + bt_item.id + "_content");
							var		collapsible_nested_row_buttons = $("<div>").addClass("row");
							var		collapsible_nested_col_button_approve = $("<div>").addClass("col-xs-6 col-md-2 form-group");
							var		collapsible_nested_col_button_reject  = $("<div>").addClass("col-xs-6 col-md-2 form-group");
							var		collapsible_nested_row_comment = $("<div>").addClass("row");
							var		collapsible_nested_col_comment_reject  = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-2  col-md-offset-2 form-group");
							var		collapsible_nested_row_bt = $("<div>").addClass("row");
							var		collapsible_nested_col_bt = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_bt_" + bt_item.id + "_statistics");
							var		collapsible_nested_row_info = $("<div>").addClass("row");
							var		collapsible_nested_col_info = $("<div>")
																	.addClass("col-xs-12")
																	.attr("id", "collapsible_bt_" + bt_item.id + "_info");

							var		button_control_bt_approve = $("<button>")
																	.attr("id", "button_approve_bt_" + bt_item.id)
																	.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
																	.attr("data-action", "approve")
																	.attr("data-bt_id", bt_item.id)
																	.addClass("btn btn-success form-control __control_button_" + bt_item.id)
																	.append("OK")
																	.on("click", function(e)
																		{
																			return ControlButton_ClickHandler($(this), bt_item);
																		});
							var		button_control_bt_reject = $("<button>")
																	.attr("id", "button_reject_bt_" + bt_item.id)
																	.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
																	.attr("data-action", "reject")
																	.attr("data-bt_id", bt_item.id)
																	.addClass("btn btn-danger form-control __control_button_" + bt_item.id)
																	.append("отклонить")
																	.on("click", function(e)
																		{
																			return ControlButton_ClickHandler($(this), bt_item);
																		});

							var		input_comment_reject = $("<input>")
																	.attr("id", "input_comment_reject_" + bt_item.id)
																	.addClass("form-control")
																	.attr("placeholder", "Коментарий");

							var		canvas = $("<canvas>").attr("data-id", bt_item.id);
							var		datasets_arr = [];
							var		task_names_arr = [];
							var		status_icon = $("<i>").addClass("fa");

							var		total_amount_rub = system_calls.GetSumRublesFromBT(bt_item);
							var		total_amount_days = system_calls.GetBTDurationInDays(bt_item);

							if(bt_item.status == "approved")
							{
								status_icon	.addClass("fa-check-circle color_green")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "подтверждено");
							}
							if(bt_item.status == "saved")
							{
								status_icon	.addClass("fa-floppy-o color_grey")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "сохранено");
							}
							if(bt_item.status == "submit")
							{
								status_icon	.addClass("fa-clock-o color_orange")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "ожидает подтверждения");
							}
							if(bt_item.status == "rejected")
							{
								status_icon	.addClass("fa-times color_red")
											.attr("data-toggle", "tooltip")
											.attr("data-placement", "top")
											.attr("title", "отклонено");
							}

							// --- Render approve/reject buttons to correct (active/disable) state
							if(should_i_act_on_bt)
							{
							}
							else
							{
								button_control_bt_approve.attr("disabled", "");
								button_control_bt_reject.attr("disabled", "");
							}

							// --- initial DOM. It would be changed after user click collapse.
							collapsible_content_col
								.append(collapsible_nested_row_bt.append(collapsible_nested_col_bt))
								.append(collapsible_nested_row_buttons.append(collapsible_nested_col_button_approve).append(collapsible_nested_col_button_reject))
								.append(collapsible_nested_row_comment.append(collapsible_nested_col_comment_reject))
								.append(collapsible_nested_row_info.append(collapsible_nested_col_info));

							collapsible_nested_col_button_approve.append(button_control_bt_approve);
							collapsible_nested_col_button_reject.append(button_control_bt_reject);
							collapsible_nested_col_comment_reject.append(input_comment_reject);

							collapsible_nested_col_info
								.append(system_calls.GetTextedBT_DOM(bt_item))
								.append(system_calls.GetApprovedDate_DOM(bt_item))
								.append(system_calls.GetPayedDate_DOM(bt_item));

							visible_row
								.append(status_div.append(status_icon))
								.append(timeinterval_col.append(title))
								.append(total_hours_col.append(customer_map[bt_item.customer_id].title + ", " + bt_item.place + " (" + bt_item.purpose + ") " + total_amount_rub + " руб. / " + total_amount_days + " " + system_calls.GetDaysSpelling(total_amount_days)));

							collapsible_row
								.append(top_shadow_div)
								.append(collapsible_content_col)
								.append(bottom_shadow_div);

							result = result.add(visible_row);
							result = result.add(collapsible_row);

							status_icon.tooltip({ animation: "animated bounceIn"});

						}
						else
						{
							console.error("bt(id: " + bt_item.id + ") empty start_date or end_date");
						}
					}
				});
		}

		return result;
	};

	var	ControlButton_ClickHandler = function(currTag, bt)
	{
		var		result = true;
		var		action = currTag.data("action");
		var		link = "/cgi-bin/agency.cgi?action=AJAX_" + action + "BT&rand=" + (Math.random() * 4876234923498);
		var		date_arr = bt.date_start.split("-");
		var		year = parseInt(date_arr[0]);
		var		month = parseInt(date_arr[1]);
		var		date = parseInt(date_arr[2]);
		var		bt_id = parseInt(bt.id);
		var		comment = $("#input_comment_reject_" + bt_id).val();

		if(year && month && date && bt_id)
		{

			if((action == "reject") && ($("#input_comment_reject_" + bt_id).val() === ""))
			{
				system_calls.PopoverError(currTag, "Необходимо обосновать отказ");
			}
			else
			{
				currTag.button("loading");

				$.getJSON(
					link,
					{
						bt_id: bt_id,
						year: year,
						month: month,
						date: date,
						comment: comment
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							data_global = data;
							$("#collapsible_bt_" + bt_id).collapse("hide");

							setTimeout(function(e)
							{
								RenderApprovalsList("my_only");
							}, 300);
						}
						else
						{
							console.error("ERROR: " + data.description);
							system_calls.PopoverError(currTag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						console.error("ERROR parsing server response to JSON-object");
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					})
					.always(function(e)
					{
						setTimeout(function() {
							currTag.button("reset");
						}, 500);
					});
			}
		}
		else
		{
			console.error("ERROR: bt date or id is empty");
			system_calls.PopoverError(currTag, "Ошибка: невозможно определить данные таймкарты");
		}

		return result;
	};

	// --- filter:
	//				my_only (default)	- only my approvals displayed
	//				all					- all approvals
	var	RenderApprovalsList = function(filter)
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined") && (typeof(data_global.bt) != "undefined"))
		{
			var		container = $();

			for(var i = 0; i < data_global.sow.length; ++i)
			{
				// var		sow_row = $("<div>").addClass("row margin_top_10");
				// var		sow_col = $("<div>").addClass("col-xs-12 col-md-11 col-md-offset-1").append(data_global.sow[i].number + " " + data_global.sow[i].sign_date);
				var		bt_list = GetBTListDOM(data_global.bt, data_global.sow[i], filter);

				if(bt_list.length)
				{
					container = container
									// .add(sow_row.append(sow_col)
									.add(common_timecard.GetSoWTitleRow(data_global.sow[i], false, true))
									.add(bt_list);
				}
			}

			$("#bt_list").empty().append(container);
		}
		else
		{
			console.error("ERROR: sow list or bt list is empty");
		}
	};

	var	BTCollapsible_ClickHandler = function(e)
	{
		var		currTag = $(this);

		system_calls.BTCollapsible_ClickHandler(currTag);
	};

	var	Filter_ClickHandler = function(e)
	{
		var		currTag = $(this);

		if($("button.filter.btn-primary")[0] != currTag[0])
		{
			$("button.filter.btn-primary").toggleClass("btn-primary", "btn-default");
			currTag.toggleClass("btn-primary", "btn-default");

			RenderApprovalsList(currTag.data("filter"));
		}
	};

	return {
		Init: Init
	};

})();
