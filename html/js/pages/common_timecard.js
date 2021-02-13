/*jslint devel: true, indent: 4, maxerr: 50*/
/*globals $:false localStorage:false location: false*/
/*globals localStorage:false*/
/*globals location:false*/
/*globals document:false*/
/*globals window:false*/
/*globals Image:false*/
/*globals jQuery:false*/
/*globals Notification:false*/
/*globals setTimeout:false*/
/*globals navigator:false*/
/*globals module:false*/
/*globals define:false*/

common_timecard = (function()
{
	"use strict";

	var	holiday_calendar_global = [];

	var	RenderDashboardPendingPayment = function(user_role, data)
	{
		var		curr_tag = $("#pending_payment_content");
		var		timecard_counter_dom;
		var		bt_counter_dom;
		var		separator_dom;
		var		bt_tooltip_content = "";
		var		timecard_counter					= data.number_of_payment_pending_timecards || 0;
		var		timecard_late_payment				= typeof(data.timecard_late_payment) != "undefined" 			 ? data.timecard_late_payment.length : 0;
		var		timecard_payment_will_be_late_soon	= typeof(data.timecard_payment_will_be_late_soon) != "undefined" ? data.timecard_payment_will_be_late_soon.length : 0;
		var		bt_counter							= data.number_of_payment_pending_bt || 0;
		var		bt_late_payment						= typeof(data.bt_late_payment) 				? data.bt_late_payment.length : 0;
		var		bt_payment_will_be_late_soon		= typeof(data.bt_payment_will_be_late_soon) ? data.bt_payment_will_be_late_soon.length : 0;
		var		new_dom = $();

		timecard_counter_dom = $("<strong>")
						.append(timecard_counter)
						.addClass("h2 cursor_pointer")
						.addClass(
									timecard_late_payment ? "color_red" : 
									timecard_payment_will_be_late_soon ?  "color_orange" : 
									"color_green"
								)
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title",  
									timecard_late_payment ? "оплата по " + timecard_late_payment + " таймкартам просрочена" : 
									timecard_payment_will_be_late_soon ?  "осталось менее половины периода для оплаты по " + timecard_payment_will_be_late_soon + " таймкартам" : 
									"для оплаты таймкарт время есть"
							)
						.on("click", function(e) { window.location.href = "/cgi-bin/" + user_role + ".cgi?action=timecard_list_template&rand=" + Math.random() * 35987654678923; });

		timecard_counter_dom.tooltip({ animation: "animated bounceIn"});

		bt_counter_dom = $("<strong>")
						.append(bt_counter)
						.addClass("h2 cursor_pointer")
						.addClass(
									bt_late_payment ? "color_red" : 
									bt_payment_will_be_late_soon ?  "color_orange" : 
									"color_green"
								)
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", 
									bt_late_payment ? "оплата по " + bt_late_payment + " поездкам просрочена" : 
									bt_payment_will_be_late_soon ?  "осталось менее половины периода для оплаты " + bt_payment_will_be_late_soon + " поездок" : 
									"для оплаты поездок время есть"
							)
						.on("click", function(e) { window.location.href = "/cgi-bin/" + user_role + ".cgi?action=bt_list_template&rand=" + Math.random() * 35987654678923; });

		bt_counter_dom.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(timecard_counter_dom)
					.add(separator_dom)
					.add(bt_counter_dom);

		curr_tag.empty().append(new_dom);
	};

	var	GetSoWTitleRow = function(sow, make_it_clickable = false, make_it_bold = false)
	{
		var 	result = $();

		var		sow_title_row = $("<div>").addClass("row highlight_onhover");
		var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
		var		company_name_div = $("<div>").addClass("hidden-xs hidden-sm col-md-4");
		var		title_div = $("<div>").addClass("col-xs-9 col-md-3");
		var		file_div = $("<div>").addClass("col-xs-1 col-md-1");
		var		dates_div = $("<div>").addClass("hidden-xs hidden-sm col-md-3");
		var		title =  $("<span>")
							.addClass("sow_title")
							.addClass(make_it_clickable ? "link" : "")
							.addClass(make_it_bold? "font_weight_700" : "")
							.append(sow.number + " от " + system_calls.ConvertDateSQLToHuman(sow.sign_date)/* + " (с " + system_calls.ConvertDateSQLToHuman(sow.start_date) + " г. по " + system_calls.ConvertDateSQLToHuman(sow.end_date) + " г.)"*/)
							.attr("id", "__sow_title_span_" + sow.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_sow_" + sow.id);

		var		sow_dates =  $("<span>")
							.addClass("sow_title")
							.addClass(make_it_clickable ? "link" : "")
							.addClass(make_it_bold? "font_weight_700" : "")
							.append("(с " + system_calls.ConvertDateSQLToHuman(sow.start_date) + " г. по " + system_calls.ConvertDateSQLToHuman(sow.end_date) + " г.)")
							.attr("id", "__sow_dates_span_" + sow.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_sow_" + sow.id);

		var		company_name =  $("<span>")
							.addClass("sow_title")
							.addClass(make_it_clickable ? "link" : "")
							.addClass(make_it_bold? "font_weight_700" : "")
							.append(sow.subcontractor_company[0].name)
							.attr("id", "__sow_company_name_span_" + sow.id)
							.attr("data-toggle", "collapse")
							.attr("data-target", "#collapsible_sow_" + sow.id)
							.data({"sow_json": sow}); // --- save json obj , to render it on-demand. Rendering consumes 500ms.

		var		agreement_file = $("<a>") .append($("<i>").addClass("fa fa-download"));

		if(sow.agreement_filename.length)
		{
			if(make_it_clickable) // --- show it only if clickable
			{
				agreement_file.attr("href", "/agreements_sow/" + sow.agreement_filename);
				file_div.append(agreement_file);
			}
		}

		// --- status label
		status_div			.append(system_calls.GetSoWBadge_DOM(sow));

		title_div 			.append(title);
		company_name_div 	.append(company_name);
		dates_div 			.append(sow_dates);

		sow_title_row.append(status_div).append(company_name_div).append(title_div).append(dates_div).append(file_div);

		result = result.add(sow_title_row);

		return result;
	};

	var	TimecardCollapsible_ClickHandler = function(e, holiday_calendar)
	{
		var		currTag		= $(e.currentTarget);
		var		timecard_id	= currTag.attr("data-timecard_id");
		var		script		= currTag.attr("data-script");

		if(timecard_id)
		{
			if(script && script.length)
			{
				if($("#collapsible_timecard_" + timecard_id).attr("aria-expanded") == "true")
				{
					// --- collapse collapsible_div
				}
				else
				{
					$.getJSON(
						"/cgi-bin/" + script,
						{
							"action":"AJAX_getTimecardEntry",
							"timecard_id": timecard_id
						})
						.done(function(data)
						{
							if(data.result == "success")
							{
								var		timecard_item = data.timecards[0];
								var		collapsible_content = $();

								collapsible_content = collapsible_content
																.add(system_calls.GetHoursStatistics_DOM(timecard_item, undefined, holiday_calendar))
																.add(system_calls.GetApprovals_DOM(timecard_item))
																.add(system_calls.GetApprovedDate_DOM(timecard_item))
																.add($("<br>"))
																.add(system_calls.GetOriginalsReceivedDate_DOM(timecard_item))
																.add(system_calls.GetExpectedPayDate_DOM(timecard_item))
																.add(system_calls.GetPayedDate_DOM(timecard_item));

								$("#collapsible_timecard_" + timecard_id + "_info").empty().append(collapsible_content);
							}
							else
							{
								system_calls.PopoverError(currTag, "Ошибка: " + data.description);
							}
						})
						.fail(function(data)
						{
							setTimeout(function() {
								system_calls.PopoverError(currTag, "Ошибка ответа сервера");
							}, 500);
						});
				}
			}
			else
			{
				system_calls.PopoverError(currTag, "script not found");
			}
		}
		else
		{
			system_calls.PopoverError(currTag, "не найден номер таймкарты");
		}
	};

	var	ToggleInputsWithIndex = function(e)
	{
		var		curr_tag	= $(this);
		var		curr_idx	= curr_tag.attr("data-index");
		var		i			= 0;

		curr_tag.closest(".tab-pane").find("input.__start_date.__index_" + curr_idx).each(function()
		{
			var		tag = $(this);

			setTimeout(function() { tag.click(); }, i++ * 100);
		});

	};

	var	GetEditableCustomFields_DOM = function(custom_fields)
	{
		var	result = $();

		custom_fields.sort(function(a, b)
		{
			var 	titleA = a.title;
			var		titleB = b.title;
			var		result = 0;

			if(titleA == titleB) { result = 0; }
			if(titleA <  titleB) { result = -1; }
			if(titleA >  titleB) { result = 1; }

			return result;
		});

		custom_fields.forEach(function(custom_field)
			{
				result = result.add(system_calls.GetEditableSoWCustomField_DOM(custom_field));
			});

		return result;
	};

	var	isSowActiveOnDate = function(sow, active_date)
	{
		var	start_date_arr	= sow.start_date	.split(/\-/);
		var	end_date_arr	= sow.end_date		.split(/\-/);
		var	start_date		= new Date(parseInt(start_date_arr[0]), parseInt(start_date_arr[1]) - 1, parseInt(start_date_arr[2]));
		var	end_date		= new Date(parseInt(end_date_arr[0]), parseInt(end_date_arr[1]) - 1, parseInt(end_date_arr[2]));

		return (sow.status == "signed") && (start_date <= active_date) && (active_date <= end_date);
	};

	var	GetWorkingHoursPerDay_DOM = function(sow)
	{
		return $().add($("<span>").append("Рабочих часов в день: " + sow.working_hours_per_day));
	};

	var	GetSoWFromListBySoWID = function(sow_list, sow_id)
	{
		var	result;

		for (var i = 0; i < sow_list.length; i++) {
			if(sow_list[i].id == sow_id)
			{
				result = sow_list[i];
				break;
			}
		}

		return result;
	};

	return {
		RenderDashboardPendingPayment: RenderDashboardPendingPayment,
		GetSoWTitleRow: GetSoWTitleRow,
		TimecardCollapsible_ClickHandler: TimecardCollapsible_ClickHandler,
		ToggleInputsWithIndex: ToggleInputsWithIndex,
		GetEditableCustomFields_DOM: GetEditableCustomFields_DOM,
		isSowActiveOnDate: isSowActiveOnDate,
		GetWorkingHoursPerDay_DOM: GetWorkingHoursPerDay_DOM,
		GetSoWFromListBySoWID: GetSoWFromListBySoWID,
	};

})();

