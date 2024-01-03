// "searchContact": {
// 	"schema": {
// 		"method": "GET",
// 			"host": "<%= iparam.domain %>.freshdesk.com",
// 				"path": "/api/v2/search/contacts",
// 					"headers": {
// 			"Authorization": "Basic <%= encode(iparam.api_key) %>",
// 				"Content-Type": "application/json"
// 		},
// 		"query": {
// 			"query": "<%= context.query %>"
// 		}
// 	}
// }

// "getTicket": {
// 	"schema": {
// 		"method": "GET",
// 			"host": "<%= iparam.domain %>.freshdesk.com",
// 				"path": "/api/v2/tickets/<%= context.id %>",
// 					"headers": {
// 			"Authorization": "Basic <%= encode(iparam.api_key) %>",
// 				"Content-Type": "application/json"
// 		}
// 	}
// }

const iparam = {
	domain: {
		"display_name": "Domain",
		"description": "FreshDesk Domain",
		"type": "domain",
		"required": true,
		"type_attributes": {
			"product": "freshdesk"
		}
	},
	api_key: {
		"display_name": "API Key",
		"description": "FreshDesk API Key",
		"type": "api_key",
		"required": true,
		"secure": true,
		"type_attributes": {
			"product": "freshdesk"
		}
	}
}

export const searchContact = async (): Promise<any> => {
	const apiUrl = `https://${iparam.domain}.freshdesk.com/api/v2/search/contacts`;
	const authHeader = `Basic ${iparam.api_key}`;
	try {
		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				Authorization: authHeader,
				"Content-Type": "application/json",
			},
		}
		);
		return response.json();
	} catch (error) {
		console.error("Error searching contacts:", error);
		throw error;
	}
};

export const getTicket = async (contextid: any): Promise<any> => {
	const apiUrl = `https://${iparam.domain}.freshdesk.com/api/v2/tickets/${contextid}`;
	const authHeader = `Basic ${iparam.api_key}`;
	try {
		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				Authorization: authHeader,
				"Content-Type": "application/json",
			},
		}
		);
		return response.json();
	} catch (error) {
		console.error("Error searching contacts:", error);
		throw error;
	}
};
