/*jslint devel: true, indent: 4, maxerr: 50, esversion: 6*/

var	agency_bt_cost_prediction = agency_bt_cost_prediction || {};

var	agency_bt_cost_prediction = (function()
{
	'use strict';

	var	data_global;
	var	last_month_bt_global;
	var	this_month_bt_global;
	var	last_month_timestamp_global;
	var	this_month_timestamp_global;

	var	Init = function()
	{
	};

	var SetLastMonthBTs = function(param) { last_month_bt_global = param; };
	var SetThisMonthBTs = function(param) { this_month_bt_global = param; };
	var SetLastMonthDate = function(param) { last_month_timestamp_global = param; };
	var SetThisMonthDate = function(param) { this_month_timestamp_global = param; };

	var	SumOverBTs = function(bt_list)
	{
		var		result = 0;

		bt_list.forEach(function(bt)
		{
			bt.expenses.forEach(function(expense)
			{
				result += parseFloat(expense.price_domestic);
			})
		});

		return result;
	};

	var	Predict = function()
	{
		var	last_month_cost;
		var	this_month_cost;

		if(
			last_month_bt_global	&&
			this_month_bt_global
			)
		{
			last_month_cost					= SumOverBTs(last_month_bt_global);
			this_month_cost					= SumOverBTs(this_month_bt_global);


			console.debug("1");
		}
		else
		{
			console.error("mandatory parameters missed");
		}

		return {
					last_month_date:		last_month_timestamp_global,
					this_month_date:		this_month_timestamp_global,
					last_month_cost:		last_month_cost,
					this_month_cost:		this_month_cost,
				};
	};

	return {
		Init: Init,
		SetLastMonthDate: SetLastMonthDate,
		SetThisMonthDate: SetThisMonthDate,
		SetLastMonthBTs: SetLastMonthBTs,
		SetThisMonthBTs: SetThisMonthBTs,
		Predict: Predict,
	};

})();