preview_modal = (function ()
{
	var		rotation;
	var		scaleX, scaleY;

	var	Init = function()
	{
		$("#ImagePreviewModal").on("show.bs.modal", function(e)
		{
			var regex = /exif_rotate\-(\d+)/;
			var	regex_match = $("#ImagePreviewModal_Img").attr("class").match(regex);

			$("#ImagePreviewModal .draggable")	.css({'left':'0px', 'top':'0px'}); // --- reset drag-n-drop position
			rotation = 0;
			scaleX = 1;
			scaleY = 1;

			if((typeof(regex_match) == "object") && regex_match && (regex_match.length >= 2))
				rotation = parseInt(regex_match[1]);

			system_calls.Exif_RemoveClasses($("#ImagePreviewModal_Img"));
			Update();
		});

		$("#ImagePreviewModal .RotateLeft")		.on("click", RotateLeft);
		$("#ImagePreviewModal .RotateRight")	.on("click", RotateRight);
		$("#ImagePreviewModal .FlipHorizontal")	.on("click", FlipHorizontal);
		$("#ImagePreviewModal .FlipVertical")	.on("click", FlipVertical);
		$("#ImagePreviewModal .ZoomIN")			.on("click", ZoomIN);
		$("#ImagePreviewModal .ZoomOUT")		.on("click", ZoomOUT);
		$("#ImagePreviewModal .draggable")		.draggable();
	};

	var	Update = function()
	{
		$("#ImagePreviewModal_Img").css({'transform': 'rotateZ(' + rotation + 'deg) scaleX(' + scaleX + ') scaleY(' + scaleY + ')'});
	};

	var	RotateLeft = function()
	{
		rotation = rotation - 90;
		Update();
	};

	var	RotateRight = function()
	{
		rotation = rotation + 90;
		Update();
	};

	var	FlipHorizontal = function()
	{
		if((rotation % 180) === 0)
			scaleX = -scaleX;
		else
			scaleY = -scaleY;
		Update();
	};

	var	FlipVertical = function()
	{
		if((rotation % 180) === 0)
			scaleY = -scaleY;
		else
			scaleX = -scaleX;
		Update();
	};

	var	ZoomIN = function()
	{
		scaleX += scaleX * 0.2;
		scaleY += scaleY * 0.2;
		Update();
	};

	var	ZoomOUT = function()
	{
		scaleX -= scaleX * 0.2;
		scaleY -= scaleY * 0.2;
		Update();
	};


	return {
		Init: Init,
	};
})();


