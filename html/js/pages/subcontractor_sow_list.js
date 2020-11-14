
var	subcontractor_sow_list = subcontractor_sow_list || {};

var	subcontractor_sow_list = (function()
{
	"use strict";

	var	data_global;

	var	Init = function()
	{
		UpdateSOWList();

		$("#AgreeOnSoWModal .submit").on("click", SoWAgreement_Modal_ClickHandler);
	};

	var	UpdateSOWList = function()
	{
		var		currTag = $("#sow_list_title");


		$.getJSON(
			"/cgi-bin/subcontractor.cgi",
			{
				action: "AJAX_getSoWList",
				include_bt: "true",
			})
			.done(function(data)
			{
				if(data.status == "success")
				{
					data_global = data;

					RenderSOWList();
				}
				else
				{
					console.error("AJAX_getSoWList.done(): ERROR: " + data.description);
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

	var	GetDate = function(additionalMonths, additionalDays)
	{
		var		d1 = new Date();
		var		d2 = new Date(d1.getFullYear(), d1.getMonth() -1 + additionalMonths, d1.getDate() + additionalDays);

		return d2;
	};

	var	GetSOWTasksArrayForChartJS = function(sow)
	{
		var		result = [];

		result.push("SOW");

		for(var i = 0; i < sow.tasks.length; ++i)
		{
			var		task_title = sow.tasks[i].title;

			// if(task_title.length > 10) task_title = task_title.substring(0, 10) + "...";
			result.push("Задача " + (i + 1));
		}

		result.push(".");

		return result;
	};

	var	GetSOWDatasetsArrayForChartJS = function(sow)
	{
		var		sow_start_date, sow_end_date, now;
		var		result = [];
		var		temp = [];

		temp = sow.start_date.split("-");
		sow_start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
		temp = sow.end_date.split("-");
		sow_end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
		now = new Date();

		if((now.getTime() - sow_end_date.getTime()) > 0)
		{
		}
		else if((sow_start_date.getTime() - now.getTime()) > 0)
		{
		}
		else
		{
			// --- "today" vertical line
			result.push(
			{
				type: "line",
				label: "Сегодня",
				// backgroundColor: 'red',
				data: [ {x: now, y: "SOW"},
						{x: now, y: "."}
					  ],
				// borderColor: 'white',
				borderColor: "red",
				pointHoverBackgroundColor: "red",
				pointBackgroundColor: "red",
				borderWidth: 2,
				pointRadius: 2,
				pointHoverRadius: 10,
				pointStyle: "circle"
			});
		}

		// --- SOW horizontal line
		result.push(
		{
			type: "line",
			label: "SOW",
			data: [	{x: sow_start_date, y:"SOW"},
					{x: sow_end_date, y:"SOW"}
				  ],
			borderWidth: 5,
			borderColor: "blue",
			pointHoverBackgroundColor: "blue",
			pointBackgroundColor: "blue",
			showLine: true,
			pointRadius: 5,
			pointHoverRadius: 10
		});

		for(var i = 0; i < sow.tasks.length; ++i)
		{
			var		dataset_obj =
			{
				type: "line",
				label: system_calls.ConvertHTMLToText(sow.tasks[i].projects[0].customers[0].title + " / " + sow.tasks[i].projects[0].title + " / " + sow.tasks[i].title),
				borderWidth: 2,
				borderColor: "green",
				pointHoverBackgroundColor: "green",
				pointBackgroundColor: "green",
				showLine: true,
				pointRadius: 5,
				pointHoverRadius: 10
			};

			var		start_date, end_date;
			var		task_assignment = system_calls.GetTaskAssignmentObjByTaskID(sow.id, sow.tasks[i].id, data_global.task_assignments);

			temp = [];

			if((typeof(task_assignment) != "undefined") && (typeof(task_assignment.period_start) != "undefined") && (typeof(task_assignment.period_end) != "undefined"))
			{
				temp = task_assignment.period_start.split("-");
				start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
				temp = task_assignment.period_end.split("-");
				end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

				if(end_date < sow_start_date)
				{
				}
				else if(start_date > sow_end_date)
				{
				}
				else
				{
					if(start_date < sow_start_date) start_date = sow_start_date;
					if(end_date > sow_end_date) end_date = sow_end_date;

					dataset_obj.data = [{x: start_date, y: "Задача " + (i + 1)}, {x: end_date, y: "Задача " + (i + 1)}];

					result.push(dataset_obj);
				}

			}

		}

		return result;
	};

	var	GetSOWList_DOM = function(sow_list)
	{
		var		result = $();

		if((typeof(sow_list) == "undefined"))
		{
			console.error("sow_list is undefined");
		}
		else
		{
			sow_list = system_calls.SortSoWList(sow_list);

			sow_list.forEach(function(sow_item)
				{
					var		sow_title_row = $("<div>").addClass("row");
					var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
					var		title_div = $("<div>").addClass("col-xs-8 col-md-6");
					var		file_div = $("<div>").addClass("col-xs-2 col-md-1");
					var		title =  $("<span>")
										.addClass("link sow_title")
										.append(sow_item.agency_company_id[0].name + ": " + sow_item.number + " от " + sow_item.sign_date + " (с " + system_calls.ConvertDateSQLToHuman(sow_item.start_date) + " г. по " + system_calls.ConvertDateSQLToHuman(sow_item.end_date) + " г.)")
 										.attr("data-toggle", "collapse")
 										.attr("data-target", "#collapsible_sow_" + sow_item.id);
					var		collapsible_div = $("<div>").addClass("collapse out sow")
														.attr("id", "collapsible_sow_" + sow_item.id);
					var		top_shadow_div = $("<div>").addClass("row collapse-top-shadow margin_bottom_20")
														.append("<p></p>");
					var		bottom_shadow_div = $("<div>").addClass("row collapse-bottom-shadow margin_top_20")
														.append("<p></p>");

					var		canvas_row = $("<div>").addClass("row form-group");
					var		canvas_col = $("<div>").addClass("col-xs-12");
					var		canvas_div = $("<div>").width("750px")
													.attr("max-height", "350px");

					var		timecard_approvers_row = $("<div>").addClass("row");
					var		timecard_approvers_col = $("<div>").addClass("col-xs-12");

					var		bt_approvers_row = $("<div>").addClass("row");
					var		bt_approvers_col = $("<div>").addClass("col-xs-12");

					var		bt_expenses_div = $("<div>").addClass("form-group");

					var		sow_agreement_row = $("<div>").addClass("row __sow_agree_" + sow_item.id);
					var		sow_agreement_col = $("<div>").addClass("col-xs-12");

					var		row_custom_field_title	= $("<div>")	.addClass("row form-group");
					var		col_custom_field_title	= $("<div>")	.addClass("col-xs-12 form-group");
					var		custom_field_dom		= $();
					var		custom_field_container	= $();

					var		canvas = $("<canvas>").attr("data-id", sow_item.id);
					var		myChart;
					var		sow_start_date, sow_end_date, now;
					var		temp = [];
					var		datasets_arr = [];
					var		task_names_arr = [];
					var		status_label = $("<span>").addClass("label");
					var		exp_obj;
					var		sow_agreement_button = $("<button>")
														.addClass("btn btn-primary")
														.append("Согласен")
														.attr("data-sow_id", sow_item.id)
														.on("click", function() 
															{
																$("#AgreeOnSoWModal").modal("show");
																$("#AgreeOnSoWModal .submit").attr("data-sow_id", $(this).attr("data-sow_id"));
															});

					var		agreement_file = $("<a>") .append($("<i>").addClass("fa fa-download"));

					if(sow_item.agreement_filename.length)
					{
						agreement_file.attr("href", "/agreements_sow/" + sow_item.agreement_filename);
						file_div.append(agreement_file);
					}

					temp = sow_item.start_date.split("-");
					sow_start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
					temp = sow_item.end_date.split("-");
					sow_end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

					// --- chart part
					datasets_arr = GetSOWDatasetsArrayForChartJS(sow_item);
					task_names_arr = GetSOWTasksArrayForChartJS(sow_item);

					myChart = new Chart(canvas,
							{
								type: "bar",
								data: {
									labels: [sow_start_date, sow_end_date],
									yLabels: task_names_arr,
									datasets: datasets_arr
								},
								options: {
									responsive: true,
									title: {
										display: true,
										text: system_calls.ConvertHTMLToText(sow_item.agency_company_id[0].name + ": " + sow_item.number + " от " + sow_item.sign_date),
									},
									legend: {
										display: false
									},
									elements: {
										point: {
											pointStyle: "triangle"
										}
									},
									scales: {
										xAxes: [{
											type: "time",
											time: {
												// round: 'day'
												// tooltipFormat: 'll HH:mm'
												tooltipFormat: "ll"
											},
											scaleLabel: {
												display: false,
												labelString: "Date"
											}
										}],
										yAxes: [{
											type: "category",
											position: "left",
											display: "true",
											scaleLabel: {
												display: true,
												labelString: "Задачи"
											},
											ticks: {
												// beginAtZero:true
											}
										}]
									}
								}
							});

					// --- status label
					status_div.append(system_calls.GetSoWBadge_DOM(sow_item));

					// --- build DOM here
					canvas_row
						.append(canvas_col.append(canvas_div.append(canvas)));

					timecard_approvers_col
						.append(system_calls.GetTimecardApprovers_DOM(sow_item));
					bt_approvers_col
						.append(system_calls.GetBTApprovers_DOM(sow_item));

					bt_expenses_div.append(system_calls.GetBTExpenseTemplates_DOM(sow_item));

					// --- custom fields
					if((typeof sow_item != "undefined") && (typeof sow_item.custom_fields != "undefined") && sow_item.custom_fields.length)
					{
						custom_field_dom = common_timecard
											.GetEditableCustomFields_DOM(sow_item.custom_fields);
						custom_field_dom
											.find(".__sow_custom_field_input")
											.attr("data-script", "subcontractor.cgi");

						custom_field_container = custom_field_container
														.add(row_custom_field_title	.append(col_custom_field_title))
														.add(custom_field_dom);
					}


					collapsible_div
						.append(top_shadow_div)
						.append(timecard_approvers_row.append(timecard_approvers_col))
						.append(canvas_row)
						.append(bt_approvers_row.append(bt_approvers_col))
						.append(bt_expenses_div)
						.append(custom_field_container);

					if(sow_item.status == "negotiating")
					{
						if(sow_item.agreement_filename.length)
						{
							// --- agency generated document set to sign

							collapsible_div
								.append(sow_agreement_row.append(sow_agreement_col.append(sow_agreement_button)));
						}
						else
						{
							// --- agency generated document set to sign

							collapsible_div
								.append("<div class=\"alert alert-danger\" role=\"alert\">Агенство готовит SoW на подпись. Ждите.</div>");
						}
					}

					collapsible_div
						.append(bottom_shadow_div);

					title_div.append(title);
/*
					title_div.append(collapsible_div);

					result = result.add(status_div);
					result = result.add(title_div);
*/					
					sow_title_row.append(status_div).append(title_div).append(file_div);

					result = result
								.add(sow_title_row)
								.add(collapsible_div);
				});
		}

		return result;
	};

	var	RenderSOWList = function()
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined"))
		{
			$("#sow_list").empty().append(GetSOWList_DOM(data_global.sow));
		}
		else
		{
			console.error("ERROR: sow list is empty");
		}
	};

	var	SoWAgreement_Modal_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	sow_id = curr_tag.attr("data-sow_id");

		if(sow_id.length)
		{
			curr_tag.button("loading"); // --- double click protection

			$.getJSON(
				"/cgi-bin/subcontractor.cgi",
				{
					action: "AJAX_agreeSoW",
					sow_id: sow_id,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						// --- animation
						$("#AgreeOnSoWModal").modal("hide");
						setTimeout(function() { $("#collapsible_sow_" + sow_id).collapse("hide"); }, 200);

						// --- actual update
						setTimeout(function() { UpdateSOWList(); }, 600);
					}
					else
					{
						console.error("AJAX_getSoWList.done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 250); // --- before displaying popover wait until always enables button
				})
				.always(function()
				{
					setTimeout(function() {
							curr_tag.button("reset");
						}, 200); // --- double click waiting
				});
		}
	};

	return {
		Init: Init
	};

})();
