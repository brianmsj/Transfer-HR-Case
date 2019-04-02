var serviceCategories = JSON.parse(services);

var sanitizeDisplay = function(text) {
	return $j("<div>").text(text).html();
};

// Service input select2
var localPageSize = 50;
$j("#service_input").select2({
	// Use AJAX functions for local pagination
	allowClear: true,
	ajax: {
		quietMillis: 250,
		data: function(searchTerm, page) {
			return {
				term: searchTerm,
				page: page-1
			};
		},
		transport: function(response) {
			var q = response.data;
			var results = [];

			var total = -1;
			var start = q.page * localPageSize;
			var end = (q.page + 1) * localPageSize;

			for (var i = 0; i < serviceCategories.length; i++) {
				var children = serviceCategories[i].children.filter(function(opt) {
					var matched = !q.term || opt.display.toLowerCase().indexOf(q.term.toLowerCase()) >= 0 || (opt.parent && opt.parent.toLowerCase().indexOf(q.term.toLowerCase()) >= 0);
					if (matched) {
						total++;
						if (total >= start && total < end) // Option within page bounds
							return matched;

						return false;
					}
					return false;
				});

				if (children.length > 0) {
					results.push({
						display: serviceCategories[i].display,
						children: children
					});
				}
			}

			response.success.apply(this, [{
				results: results,
				more: total > end
			}]);

			return true;
		},
		// Specify how data returned should be processed.
		results: function(response, page) {
			return response;
		}
	},
	formatSelection: function(item) {
		return sanitizeDisplay(item.display);
	},
	formatResult: function(item) {
		return sanitizeDisplay(item.display);
	},
	id: function(item) {
		return item.sys_id;
	},
	initSelection: function (element, callback) {
		var serviceFormId = 'sys_display.' + g_form.getTableName() + '.hr_service';
		var displayValue = g_form.getElement(serviceFormId).value;
		callback(
				{
					sys_id : g_form.getValue('hrService'),
					display: displayValue
				}
			);
	},
	placeholder: sanitizeDisplay('${gs.getMessage("Select a service")}')
});

$j("#service_input").val(g_form.getValue("hr_service")).trigger('change');

function submitCancel() {
	GlideDialogWindow.get().destroy();
	return false;
}

var submittedTransfer = false;
function submitOk() {
	if (submittedTransfer)
		return false;
	submittedTransfer = true;
	$j("#selected_service").val($j("#service_input").select2('val'));
	return true;
}