list_filters = (function()
{
	var	ANIMATION_TIMEOUT = 200;

	var	active_filter_global = "";

	var	GetActiveFilter = function()	{ return active_filter_global; };
	var	SetActiveFilter = function(f)	{ active_filter_global = f; };

	var	ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		if($("button.__list_filters.btn-primary")[0] != curr_tag[0])
		{
			$("button.__list_filters.btn-primary").toggleClass("btn-primary", "btn-default");
			curr_tag.toggleClass("btn-primary", "btn-default");

			SetActiveFilter(curr_tag.attr("data-filter"));
			ApplyFilter(GetActiveFilter());
		}
	};

	var	ApplyFilter = function(filter_class)
	{
		if(filter_class.length)
		{
			ShowIfHiddenWithClass(filter_class);
			HideIfVisibleWithoutClass(filter_class);
		}
		else
		{
			ShowIfHiddenWithClass("");
		}
	};

	var	ShowIfHiddenWithClass = function(filter_class)
	{
		if(filter_class.length) filter_class = "." + filter_class;

		$(".__filterable" + filter_class + ":hidden").each(function() 
		{
			var	curr_tag = $(this);

			if(curr_tag.hasClass("collapse")) { /* nothing to do */ }
			else
			{
				curr_tag.show(ANIMATION_TIMEOUT);
			}
		});
	};

	var	HideIfVisibleWithoutClass = function(filter_class)
	{
		if(filter_class.length) filter_class = "." + filter_class;

		$(".__filterable:visible:not(.__filterable" + filter_class + ")").each(function() 
		{
			var	curr_tag = $(this);

			if(curr_tag.hasClass("collapse")) 
			{
				curr_tag.collapse("hide");
			}
			else
			{
				curr_tag.hide(ANIMATION_TIMEOUT);
			}
		});
	};

	var	ApplyFilterFromURL = function()
	{
		var	 url_param = $.urlParam("filter");

		if(url_param.length)	$("[data-filter=\"" + url_param + "\"]").click();
	};

	return {
		ClickHandler: ClickHandler,
		ApplyFilterFromURL: ApplyFilterFromURL,
	};
})();

