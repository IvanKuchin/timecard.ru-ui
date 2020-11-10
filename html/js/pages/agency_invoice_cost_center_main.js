var	agency_invoice_cost_center_main = agency_invoice_cost_center_main || {};

var	agency_invoice_cost_center_main = (function()
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	cost_center_service_obj_global;
	var	cost_center_service_list_obj_global;
	var	cost_center_bt_obj_global;
	var	cost_center_bt_list_obj_global;

	var	Init = function()
	{
		GetCostCenterListFromServer();
	};

	var	GetCostCenterListFromServer = function()
	{
		var		curr_tag = $("#select_service_for_invoicing");

		if(curr_tag.empty())
		{
			$.getJSON(
				'/cgi-bin/agency.cgi',
				{
					action: "AJAX_getCostCenterList",
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						if((typeof(data) != "undefined") && (typeof(data.cost_centers) != "undefined"))
						{
							cost_center_service_obj_global = new agency_invoice_cost_center_service();
							cost_center_service_obj_global.Init(data.cost_centers);
							cost_center_service_obj_global.SetSubmit_Callback(ServiceInvoiceSubmit_Callback);

							cost_center_service_list_obj_global = new agency_invoice_cost_center_service_list();
							cost_center_service_list_obj_global.Init(data.cost_centers);

							cost_center_bt_obj_global = new agency_invoice_cost_center_bt();
							cost_center_bt_obj_global.Init(data.cost_centers);
							cost_center_bt_obj_global.SetSubmit_Callback(BTInvoiceSubmit_Callback);

							cost_center_bt_list_obj_global = new agency_invoice_cost_center_bt_list();
							cost_center_bt_list_obj_global.Init(data.cost_centers);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в объекте cost_centers");
						}
					}
					else
					{
						console.error("AJAX_getPSoWInvoicesList.done(): ERROR: " + data.description);
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					setTimeout(function() {
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					}, 500);
				});
		}
	};

	var	ServiceInvoiceSubmit_Callback = function(invoice_id)
	{
		if(cost_center_service_list_obj_global)
		{
			cost_center_service_list_obj_global.UpdateAndHighlightServiceInvoice(invoice_id);
		}
	}

	var	BTInvoiceSubmit_Callback = function(invoice_id)
	{
		if(cost_center_bt_list_obj_global)
		{
			cost_center_bt_list_obj_global.UpdateAndHighlightBTInvoice(invoice_id);
		}
	}

	return {
		Init: Init,
	};

})();
