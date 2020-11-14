/*jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/

var	agency_service_cost_prediction = agency_service_cost_prediction || {};

var	agency_service_cost_prediction = (function()
{
	"use strict";

	var	data_global;
	var	last_month_timecards_global;
	var	last_month_sow_global;
	var	this_month_sow_global;
	var	holiday_calendar_global;
	var	last_month_timestamp_global;
	var	this_month_timestamp_global;

	var	Init = function()
	{
	};

	var SetLastMonthSoW = function(param) { last_month_sow_global = param; };
	var SetThisMonthSoW = function(param) { this_month_sow_global = param; };
	var SetLastMonthTimecards = function(param) { last_month_timecards_global = param; };
	var SetHolidayCalendar = function(param) { holiday_calendar_global = param; };
	var SetLastMonthDate = function(param) { last_month_timestamp_global = param; };
	var SetThisMonthDate = function(param) { this_month_timestamp_global = param; };

	var	GetTimecardPayments = function(timecards, sow_list)
	{
		var	result					= [];

		if(timecards && timecards.length)
		{
/*
			var	date_in_month_arr		= timecards[0].period_end.split(/\-/);
			var	date_in_month			= new Date(date_in_month_arr[0], date_in_month_arr[1] - 1, date_in_month_arr[2]);
			var	first_month_date		= new Date(date_in_month.getFullYear(), date_in_month.getMonth(), date_in_month.getDate(), 0, 0, 0);
			var	last_month_date			= new Date(date_in_month.getFullYear(), date_in_month.getMonth() + 1, date_in_month.getDate() - 1, 23, 59, 59);
			var	total_work_hours		= system_calls.GetTotalNumberOfWorkingHours(first_month_date.getTime(), last_month_date.getTime(), holiday_calendar_global);
*/
			timecards.forEach(function(timecard)
			{
				// var		actual_work_hours 		= system_calls.GetSumHoursFromTimecard(timecard);
				var		day_rate				= parseFloat(timecard.contract_sow[0].day_rate);

				var		hours_statistics_obj	= system_calls.GetHoursStatistics(timecard, holiday_calendar_global);
				var		total_work_hours		= hours_statistics_obj.total_work_hours;
				var		actual_work_hours		= hours_statistics_obj.actual_work_hours;
				var		actual_work_days		= hours_statistics_obj.actual_work_days;


				result.push({
								sow_id:					timecard.contract_sow[0].id,
								day_rate:				day_rate,
								actual_work_hours:		actual_work_hours,
								total_work_hours:		total_work_hours,
							});

			});
		}


		return result;
	};

	var	GetLastMonthSum = function(payments)
	{
		var	result = 0;

		payments.forEach(function(payment)
		{
			var	hour_rate		= system_calls.RoundedTwoDigitDiv(payment.day_rate, 8);
			var	period_payment	= system_calls.RoundedTwoDigitMul(payment.actual_work_hours, hour_rate);

			result += period_payment;
		});

		return result;
	};

	var	GetPaymentBySowID = function(sow_id, last_month_payments)
	{
		var	result;

		for(var i in last_month_payments)
		{
			if(last_month_payments[i].sow_id == sow_id)
			{
				result = last_month_payments[i];
				break;
			}
		}

		return result;
	};

	var	GetThisMonthSum = function(last_month_payments, this_month_sow)
	{
		var	result					= {min:0, max:0};
		var	date_today				= new Date();
		var	first_month_date		= new Date(date_today.getFullYear(), date_today.getMonth(), date_today.getDate(), 0, 0, 0);
		var	last_month_date			= new Date(date_today.getFullYear(), date_today.getMonth() + 1, date_today.getDate() - 1, 23, 59, 59);

		this_month_sow.forEach(function(sow)
		{
			var	sow_start_ts		= system_calls.ConvertDateSQLToSec(sow.start_date) * 1000;
			var	sow_end_ts			= system_calls.ConvertDateSQLToSec(sow.end_date) * 1000;
			var	total_work_hours	= system_calls.GetTotalNumberOfWorkingHours(Math.max(first_month_date.getTime(), sow_start_ts), Math.min(last_month_date.getTime(), sow_end_ts), holiday_calendar_global);

			var	last_month_payment	= GetPaymentBySowID(sow.id, last_month_payments);
			var	min_percentage		= last_month_payment ? Math.min(last_month_payment.actual_work_hours / last_month_payment.total_work_hours, 1) : 1;
			var	max_percentage		= last_month_payment ? Math.max(last_month_payment.actual_work_hours / last_month_payment.total_work_hours, 1) : 1;
			var	hour_rate			= system_calls.RoundedTwoDigitDiv(sow.day_rate, 8);

			result.min += hour_rate * min_percentage * total_work_hours;
			result.max += hour_rate * max_percentage * total_work_hours;
		});

		return result;
	};

	var	Predict = function()
	{
		var	last_month_timecards_payments;
		var	last_month_cost;
		var	this_month_cost;

		if(
			last_month_timecards_global	&&
			last_month_sow_global		&&
			this_month_sow_global		&&
			holiday_calendar_global
			)
		{
			last_month_timecards_payments	= GetTimecardPayments(last_month_timecards_global, last_month_sow_global);
			last_month_cost					= GetLastMonthSum(last_month_timecards_payments);
			this_month_cost					= GetThisMonthSum(last_month_timecards_payments, this_month_sow_global);
		}
		else
		{
			console.error("mandatory parameters missed");
		}

		return {
					last_month_date:		last_month_timestamp_global,
					this_month_date:		this_month_timestamp_global,
					last_month_cost:		last_month_cost,
					this_month_cost_min:	this_month_cost.min,
					this_month_cost_max:	this_month_cost.max,
				};
	};

	return {
		Init: Init,
		SetLastMonthDate: SetLastMonthDate,
		SetThisMonthDate: SetThisMonthDate,
		SetLastMonthSoW: SetLastMonthSoW,
		SetThisMonthSoW: SetThisMonthSoW,
		SetLastMonthTimecards: SetLastMonthTimecards,
		SetHolidayCalendar: SetHolidayCalendar,
		Predict: Predict,
	};

})();