original_docs_delivery_obj = (function()
{
	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	DB_FORMAT_GLOBAL = "YYYY-MM-DD";
	var	user_role_global;
	var	modal_selector_global = "#original_docs_delivered_Modal";
	var	dp_global;
	var	curr_icon_tag_global;

	var	Init = function(user_role)
	{
		if(user_role) user_role_global = user_role;
		else
		{
			console.error("user_role is empty");
		}

		dp_global = $("#original_docs_delivered_Modal .__calendar").datepicker({
								dateFormat: DATE_FORMAT_GLOBAL,
		
								firstDay: 1,
								dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
								dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
								monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
								monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
								changeMonth: true,
								changeYear: true,
								defaultDate: "+0d",
								numberOfMonths: 2,
								yearRange: "2019:2030",
								showOtherMonths: true,
								selectOtherMonths: true
							});

		$(modal_selector_global + " button.__delivered")		.on("click", Delivery_ClickHandler);
		$(modal_selector_global + " button.__not_delivered")	.on("click", Delivery_ClickHandler);
	};

	var	GetItemDOM = function(item)
	{
		var	originals_received;
		var	d1;
		var	date;
		var	result = $();

		if((typeof(item) != "undefined") && (typeof(item.originals_received_date) != "undefined") && (typeof(item.id) != "undefined"))
		{
			originals_received = parseInt(item.originals_received_date);

			if(originals_received)
			{
				d1 = new Date(originals_received * 1000);

				result = $("<i>")
								.addClass("fa fa-book")
								.attr("data-date", system_calls.GetFormattedDateFromSeconds(originals_received, "DD/MM/YYYY"))
								.attr("title", "оригиналы доставлены " + system_calls.GetFormattedDateFromSeconds(originals_received, "DD MMMM YYYY"));

			}
			else
			{
				result = $("<i>")
								.addClass("fa fa-times text-danger")
								.attr("title", "оригиналы не доставлены");
			}

			result
				.attr("data-toggle", "tooltip")
				.attr("data-placement", "top")
				.attr("data-id", item.id)
				.attr("data-action", (typeof(item.place) != "undefined") ? "AJAX_updateBTOriginalDocumentsDelivery" : "AJAX_updateTimecardOriginalDocumentsDelivery")
				;


			if(user_role_global == "agency") result
												.on("click", Modal_ClickHandler)
												.addClass("cursor_pointer");

			result.tooltip({ animation: "animated bounceIn"});
		}
		else
		{
			console.error("item doesn't have originals_received_date/id field");
		}


		// return $();
		return result;
	};

	var	Delivery_ClickHandler = function()
	{
		var	curr_tag = $(this);
		var	date_obj = dp_global.datepicker("getDate");
		var	timestamp = 0;

		if((date_obj === null) || (curr_tag.hasClass("__not_delivered"))) {}
		else
		{
			timestamp = date_obj.getTime() / 1000 + 12 * 3600; // --- set clock to noon, to avoid different day in diff TZ
		}

			curr_tag.button("loading");

			$.getJSON(
				"/cgi-bin/" + user_role_global + ".cgi",
				{
					action:		curr_tag.attr("data-action"),
					id:			curr_tag.attr("data-id"),
					timestamp:	timestamp,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						if((typeof(data.items) != "undefined") && data.items.length)
						{
							$(modal_selector_global).modal("hide");
							setTimeout(function() {
								curr_icon_tag_global.hide(200);
							}, 300);
							setTimeout(function() {
								curr_icon_tag_global.replaceWith(GetItemDOM(data.items[0]));
							}, 500);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						}
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				})
				.always(function(e)
				{
					curr_tag.button("reset");
				});

	};

	var	Modal_ClickHandler = function()
	{
		curr_icon_tag_global = $(this);

		$(modal_selector_global).modal("show");

		$(modal_selector_global + " button").attr("data-id", curr_icon_tag_global.attr("data-id"));
		$(modal_selector_global + " button").attr("data-action", curr_icon_tag_global.attr("data-action"));

		dp_global.datepicker("setDate", curr_icon_tag_global.attr("data-date"));
	};

	return {
		Init: Init,
		GetItemDOM: GetItemDOM,
	};
})();
