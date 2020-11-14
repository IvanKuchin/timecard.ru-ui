login_page_1 = (function()
{
	"use strict";

	var Init = function()
	{
		// --- demo order
		$("#OrderADemo .submit")	.on("click", RequestDemo);
	};

	// --- demo part
	var	RequestDemo = function(e)
	{
		var		curr_tag = $(this);
		var		modal = $("#OrderADemo");

		if(modal.find(".demo_name").val().length)
		{
			if(modal.find(".demo_contact").val().length)
			{
				if(modal.find("[type='checkbox']").is(":checked"))
				{
					curr_tag.button("loading");


					$.getJSON("/cgi-bin/index.cgi?action=AJAX_demoRequest", {name: modal.find(".demo_name").val(), contact: modal.find(".demo_contact").val()})
					.done(function(data)
						{
							if(data.result == "success")
							{
								$("#OrderADemo").modal("hide");
								setTimeout(function() { $("#DemoConfirmation").modal("show"); }, 200);
							}
							else
							{
								system_calls.PopoverError(curr_tag, data.description, "bottom");
							} // --- if(data.status == "success")
						})
					.fail(function(data)
						{
							setTimeout(function() {
								system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
							}, 50);
						})
					.always(function()
						{
							curr_tag.button("reset");
						});
				}
				else
				{
					system_calls.PopoverError(curr_tag, "Пока демо доступно только агенствам");
				}
			}
			else
			{
				system_calls.PopoverError(modal.find(".demo_contact"), "Введите контакную информацию");
			}
		}
		else
		{
			system_calls.PopoverError(modal.find(".demo_name"), "Введите имя");
		}

	};

	return {
		Init: Init
	};
})();

