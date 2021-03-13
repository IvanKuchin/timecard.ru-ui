
var	subcontractor_travel_list = subcontractor_travel_list || {};

subcontractor_travel_list = (function()
{
	"use strict";

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;

	var Init = function()
	{
		UpdateTravelList();

/*
		$("button.voucher_id")
							.on("click", function() {
								var	curr_tag = $(this);
								var	voucher_id = $("input.voucher_id").val();

								curr_tag.button("loading");

								$.getJSON('/cgi-bin/subcontractor.cgi', {action: "AJAX_getVoucher", voucher_id: voucher_id})
											.done(function(data) {
												if(data.result == "success")
												{
												}
												else
												{
													system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
												}
											})
											.fail(function(data) {
												system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
											})
											.always(function() {
												curr_tag.button("reset");
											});								
							});
*/
	};

	var	UpdateTravelList = function()
	{
		var		currTag = $("#travel_list_title");

		$.getJSON(
			"/cgi-bin/subcontractor.cgi",
			{
				"action":"AJAX_getTravelList",
			})
			.done(function(data)
			{
				if(data.status == "success")
				{
					data_global = data;
					RenderTravelList();
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
	};

	var	GetAirlineBookingListDOM = function(airline_bookings, sow)
	{
		var		result = $();

		if((typeof(airline_bookings) == "undefined"))
		{
			console.error("airline_bookings is undefined");
		}
		else
		{

			var		timeFormat = "MM/DD/YYYY HH:mm";
			var		item_belongs_to_sow = [];
			var		sow_id = sow.id;

			airline_bookings.forEach(function(item)
			{
				if(item.contract_sow_id == sow_id) item_belongs_to_sow.push(item);
			});

			item_belongs_to_sow.sort(function(a, b)
			{
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(a.checkin);
				timeB = new Date(b.checkin);

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});


			item_belongs_to_sow.forEach(function(airline_booking)
				{
					if(airline_booking.checkin.length && airline_booking.checkout.length)
					{
						var		visible_row = $("<div>").addClass("row highlight");
						var		collapsible_row = $("<div>").addClass("row")
															.addClass("collapse out sow")
															.attr("id", "collapsible_booking_" + airline_booking.id);
						var		status_div = $("<div>").addClass("col-xs-2 col-md-1");
						var		timeinterval_col = $("<div>").addClass("col-xs-8 col-md-4");
						var		download_col = $("<div>").addClass("col-xs-2 col-md-1");
						var		destination_col = $("<div>").addClass("hidden-xs hidden-sm col-md-3");
						var		price_col = $("<div>").addClass("hidden-xs hidden-sm col-md-2");

						var		checkin_date = new Date(airline_booking.checkin);
						var		checkout_date = new Date(airline_booking.checkout);

						var		title =  $("<span>")
											.addClass("booking_title")
											.append("<i class=\"fa fa-plane\" aria-hidden=\"true\"></i> " + system_calls.GetFormattedDateFromSeconds(checkin_date.getTime() / 1000, timeFormat) + " <i class=\"fa fa-plane fa-rotate-90\" aria-hidden=\"true\"></i> " + system_calls.GetFormattedDateFromSeconds(checkout_date.getTime() / 1000, timeFormat))
											.attr("id", "booking_title_" + airline_booking.id)
	 										// .attr("data-toggle", "collapse")
	 										.attr("data-target", "#collapsible_booking_" + airline_booking.id)
	 										.attr("data-bt_id", airline_booking.id);
	 										//.on("click", BTCollapsible_ClickHandler);
						var		top_shadow_div = $("<div>").addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
						var		bottom_shadow_div = $("<div>").addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");

						var		collapsible_content_col = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_booking_" + airline_booking.id + "_content");
						var		collapsible_nested_row_button = $("<div>").addClass("row");
						var		collapsible_nested_col_button = $("<div>").addClass("col-xs-6 col-xs-offset-6 col-md-1 col-xs-offset-0 form-group");
						var		collapsible_nested_row_statistics = $("<div>").addClass("row");
						var		collapsible_nested_col_statistics = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_booking_" + airline_booking.id + "_statistics");
						var		collapsible_nested_row_info = $("<div>").addClass("row");
						var		collapsible_nested_col_info = $("<div>")
																.addClass("col-xs-12")
																.attr("id", "collapsible_booking_" + airline_booking.id + "_info");

						var		canvas = $("<canvas>").attr("data-id", airline_booking.id);
						var		datasets_arr = [];
						var		task_names_arr = [];
						var		status_icon = $("<i>").addClass("fa");
						var		destination = airline_booking.destination;
						var		amount = airline_booking.amount;
						var		download_tag = $();

						if(airline_booking.voucher_filename.length)
						{
							download_tag = $("<a>")
												.attr("href", "/smartway_vouchers/" + airline_booking.voucher_filename + "?rand=" + Math.random() * 65456789087)
												.attr("target", "_blank")
												.append($("<i>").addClass("fa fa-download"));
						}

						if(airline_booking.status == "done")
						{
							status_icon	.addClass("fa-check-circle color_green")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "подтверждено");
						}
						if(airline_booking.status == "saved")
						{
							status_icon	.addClass("fa-floppy-o color_grey")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "сохранено");
						}
						if(airline_booking.status == "submit")
						{
							status_icon	.addClass("fa-clock-o color_orange")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "ожидает подтверждения");
						}
						if(airline_booking.status == "rejected")
						{
							status_icon	.addClass("fa-times color_red")
										.attr("data-toggle", "tooltip")
										.attr("data-placement", "top")
										.attr("title", "отклонено");
						}

						// --- initial DOM. It would be changed after user click collapse.
						collapsible_content_col
							.append(collapsible_nested_row_statistics.append(collapsible_nested_col_statistics))
							.append(collapsible_nested_row_button.append(collapsible_nested_col_button))
							.append(collapsible_nested_row_info.append(collapsible_nested_col_info));

						visible_row
							.append(status_div			.append(status_icon))
							.append(timeinterval_col	.append(title))
							.append(destination_col		.append(airline_booking.destination))
							.append(price_col			.append("<span style=\"font-size: smaller;\">" + airline_booking.amount + " руб.</span>"))
							.append(download_col		.append(download_tag));


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
						console.error("bt(id: " + airline_booking.id + ") empty start_date or end_date");
					}
				});
		}

		return result;
	};

	var	RenderTravelList = function()
	{
		if((typeof(data_global) != "undefined") && (typeof(data_global.sow) != "undefined")&& (typeof(data_global.airline_bookings) != "undefined"))
		{
			var		container = $();

			// --- sort sow
			data_global.sow.sort(function(a, b)
			{
				var		arrA = a.sign_date.split(/\-/);
				var		arrB = b.sign_date.split(/\-/);
				var 	timeA, timeB;
				var		result = 0;

				timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
				timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

				if(timeA.getTime() == timeB.getTime()) { result = 0; }
				if(timeA.getTime() <  timeB.getTime()) { result = 1; }
				if(timeA.getTime() >  timeB.getTime()) { result = -1; }

				return result;
			});


			for(var i = 0; i < data_global.sow.length; ++i)
			{
				var		sow_row = $("<div>").addClass("row margin_top_10");
				var		sow_col = $("<div>").addClass("col-xs-12 col-md-11 col-md-offset-1").append(data_global.sow[i].number + " " + data_global.sow[i].sign_date);

				container = container.add(sow_row.append(sow_col));
				container = container.add(GetAirlineBookingListDOM(data_global.airline_bookings, data_global.sow[i]));
			}

			$("#travel_list").empty().append(container);
		}
		else
		{
			console.error("ERROR: sow list or travel list is empty");
		}
	};


	return {
		Init: Init,
	};

})();
