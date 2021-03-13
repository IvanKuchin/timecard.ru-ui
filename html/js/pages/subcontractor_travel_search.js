
var	subcontractor_travel_search = subcontractor_travel_search || {};

subcontractor_travel_search = (function()
{
	"use strict";
	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	min_price_global = 0;
	var	max_price_global = Number.POSITIVE_INFINITY;
	var	duration_global = Number.POSITIVE_INFINITY;
	var	min_takeoff_time_flight1_global = 0;
	var	max_takeoff_time_flight1_global = 24;
	var	min_landing_time_flight1_global = 0;
	var	max_landing_time_flight1_global = 24;
	var	min_takeoff_time_flight2_global = 0;
	var	max_takeoff_time_flight2_global = 24;
	var	min_landing_time_flight2_global = 0;
	var	max_landing_time_flight2_global = 24;
	var	luggage_global = 0;
	var	layover_global = 0;
	var	current_sow_global = "";
	var	sow_list_global;

	var	curr_request_global; // --- keep track ajax-request to be able to cancel it.
	var	semaphore_global = 0; // --- semaphore holding back frequent GUI update

	var Init = function()
	{
			LoadInitialData();

			$("button.voucher_id")
							.on("click", function() {
								var	curr_tag = $(this);
								var	voucher_id = $("input.voucher_id").val();

									$.getJSON("/cgi-bin/subcontractor.cgi", {action: "AJAX_getVoucher", voucher_id: voucher_id})
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
												});								
							});

			$("#from_0")
							.autocomplete({
								source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAirportAutocompleteList",
								select: Airport_SelectHandler,
							});

			$("#to_0")
							.autocomplete({
								source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAirportAutocompleteList",
								select: Airport_SelectHandler,
							});

			$(".date_takeoff_0")
							.datepicker({
							    dateFormat: DATE_FORMAT_GLOBAL,
							    minDate: new Date(),

								firstDay: 1,
								dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
								dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
								monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
								monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
								changeMonth: true,
								changeYear: true,
								defaultDate: "+0d",
								numberOfMonths: 1,
								yearRange: "1960:2030",
								showOtherMonths: true,
								selectOtherMonths: true
								})
					        .on( "change", function() {
						          $(".date_return_0").datepicker( "option", "minDate", $(this).val() );
						          UpdateTicketSearch();
					        });

			$(".date_return_0")
							.datepicker({
							    dateFormat: DATE_FORMAT_GLOBAL,
							    minDate: new Date(),
							    
								firstDay: 1,
								dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
								dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
								monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
								monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
								changeMonth: true,
								changeYear: true,
								defaultDate: "+0d",
								numberOfMonths: 1,
								yearRange: "1960:2030",
								showOtherMonths: true,
								selectOtherMonths: true
								})
					        .on( "change", function() {
						          $(".date_takeoff_0").datepicker( "option", "maxDate", $(this).val() );
						          UpdateTicketSearch();
					        });

			$("#swap_directions")
							.on("click", function() {
								var temp = $("#from_0").val();

								$("#from_0").val($("#to_0").val());
								$("#to_0").val(temp);

								UpdateTicketSearch();
							});

			$("#flight_direction")
							.on("change", function() {
								var	flight_direction = $("#flight_direction").val();

								if(flight_direction == "one-way")
								{
									$(".date_return_0").val("");
									$(".date_return_0").parent().hide(200);
									$("#times_flight2_filter").hide(200);
								}

								if(flight_direction == "two-ways")
								{
									$(".date_return_0").parent().show(200);
									$("#times_flight2_filter").show(200);
								}

								UpdateTicketSearch();
							});

			$("#price_filter") 			.on("click", ShowHideDialogWindow_ClickHandler);
			$("#layover_filter") 		.on("click", ShowHideDialogWindow_ClickHandler);
			$("#duration_filter") 		.on("click", ShowHideDialogWindow_ClickHandler);
			$("#times_flight1_filter") 	.on("click", ShowHideDialogWindow_ClickHandler);
			$("#times_flight2_filter") 	.on("click", ShowHideDialogWindow_ClickHandler);
			$("#luggage_filter") 		.on("click", ShowHideDialogWindow_ClickHandler);

			$("#price_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#price_dialog\"]") },
							});

			$("#layover_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#layover_dialog\"]") },
							});

			$("#duration_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#duration_dialog\"]") },
							});

			$("#times_flight1_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#times_flight1_dialog\"]") },
							});

			$("#times_flight2_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#times_flight2_dialog\"]") },
							});

			$("#luggage_dialog")
							.dialog({
								autoOpen: false,
								show: { duration: 100 },
								hide: { duration: 100 },
								position: { my: "left top", at: "left bottom", of: $("button[data-trigger_dialog=\"#luggage_dialog\"]") },
							});

			$("#price_dialog .slider")
							.slider({
								range: true,
								min: 0,
								max: 500,
								values: [0, 500],
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");

									min_price_global = ui.values[0];
									max_price_global = ui.values[1];
									curr_dialog.find(".label_1").empty().append(min_price_global); // --- this update required to update GUI in case of Programmatically slide value change
									curr_dialog.find(".label_2").empty().append(max_price_global);

									// --- filter button color
									if(
										(min_price_global == curr_tag.slider("option", "min")) &&
										(max_price_global == curr_tag.slider("option", "max"))
										)
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");

									curr_dialog.find(".label_1").empty().append(ui.values[0]);
									curr_dialog.find(".label_2").empty().append(ui.values[1]);
								},
							});

			$("#duration_dialog .slider")
							.slider({
								range: "min",
								value: 500,
								max: 500,
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");

									duration_global = ui.value;
									curr_dialog.find(".label_1").empty().append(duration_global + " " + GetHoursSpellingDeclension(duration_global));

									// --- filter button color
									if(duration_global == curr_tag.slider("option", "max"))
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									
									curr_dialog.find(".label_1").empty().append(ui.value + " " + GetHoursSpellingDeclension(ui.value));
								},
							});

			$("#times_flight1_dialog .slider_1")
							.slider({
								range: true,
								min: 0,
								max: 24,
								values: [0, 24],
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");
									var	pair_slider = curr_tag.closest(".dialog").find(".slider_2");

									min_takeoff_time_flight1_global = ui.values[0];
									max_takeoff_time_flight1_global = ui.values[1];
									curr_dialog.find(".label_1").empty().append(min_takeoff_time_flight1_global);
									curr_dialog.find(".label_2").empty().append(max_takeoff_time_flight1_global);


									// --- filter button color
									if(
										(min_takeoff_time_flight1_global == curr_tag.slider("option", "min")) &&
										(max_takeoff_time_flight1_global == curr_tag.slider("option", "max")) &&
										(min_landing_time_flight1_global == pair_slider.slider("option", "min")) &&
										(max_landing_time_flight1_global == pair_slider.slider("option", "max"))
										)
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									
									curr_dialog.find(".label_1").empty().append(ui.values[0]);
									curr_dialog.find(".label_2").empty().append(ui.values[1]);
								},
							});

			$("#times_flight1_dialog .slider_2")
							.slider({
								range: true,
								min: 0,
								max: 24,
								values: [0, 24],
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");
									var	pair_slider = curr_tag.closest(".dialog").find(".slider_1");

									min_landing_time_flight1_global = ui.values[0];
									max_landing_time_flight1_global = ui.values[1];
									curr_dialog.find(".label_3").empty().append(min_landing_time_flight1_global);
									curr_dialog.find(".label_4").empty().append(max_landing_time_flight1_global);


									// --- filter button color
									if(
										(min_takeoff_time_flight1_global == pair_slider.slider("option", "min")) &&
										(max_takeoff_time_flight1_global == pair_slider.slider("option", "max")) &&
										(min_landing_time_flight1_global == curr_tag.slider("option", "min")) &&
										(max_landing_time_flight1_global == curr_tag.slider("option", "max"))
										)
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									
									curr_dialog.find(".label_3").empty().append(ui.values[0]);
									curr_dialog.find(".label_4").empty().append(ui.values[1]);
								},

							});

			$("#times_flight2_dialog .slider_1")
							.slider({
								range: true,
								min: 0,
								max: 24,
								values: [0, 24],
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");
									var	pair_slider = curr_tag.closest(".dialog").find(".slider_2");

									min_takeoff_time_flight2_global = ui.values[0];
									max_takeoff_time_flight2_global = ui.values[1];
									curr_dialog.find(".label_1").empty().append(min_takeoff_time_flight2_global);
									curr_dialog.find(".label_2").empty().append(max_takeoff_time_flight2_global);


									// --- filter button color
									if(
										(min_takeoff_time_flight2_global == curr_tag.slider("option", "min")) &&
										(max_takeoff_time_flight2_global == curr_tag.slider("option", "max")) &&
										(min_landing_time_flight2_global == pair_slider.slider("option", "min")) &&
										(max_landing_time_flight2_global == pair_slider.slider("option", "max"))
										)
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									
									curr_dialog.find(".label_1").empty().append(ui.values[0]);
									curr_dialog.find(".label_2").empty().append(ui.values[1]);
								},
							});

			$("#times_flight2_dialog .slider_2")
							.slider({
								range: true,
								min: 0,
								max: 24,
								values: [0, 24],
								change: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");
									var	pair_slider = curr_tag.closest(".dialog").find(".slider_1");

									min_landing_time_flight2_global = ui.values[0];
									max_landing_time_flight2_global = ui.values[1];
									curr_dialog.find(".label_3").empty().append(min_landing_time_flight2_global);
									curr_dialog.find(".label_4").empty().append(max_landing_time_flight2_global);


									// --- filter button color
									if(
										(min_takeoff_time_flight2_global == pair_slider.slider("option", "min")) &&
										(max_takeoff_time_flight2_global == pair_slider.slider("option", "max")) &&
										(min_landing_time_flight2_global == curr_tag.slider("option", "min")) &&
										(max_landing_time_flight2_global == curr_tag.slider("option", "max"))
										)
										button.removeClass("btn-primary").addClass("btn-default");
									else
										button.removeClass("btn-default").addClass("btn-primary");

									HoldbackUpdateTicketSearch();
								},
								slide: function(event, ui) {
									var	curr_tag = $(this);
									var	curr_dialog = curr_tag.closest(".dialog");
									
									curr_dialog.find(".label_3").empty().append(ui.values[0]);
									curr_dialog.find(".label_4").empty().append(ui.values[1]);
								},
							});

			$("input[name=\"luggage_radios\"]")
							.on("change", function() {
								var	curr_tag = $(this);
								var	curr_dialog = curr_tag.closest(".dialog");
								var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");

								luggage_global = parseInt($("input[name=\"luggage_radios\"]:checked").val());

								if(luggage_global)
									button.removeClass("btn-default").addClass("btn-primary");
								else
									button.removeClass("btn-primary").addClass("btn-default");

								HoldbackUpdateTicketSearch();
							});

			$("input[name=\"layover_radios\"]")
							.on("change", function() {
								var	curr_tag = $(this);
								var	curr_dialog = curr_tag.closest(".dialog");
								var	button = $("button[data-trigger_dialog=\"#" + curr_dialog.attr("id") + "\"]");
								
								layover_global = parseInt($("input[name=\"layover_radios\"]:checked").val());

								if(layover_global)
									button.removeClass("btn-default").addClass("btn-primary");
								else
									button.removeClass("btn-primary").addClass("btn-default");

								HoldbackUpdateTicketSearch();
							});
			$(".convenient_flight button")
							.on("click", function() {
								var	curr_tag = $(this);
								var	isConvenientPressed = curr_tag.hasClass("btn-primary");
								
								if(isConvenientPressed)
								{
									ResetConvenientFilter();

									curr_tag.removeClass("btn-primary").addClass("btn-default");
								}
								else
								{
									ApplyConvenientFilter(parseInt(curr_tag.attr("data-option")));

									curr_tag.removeClass("btn-default").addClass("btn-primary");
								}

								HoldbackUpdateTicketSearch();
							});

			$("#AreYouSureBuyTicket button.submit")
							.on("click", BuyTicket_ClickHandler);
	};

	var	LoadInitialData = function()
	{
		var		currTag = $("#bt_body");

		$.getJSON(
			"/cgi-bin/subcontractor.cgi",
			{
				action:"AJAX_getSoWList",
				include_tasks:"false",
				include_bt:"false"
			})
			.done(function(data) {
				var		i;

				if(data.status == "success")
				{
					if(data.sow.length)
					{
						sow_list_global = data;
						if(current_sow_global === "")
						{
							for(i = 0; i < data.sow.length; ++i)
							{
								if(system_calls.isDateInFutureOrMonthAgo(data.sow[i].end_date) && (data.sow[i].status == "signed"))
								{
									current_sow_global = data.sow[i].id;
								}
							}
						}
						system_calls.SOWSelectBox_OnloadRender(sow_list_global, current_sow_global);
					}
					else
					{
						console.error("AJAX_getMyBT.done(): ERROR: sow-array is empty");
						system_calls.PopoverError(currTag, "Ошибка: не подписано ни одного SoW");
					}
				}
				else
				{
					console.error("AJAX_getMyBT.done(): ERROR: " + data.description);
					system_calls.PopoverError(currTag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data) {
				system_calls.PopoverError(currTag, "Ошибка ответа сервера");
			})
			.always(function(data) {
			});
	};

	var	GetHoursSpellingDeclension = function(hours)
	{
		return (hours % 10 == 1 ? "часа" : "часов");
	};

	var	ShowHideDialogWindow_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	trigger_dialog = $(curr_tag.attr("data-trigger_dialog"));

		trigger_dialog.dialog(trigger_dialog.is(":hidden") ? "open" : "close");
	};

	var Airport_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);

		curr_tag.attr("data-airport_id", id);

		UpdateTicketSearch();
	};

	var	CheckValidity = function()
	{
		var	result = true;
		var	flight_direction = $("#flight_direction").val();

		if(($("#from_0").attr("data-airport_id") === undefined) || ($("#from_0").attr("data-airport_id").length === 0))
		{
			result = false;
		}

		if(($("#to_0").attr("data-airport_id") === undefined) || ($("#to_0").attr("data-airport_id").length === 0))
		{
			result = false;
		}
		
		if($(".date_takeoff_0").val().length === 0)
		{
			result = false;
		}

		if(flight_direction == "one-way")
		{

		}
		else if(flight_direction == "two-ways")
		{
			if($(".date_return_0").val().length === 0)
			{
				result = false;
			}
		}

		return result;
	};

	var	BuildSearchQuery = function()
	{
		var	flight_direction = $("#flight_direction").val();
		var	obj = {
				action:"AJAX_findFlights",
				sow_id:$("#sowSelector").val(),
			};

		obj.from_0 			= $("#from_0").attr("data-airport_id");
		obj.to_0 			= $("#to_0").attr("data-airport_id");
		obj.date_takeoff_0 	= $(".date_takeoff_0").val();


		if(flight_direction == "one-way")
		{

		}
		else if(flight_direction == "two-ways")
		{
			obj.from_1 			= $("#to_0").attr("data-airport_id");
			obj.to_1 			= $("#from_0").attr("data-airport_id");
			obj.date_takeoff_1 	= $(".date_return_0").val();
		}

		return obj;
	};

	var	ResetFlights = function()
	{
		ResetConvenientFilter();
		UpdateButton_NumberOfConvenientFlights();

		$("#flights").empty();

		// --- remove actual data as late as possible
		data_global = undefined;
	};

	var	GetNumberFlightsFound = function()
	{
		return data_global[0].trips.length;
	};

	var GetTripPrice = function(trip)
	{
		return trip.price;
	};

	var GetTripDuration = function(trip)
	{
		var	max = 0;

		for(var i = 0; i < trip.routes.length; ++i)
		{
			max = Math.max(max, trip.routes[i].duration);
		}

		return Math.trunc(max / 3600);
	};

	var	GetTimeInTheAir = function(trip)
	{
		var	result = $();
		var	i;
		var	departure_time, arrival_time;

		for(i = 0; i < trip.routes.length; ++i)
		{
			departure_time = system_calls.GetFormattedDateFromSeconds(trip.routes[i].segments[0].departure_time, "DD MMM HH:mm");
			arrival_time = system_calls.GetFormattedDateFromSeconds(trip.routes[i].segments[trip.routes[i].segments.length -1].arrival_time, "DD MMM HH:mm");

			result = result.add($("<div>").append(departure_time + " - " + arrival_time));
		}

		return result;
	};

	var	GetTravelDuration = function(trip)
	{
		var	result = $();
		var	i;
		var hours, mins;
		var	duration;

		for(i = 0; i < trip.routes.length; ++i)
		{
			result = result.add($("<div>").append(system_calls.GetDurationSpellingInHoursAndMinutes(trip.routes[i].duration)));
		}

		return result;
	};

	var	GetMinTripLayovers = function(trip)
	{
		var	min = Number.POSITIVE_INFINITY;
		var	i;

		for(i = 0; i < trip.routes.length; ++i)
		{
			min = Math.min(min, trip.routes[i].segments.length);
		}

		return min;
	};

	var	GetMaxTripLayovers = function(trip)
	{
		var	max = 0;
		var	i;

		for(i = 0; i < trip.routes.length; ++i)
		{
			max = Math.max(max, trip.routes[i].segments.length);
		}

		return max;
	};

	var	isTripLuggageIncluded = function(trip)
	{
		var	result = false;
		var	i;
		var	fare;

		for(i = 0; i < trip.fares.length; ++i)
		{
			fare = trip.fares[i];
			if((fare.is_baggage_included == "Included") && (fare.is_carryon_included == "Included")) result = true;
		}

		return result;
	};

	var	isRouteDepartureTimeInRange = function(route, min_time, max_time)
	{
		var	result = false;
		var	i;
		var	route_time = new Date(route.segments[0].departure_time * 1000);
		var	route_hour = route_time.getHours();

		return (min_time <= route_hour) && (route_hour <= max_time);
	};

	var	isRouteArrivalTimeInRange = function(route, min_time, max_time)
	{
		var	result = false;
		var	i;
		var	route_time = new Date(route.segments[route.segments.length - 1].arrival_time * 1000);
		var	route_hour = route_time.getHours();

		return (min_time <= route_hour) && (route_hour <= max_time);
	};

	var	GetNumberLayovers = function(trip)
	{
		var	result = $();
		var	i;
		var	layovers;
		var	layovers_spelling;

		for(i = 0; i < trip.routes.length; ++i)
		{
			layovers = trip.routes[i].segments.length - 1;

			if(layovers % 10 == 1) layovers_spelling = "пересадка";
			if((layovers % 10 >= 2) && (layovers % 10 <= 4)) layovers_spelling = "пересадки";
			if((layovers % 10 >= 5)) layovers_spelling = "пересадок";

			result = result.add($("<div>").append(layovers ? layovers + " " + layovers_spelling : "прямой"));
		}

		return result;
	};

	var	GetFareItemDescription = function(prefix, value)
	{
		var	result = "";

		if(value)
		{
			if(value == "NotDefined")
			{}
			else if(value == "NotOffered")
			{}
			else if(value == "Included")
			{
				result = prefix + ": <span>включено</span>";
			}
			else if(value == "Charge")
			{
				result = prefix + ": <b>требуется доплата</b>";
			}
			else if(value.length)
			{
				result = prefix + ": " + value;
			}
		}


		return result;
	};

	var	GetFareInfo_DOM = function(fare)
	{
		var	result			= $();

		var	info_row		= $("<div>").addClass("row");
		var	info_col		= $("<div>").addClass("col-xs-12");

		var	buy_row			= $("<div>").addClass("row");
		var	buy_col			= $("<div>").addClass("col-xs-offset-8 col-xs-4 col-md-offset-10 col-md-2");
		var	buy_button		= $("<button>").addClass("btn btn-primary form-control")
										.on("click", function() {
											var	curr_tag = $(this);

											$("#AreYouSureBuyTicket").modal("show");
											$("#AreYouSureBuyTicket .cost").empty().append(curr_tag.closest(".tab-pane").find(".cost").text());
											$("#AreYouSureBuyTicket .fare").empty().append(curr_tag.closest(".container").find("li.nav-tabs.active").text());

											$("#AreYouSureBuyTicket button.submit")
																	.attr("data-search_id", data_global[0].search_id)
																	.attr("data-trip_id", curr_tag.closest(".container").attr("data-flight_id"))
																	.attr("data-fare_id", curr_tag.attr("data-id"));

										});

		var	temp;

		temp = GetFareItemDescription("Возможность изменить время/дату вылета до завершения регистрации", fare.is_ticket_changeable);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Возможность изменить время/дату вылета после завершения регистрации", fare.is_ticket_changeable_after_departure);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Возврат билета до завершения регистрации", fare.is_ticket_refundable);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Возврат билета после завершения регистрации", fare.is_ticket_refundable_after_departure);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Ручная кладь", fare.carryon_places);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Багаж", fare.baggage_places);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Возможность доплаты за багаж в аэропорту", fare.can_buy_baggage);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("WiFI на борту", fare.have_internet_access);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Бизнес зал в аэропорту", fare.is_business_hall_included);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Быстрый корридор", fare.is_priority_registration);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Полетные мили", fare.airline_bonus_information);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Выбор места во время ренистрации", fare.can_registration_seat);
		if(temp.length)	info_col.append($("<li>").append(temp));

		temp = GetFareItemDescription("Возможность повышения тарифа", fare.can_upgrade_rate);
		if(temp.length)	info_col.append($("<li>").append(temp));

		info_col.append("<br>Цена: <div class=\"display_inline cost\">" + fare.price + "</div> руб.");
		buy_button
					.append("Купить")
					.attr("data-id", fare.id);

		buy_col.append(buy_button);

		info_row.append(info_col);
		buy_row.append(buy_col);

		result = result.add(info_row);
		result = result.add(buy_row);

		return result;
	};

	var	GetFareTabs_DOM = function(trip)
	{
		var		result = $();

		var		title_row = $("<div>").addClass("row");
		var		title_col = $("<div>").addClass("col-xs-12");

		var		title_ul = $("<ul>").addClass("nav nav-tabs");
		var		tab_content = $("<div>").addClass("tab-content");

		var		i;

		var		title_href;
		var		title_li;
		var		tab_panel;
		var		id, fare;

		title_row.append(title_col);
		title_col
			.append(title_ul)
			.append(tab_content);

		for(i = 0; i < trip.fares.length; ++i)
		{
			fare			= trip.fares[i];
			title_href		= $("<a>").addClass("__tab_href _tab_order_" + i).append(fare.name || "Тариф");
			title_li		= $("<li>").addClass("nav nav-tabs").append(title_href);
			tab_panel		= $("<div>").addClass("tab-pane fade __tab_pane");


			title_href
				.attr("data-toggle", "tab")
				.attr("data-id", fare.id)
				.attr("href", "[data-flight_id=\"" + trip.id + "\"] .__tab_pane[data-id=\"" + fare.id + "\"]");

			title_li
				.attr("data-id", fare.id)
				// .on("click", Tab_ClickHandler)
				.attr("data-target_elem_class", "__tab_pane");

			title_ul
				.append(title_li);

			tab_panel
				.attr("data-id", fare.id)
				.append(GetFareInfo_DOM(fare));

			tab_content
				.append(tab_panel);
		}

		result = result.add(title_row);

		return	result;
	};

	var	GetAllFlights_DOM = function()
	{
		var	total_number_flights = $("<div>").addClass("row").append(
										$("<div>").addClass("col-xs-12 float_right total_number_flights")
									);

		var	all_flights = $();
		var	trip;
		var	div_image;
		var	div_time_in_flight;
		var	div_duration;
		var	div_stops;
		var	div_price;
		var	div_open;
		var	open_tag;
		var	collapsible_div;
		var	collapsible_top_shadow_div, collapsible_bottom_shadow_div;

		for(var i = 0; i < data_global[0].trips.length; ++i)
		{
			trip = data_global[0].trips[i];

			div_image			= $("<div>").addClass("hidden-xs hidden-sm col-md-1");
			div_time_in_flight	= $("<div>").addClass("col-xs-8 col-md-3");
			div_duration		= $("<div>").addClass("hidden-xs hidden-sm col-md-2");
			div_stops			= $("<div>").addClass("col-xs-4 col-md-2");
			div_price			= $("<div>").addClass("col-xs-offset-4 col-xs-6 col-md-offset-0 col-md-3");
			div_open			= $("<div>").addClass("col-xs-2 col-md-1");

			// --- collapsible / detailed info
			collapsible_div = $("<div>").addClass("collapse out sow")
										.attr("id", "collapsible_trip_" + trip.id)
										.on("show.bs.collapse", TripOpen_ShowHandler)
										.attr("data-trip_id", trip.id);
			collapsible_top_shadow_div = $("<div>").addClass("row collapse-top-shadow margin_bottom_20")
										.append("<p></p>");
			collapsible_bottom_shadow_div = $("<div>").addClass("row collapse-bottom-shadow margin_top_20")
										.append("<p></p>");

			open_tag			= "<i class=\"fa fa-angle-double-down cursor_pointer float_right animate_translateY_onhover\" aria-hidden=\"true\" data-toggle=\"collapse\" data-target=\"#collapsible_trip_" + trip.id + "\"></i>";

			div_image			.append($("<img>").addClass("height_34px").attr("src", "/images/airlines/plane_icon.png"));
			div_time_in_flight	.append(GetTimeInTheAir(trip));
			div_duration		.append(GetTravelDuration(trip));
			div_stops			.append(GetNumberLayovers(trip));
			div_price			.append(GetTripPrice(trip) + " руб.");
			div_open			.append(open_tag);

			collapsible_div
				.append(collapsible_top_shadow_div)
				.append(GetRoutes_DOM(trip.routes))
				.append(GetFareTabs_DOM(trip))
				.append(collapsible_bottom_shadow_div);


			all_flights = all_flights.add(
											$("<div>")	.attr("data-flight_id", trip.id)
														.addClass("container single_block box-shadow--6dp")
														.append(
															$("<div>")	.addClass("row")
																		.append(div_image)
																		.append(div_time_in_flight)
																		.append(div_duration)
																		.append(div_stops)
																		.append(div_price)
																		.append(div_open)
														)
														.append(collapsible_div)
										);
		}

		return all_flights;
	};

	var	GetSegment_DOM = function(segment)
	{
		var	result				= $();
		var	segment_row			= $("<div>").addClass("row");
		var	div_logo 			= $("<div>")
											.addClass("col-xs-1")
											.append("<img class=\"hidden-xs hidden-sm height_34px\" src=\"/images/airlines/plane_icon.png\">")
											.append("<img class=\"height_60px\" src='/images/pages/common/segment_notation.png'>");

		var	div_departure_info	= $("<div>")
											.addClass("col-xs-11");
		var	div_segment_duration = $("<div>")
											.addClass("col-xs-11");
		var	div_arrival_info	= $("<div>")
											.addClass("col-xs-11");
		var	div_airline_info	= $("<div>")
											.addClass("col-xs-offset-1 col-xs-11 grayedout_text form-group");


		div_departure_info
								.append(system_calls.GetFormattedDateFromSeconds(segment.departure_time, "HH:mm") + " ")
								.append(segment.departure_country + " ")
								.append(segment.departure_city.name + " - ")
								.append(segment.departure_airport.name + " (" + segment.departure_airport.id + ") ")
								.append((segment.departure_terminal ? "терминал " + segment.departure_terminal : "") + " ");

		div_segment_duration
								.append("<span class=\"grayedout_text\">перелет " + system_calls.GetDurationSpellingInHoursAndMinutes(segment.arrival_time - segment.departure_time, "HH:mm") + "</span> ");

		div_arrival_info
								.append(system_calls.GetFormattedDateFromSeconds(segment.arrival_time, "HH:mm") + " ")
								.append(segment.arrival_country + " ")
								.append(segment.arrival_city.name + " - ")
								.append(segment.arrival_airport.name + " (" + segment.arrival_airport.id + ") ")
								.append((segment.arrival_terminal ? "терминал " + segment.arrival_terminal : "") + " ");

		div_airline_info
								.append(segment.airline.name + " (" + segment.airline.id + ") " +
										"<i class=\"fa fa-plane\"></i> " + segment.aircraft_name + " " +
										"номер рейса: " + segment.flight_number + ", " +
										"доступно мест: " + segment.available_seats + " "
										);


		segment_row
				.append(div_logo)
				.append(div_departure_info)
				.append(div_segment_duration)
				.append(div_arrival_info)
				.append(div_airline_info)
				;


		result = result.add(segment_row);

		return result;
	};

	var	GetLayover_DOM = function(segment_1, segment_2)
	{
		var	result				= $();

		var	layover_row			= $("<div>")
											.addClass("row form-group");
		var	layover_col			= $("<div>")
											.addClass("col-xs-offset-1 col-xs-6 top_bottom_line font_size_smaller");

		layover_col				.append("пересадка " + system_calls.GetDurationSpellingInHoursAndMinutes(segment_1.change_duration) + " ");

		if(segment_1.arrival_airport.id != segment_2.departure_airport.id)
			layover_col			.append("<span class=\"color_red\"><i class=\"fa fa-exclamation-triangle\" aria-hidden=\"true\"></i> необходим трансфер в другой аэропорт</span> ");

		layover_row 			.append(layover_col);

		if(segment_1.change_duration)
			result = result.add(layover_row);

		return result;
	};

	var	GetSegments_DOM = function(segments)
	{
		var	result = $();
		var	i;

		for(i = 0; i < segments.length; ++i)
		{
			result = result.add(GetSegment_DOM(segments[i]));

			if(i < segments.length - 1)
				result = result.add(GetLayover_DOM(segments[i], segments[i + 1]));
		}

		return result;
	};

	var	GetRoute_DOM = function(route)
	{
		var	result = $();

		var	row_route_info = $("<div>").addClass("row form-group");
		var	col_route_info = $("<div>").addClass("col-xs-12");
		var	content_route_info = 	"Длительность маршрута " + 
									route.segments[0].departure_city.name + 
									" - " + 
									route.segments[route.segments.length - 1].arrival_city.name + 
									" " + 
									system_calls.GetDurationSpellingInHoursAndMinutes(route.duration);

		col_route_info.append(content_route_info);
		row_route_info.append(col_route_info);

		result = result
					.add(row_route_info)
					.add(GetSegments_DOM(route.segments));


		return result;
	};

	var	GetRoutes_DOM = function(routes)
	{
		var		result = $();

		if(routes)
		{
			routes.forEach(function(route)
				{
					result = result.add(GetRoute_DOM(route));
				});
		}
		else
		{
			console.error("routes array is undefined");
		}

		return result;
	};

	var	TripOpen_ShowHandler = function(e)
	{
		var		currTag = $(this);
		var		sow_id = "" + currTag.data("sow_id");

		console.debug("click           " + Math.random());
	};
	
	var	ApplyFlightFilters = function()
	{
		var	display_items = [];

		if(data_global)
		{
			var all_items = system_calls.FillArrayWithNumbers(data_global[0].trips.length);
			var	filter_1;
			var	filter_2;
			var	filter_3;
			var	filter_4;
			var	filter_5;
			var	filter_6;
			var	filter_7;
			var	filter_8;

			filter_1 = all_items.filter(function(idx) { return (min_price_global <= data_global[0].trips[idx].price) && (data_global[0].trips[idx].price <= max_price_global); });
			filter_2 = filter_1.filter(function(idx) { return (duration_global >= GetTripDuration(data_global[0].trips[idx])); });
			filter_3 = filter_2.filter(function(idx) { return (layover_global === 0) || (layover_global >= GetMaxTripLayovers(data_global[0].trips[idx])); });
			filter_4 = filter_3.filter(function(idx) { return (luggage_global === 0) || isTripLuggageIncluded(data_global[0].trips[idx]); });
			filter_5 = filter_4.filter(function(idx) { return isRouteDepartureTimeInRange(data_global[0].trips[idx].routes[0], min_takeoff_time_flight1_global, max_takeoff_time_flight1_global); });
			filter_6 = filter_5.filter(function(idx) { return isRouteArrivalTimeInRange(data_global[0].trips[idx].routes[0], min_landing_time_flight1_global, max_landing_time_flight1_global); });

			if($("#flight_direction").val() == "one-way")
			{
				display_items = filter_6;
			}
			else
			{
				filter_7 = filter_6.filter(function(idx) { return isRouteDepartureTimeInRange(data_global[0].trips[idx].routes[1], min_takeoff_time_flight2_global, max_takeoff_time_flight2_global); });
				filter_8 = filter_7.filter(function(idx) { return isRouteArrivalTimeInRange(data_global[0].trips[idx].routes[1], min_landing_time_flight2_global, max_landing_time_flight2_global); });
				display_items = filter_8;
			}
		}

		return display_items;
	};

	var	FilterDisplayedFlights = function()
	{
		if(data_global)
		{
			var all_items = system_calls.FillArrayWithNumbers(data_global[0].trips.length);
			var	display_items = ApplyFlightFilters();
			var	hide_items = all_items.filter(function(idx) { return !display_items.includes(idx); });
			var display_selector = "";
			var hide_selector = "";
			var	i;

			// --- display items
			for (i = 0; i < display_items.length; ++i) {
				if(i) display_selector += ",";
				display_selector += "div.container[data-flight_id='" + data_global[0].trips[display_items[i]].id + "']:hidden";
				// temp = $("div.container[data-flight_id='" + data_global[0].trips[i].id + "']");
				// if(temp.is(":hidden")) temp.show(100);
			}

			// --- hide items
			for (i = 0; i < hide_items.length; ++i) {
				if(i) hide_selector += ",";
				hide_selector += "div.container[data-flight_id='" + data_global[0].trips[hide_items[i]].id + "']:visible";
				// temp = $("div.container[data-flight_id='" + data_global[0].trips[i].id + "']");
				// if(temp.is(":visible")) temp.hide(100);
			}

			$(display_selector).show(100);
			$(hide_selector).hide(100);

			UpdateDisplayedFlightsNumber(display_items.length);
		}
	};

	var	ShowLoadingSplash = function()
	{
		$("#loading_splash").show(200);
	};

	var	HideLoadingSplash = function()
	{
		$("#loading_splash").hide(200);
	};

	var	UpdateDisplayedFlightsNumber = function(number_of_flights)
	{
		var	temp = "";

		$(".number_of_flights").empty();

		if(number_of_flights)
		{
			temp += "Найдено " + number_of_flights + " ";

			if(number_of_flights % 10 == 1) temp += "перелет";
			else if((number_of_flights % 10 >= 2) && (number_of_flights % 10 <= 4)) temp += "перелета";
			else temp += "перелетов";

			$(".number_of_flights").append(temp);
		}
	};

	var	ApplyConvenientFilter = function(option)
	{
		if(option == 1)
		{
			$("#layover_radios2").click();
			$("#luggage_radios2").click();

			$("#times_flight1_dialog .slider_1").slider("values", [9, 21]);
			$("#times_flight1_dialog .slider_2").slider("values", [9, 21]);

			$("#times_flight2_dialog .slider_1").slider("values", [9, 21]);
			$("#times_flight2_dialog .slider_2").slider("values", [9, 21]);
		}
		else if(option == 2)
		{
			$("#layover_radios3").click();
			$("#luggage_radios2").click();

			$("#times_flight1_dialog .slider_1").slider("values", [9, 21]);
			$("#times_flight1_dialog .slider_2").slider("values", [9, 21]);

			$("#times_flight2_dialog .slider_1").slider("values", [9, 21]);
			$("#times_flight2_dialog .slider_2").slider("values", [9, 21]);
		}



	};

	var	ResetConvenientFilter = function()
	{
		$("#layover_radios1").click();
		$("#luggage_radios1").click();
		
		$("#times_flight1_dialog .slider_1").slider("values", [0, 24]);
		$("#times_flight1_dialog .slider_2").slider("values", [0, 24]);

		$("#times_flight2_dialog .slider_1").slider("values", [0, 24]);
		$("#times_flight2_dialog .slider_2").slider("values", [0, 24]);
	};

	var	UpdateButton_NumberOfConvenientFlights = function()
	{
		var	convenient_flights;

		if(data_global && data_global[0].trips.length)
		{
			convenient_flights = ApplyFlightFilters(ApplyConvenientFilter(1));
			if(convenient_flights.length)
			{
				$(".convenient_flight button").show(200).attr("data-option", 1);
				$(".convenient_flight button span").empty().append(convenient_flights.length);
			}
			else
			{
				convenient_flights = ApplyFlightFilters(ApplyConvenientFilter(2));
				if(convenient_flights.length)
				{
					$(".convenient_flight button").show(200).attr("data-option", 2);
					$(".convenient_flight button span").empty().append(convenient_flights.length);
				}
				else
				{
					$(".convenient_flight button").hide(200);
				}
			}

			ResetConvenientFilter();
		}
		else
		{
			$(".convenient_flight button")
											.hide(200)
											.removeClass("btn-primary")
											.addClass("btn-default");
		}
	};

	var	GetMinPrice = function()
	{
		var	min_price = Number.POSITIVE_INFINITY;

		for(var i = 0; i < data_global[0].trips.length; ++i)
		{
			min_price = Math.min(min_price, GetTripPrice(data_global[0].trips[i]));
		}

		return min_price;
	};

	var	GetMaxPrice = function()
	{
		var	max_price = 0;

		for(var i = 0; i < data_global[0].trips.length; ++i)
		{
			max_price = Math.max(max_price, GetTripPrice(data_global[0].trips[i]));
		}

		return max_price;
	};

	var	GetMaxDuration = function()
	{
		var	max_duration = 0;

		for(var i = 0; i < data_global[0].trips.length; ++i)
		{
			max_duration = Math.max(max_duration, GetTripDuration(data_global[0].trips[i]));
		}

		return max_duration;
	};

	var	GetMinDuration = function()
	{
		var	min_duration = Number.POSITIVE_INFINITY;

		for(var i = 0; i < data_global[0].trips.length; ++i)
		{
			min_duration = Math.min(min_duration, GetTripDuration(data_global[0].trips[i]));
		}

		return min_duration;
	};

	var	InitPriceFilter = function()
	{
		min_price_global = GetMinPrice();
		max_price_global = GetMaxPrice();

		$("#price_dialog .slider")
							.slider("option", "min", min_price_global)
							.slider("option", "max", max_price_global)
							.slider("option", "values", [min_price_global, max_price_global]);

		$("#price_dialog .label_1").empty().append(min_price_global);
		$("#price_dialog .label_2").empty().append(max_price_global);

	};

	var	InitDurationFilter = function()
	{
		duration_global = GetMaxDuration();

		$("#duration_dialog .slider")
							.slider("option", "min", GetMinDuration())
							.slider("option", "max", duration_global)
							.slider("option", "value", duration_global);

		$("#duration_dialog .label_1").empty().append(duration_global);

	};

	var	InitFilters = function()
	{
		if(data_global[0].trips.length)
		{
			InitPriceFilter();
			InitDurationFilter();
		}
	};

	var NewSearch = function()
	{
		$("#sowSelector").prop("disabled", "disabled"); // --- this helps to avoid search with 1 SoW and purchase with another.

		setTimeout(function() { ShowLoadingSplash(); }, 250); // --- hold back splash screen in case current ajax-request should be canceled
															  // --- 1) next line will cancel current request
															  // --- 2) always-handler - will hide current splash screen
															  // --- 3) new splash should be run after (2)

		if(curr_request_global) curr_request_global.abort();



		curr_request_global = $.getJSON(
			"/cgi-bin/subcontractor.cgi", BuildSearchQuery())
			.done(function(data) {
				if(data.result == "success")
				{
					data_global = data.flights;

					$("#flights").append(GetAllFlights_DOM());
					InitFilters();
					UpdateDisplayedFlightsNumber(data.flights[0].trips.length);
					UpdateButton_NumberOfConvenientFlights();
				}
				else
				{
					system_calls.PopoverError("flights", "Ошибка: " + data.description);
				}

			})
			.fail(function(data) {
				// --- if current request will be canceled with .abort, then JS couldn't parse server-response
				// --- to avoid alarming error - comment it
				// system_calls.PopoverError("flights", "Ошибка ответа сервера");
			})
			.always(function() {
				HideLoadingSplash();
			});

	};

	var	HoldbackUpdateTicketSearch = function()
	{
		// --- holdback update. This will help to avoid a lot of updates while dragging slider
		++semaphore_global;
		setTimeout(function() {
								if(--semaphore_global <= 0)
								{
									FilterDisplayedFlights();
								}
							}, 500);
	};

	var	UpdateTicketSearch = function(e)
	{
		if(CheckValidity())
		{
			ResetFlights();

			NewSearch();
		}
	};

	var	BuyTicket_ClickHandler = function()
	{
		var	curr_tag = $(this);

		curr_tag.button("loading");

		curr_request_global = $.getJSON(
			"/cgi-bin/subcontractor.cgi",
			{
				action: "AJAX_purchaseAirTicket",
				sow_id: $("#sowSelector").val(),
				passport_type: $("#passport_type").val(),
				search_id: curr_tag.attr("data-search_id"),
				trip_id: curr_tag.attr("data-trip_id"),
				fare_id: curr_tag.attr("data-fare_id"),
			}
			)
			.done(function(data) {
				if(data.result == "success")
				{
					curr_tag.closest(".modal").modal("hide");

					setTimeout(function() {
						window.location.href = "/cgi-bin/subcontractor.cgi?action=subcontractor_travel_list_template&rand=" + (Math.random() * 4876234923498);
					}, 200);
				}
				else
				{
					system_calls.PopoverError(curr_tag.parent(), "Ошибка: " + data.description);
				}

			})
			.fail(function(data) {
				system_calls.PopoverError(curr_tag.parent(), "Ошибка ответа сервера");
			})
			.always(function() {
				setTimeout(function() { curr_tag.button("reset"); }, 200);
			});

	};

	return {
		Init: Init,
	};

})();
