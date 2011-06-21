/*
 * Basecamp Widget Scripts
 *
 * Author: Lachlan Laycock (kennedia.com)
 * Date: 11 June 2006
 *
 *====================================*/

//
// Helper Functions
//

//
// Config and Init
//
var projectCompanies =  {};
var url					= "";
var user				= "";
var pass				= "";
var refresh		= "";
var encoded_pwd			= "";
var body				= "";
var scroll_bar	= null;
var scroll_area	= null;
var info_button = null;
var done_button = null;
var url_format = new RegExp("^(http://|https://)?([A-Za-z0-9.]*)/?$");
var resize_inset;

var project_selector	= "project_selector";
var project_id				= null;
var task_list_id			= null;
var message_cat_id		= null;
var company_id				= null;

var Basecamp = Class.create();
Basecamp.prototype = {

	// Give each request a copy of it's own ajax_options
	tabs : $H({ 
		contacts	: Basecamp.get_contacts,
		posts		: Basecamp.get_messages,
		milestones	: Basecamp.get_milestones, 
		projects	: Basecamp.get_projects, 
		todos		: Basecamp.get_todos
	}),
	

	start : function() {
		if(window.widget) {
			url		= (typeof(widget.preferenceForKey('url')) != "undefined") ? widget.preferenceForKey('url') : $F('url');
			user	= (typeof(widget.preferenceForKey('username')) != "undefined") ? widget.preferenceForKey('username') : $F('username');
			pass	= (typeof(widget.preferenceForKey('pass')) != "undefined") ? widget.preferenceForKey('pass') : $F('pass');
			refresh	= (typeof(widget.preferenceForKey('refresh')) != "undefined") ? widget.preferenceForKey('refresh') : $F('refresh');
		} else {
			url		= $F('url');
			user	= $F('username');
			pass	= $F('pass');
			refresh	= $F('refresh');
		}
		
		// Set Pref fields
		$('url').value		= url.replace(url_format, "$2");
		$('username').value	= user;
		$('password').value	= pass;
		$('refresh').value	= refresh;
		
		$('api_error').hide();
		
		project_id = $('projects').value;
		body = $('content');
		
		if(url.length > 0 && user.length > 0 && pass.length > 0 && refresh.length > 0) {
			// Set Password in Headers
			encoded_pwd = this.encode64(user+":"+pass);
			this.disableTabs();
			this.get_projects();
		} else {
			this.showPrefs();
		}
	},
	
	//
	// Content Retrevial and Handling
	//
	
	//
	// Contacts
	//	
	get_contacts : function() {
		project_id = $F('projects');
		company_id = projectCompanies[project_id];
		req_url = url + "/projects/" + project_id + "/contacts/people/" + company_id;
		this.request(req_url, this.show_contacts);
	},

	show_contacts : function(req) {
		this.buildContent(req, "person", 'contacts', function(contact){

			contact_id = contact.getElementsByTagName("id")[0].firstChild.data;
			user_name = contact.getElementsByTagName("user-name")[0].firstChild.data;
			first_name = contact.getElementsByTagName("first-name")[0].firstChild.data;
			last_name = contact.getElementsByTagName("last-name")[0].firstChild.data;

			var li = document.createElement("li");
			ol.appendChild(li);
			ol.setAttribute("class", "contacts");

			var src = url+"/avatars/fashioncache/"+user_name+"_icon.jpg";
			var img = document.createElement("img");
			img.setAttribute("alt", " ");
			var icon = new Image();
			icon.onload = function() { 
				if(icon.complete) img.src = src; 
			}
			icon.src = src;
			
			li.appendChild(img);

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.setAttribute("onclick", "widget.openURL('"+url+"/projects/"+project_id+"/contacts/person/"+contact_id+"')");
			a.setAttribute("title", "Go to Basecamp");
			a.innerHTML = first_name + " " + last_name;
			li.appendChild(a);

		});
	},

	//
	// Messages
	//	
	get_messages : function() {
		project_id = $('projects').value;
		req_url = url + "/projects/" + project_id + "/msg/archive";
		this.request(req_url, this.show_messages);
	},

	show_messages : function(req) {
		if (req == null) return false;
		this.buildContent(req, "post", 'messages', function(message){
			var li = document.createElement("li");
			li.setAttribute("class", "drilldown");
			ol.appendChild(li);
			post_id = message.getChildDataByTagName("id");
			title = message.getChildDataByTagName("title");

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.setAttribute("post_id", post_id);
			a.onclick = Basecamp.get_message_item;

			// External Links
			// a.setAttribute("onclick", "widget.openURL('"+url+"/projects/"+project_id+"/msg/all/"+post_id+"/comments')");
			// a.setAttribute("title", "Go to Basecamp");

			a.innerHTML = title;
			li.appendChild(a);
		});
	},
	
	get_message_item : function(req) {
		var element = Event.element(event)
		post_id = (element) ? element.getAttribute('post_id') : ((window.widget) ? widget.preferenceForKey('post_id') : null);

		req_url = url + "/msg/get/" + post_id;
		Basecamp.request(req_url, Basecamp.show_message_item);
		
		// Undo force_refresh flag if on
		if (widget && widget.preferenceForKey('force_refresh')) widget.setPreferenceForKey(false, 'force_refresh');

	},

	show_message_item : function(req) {
		if (req == null) return false;
		this.buildContent(req, "post", 'messages', function(message){

			// Extract data from response
			body = message.getChildDataByTagName("display-body");
			title = message.getChildDataByTagName("title");
			comments_count = message.getChildDataByTagName("comments-count");
			post_date = message.getChildDataByTagName("posted-on");
			author = message.getChildDataByTagName("author-id");
			
			// Post Title
			var li = document.createElement("li");
			ol.appendChild(li);
			li.setAttribute("class", "post_title");
			var a = document.createElement("a");
			a.innerHTML = title;
			a.setAttribute("onclick", "widget.openURL('"+url+"/projects/"+project_id+"/msg/all/"+post_id+"/comments')");
			a.setAttribute("href", "#");
			a.setAttribute("title", "Go to Basecamp");
			li.appendChild(a);
			
			// Post date and author
			var li = document.createElement("li");
			ol.appendChild(li);
			li.setAttribute("class", "post_date");
			li.innerHTML = post_date;
			
			//var li = document.createElement("li");
			//ol.appendChild(li);
			//li.setAttribute("class", "post_user");
			//li.innerHTML = author;

			// Post Body
			var li = document.createElement("li");
			ol.appendChild(li);
			li.setAttribute("class", "post_body");
			li.innerHTML = body
			
			// Retrieve Comments if available
			if (comments_count > 0 ) {
				this.get_comments(post_id)
			}
		
		});
	},
	
	
	//
	// Comments
	//
	get_comments : function(post_id) {
		req_url = url + "/msg/comments/"+post_id;
		this.request(req_url, this.show_comments);
	},

	show_comments : function(req) {
	},
	
	
	//
	// Milestones
	//	
	get_milestones : function(req) {
		project_id = $('projects').value;
		if (project_id > 0) {
			req_url = url + "/projects/"+project_id+"/milestones/list";
			this.request(req_url, this.show_milestones);

			// Undo force_refresh flag if on
			if (widget && widget.preferenceForKey('force_refresh')) widget.setPreferenceForKey(false, 'force_refresh');
		}
	},
	
	show_milestones : function(req) {
		var upcoming_displayed = false;
		var completed_displayed = false;
		
		this.buildContent(req, "milestone", 'milestones', function(milestone){
			var milestone_id = milestone.getChildDataByTagName("id");
			var title = milestone.getChildDataByTagName("title");
			var completed = (milestone.getChildDataByTagName("completed") == "true") ? true : false;

			// Is this the first completed
			if(!upcoming_displayed && !completed) {
				var li_upcoming = document.createElement("li");
				li_upcoming.setAttribute("class", "upcoming");
				li_upcoming.innerHTML = "Upcoming";
				ol.appendChild(li_upcoming);
				upcoming_displayed = true
			}

			// Is this the first completed
			if(!completed_displayed && completed) {
				var li_completed = document.createElement("li");
				li_completed.setAttribute("class", "completed");
				li_completed.innerHTML = "Completed";
				ol.appendChild(li_completed);
				completed_displayed = true
			}
			
			var li = document.createElement("li");
			ol.appendChild(li);
			
			// Add complete/uncomplete checkbox
			var checkbox = document.createElement("input");
			checkbox.value = milestone_id;
			checkbox.setAttribute("type", "checkbox");
			checkbox.setAttribute("id", "milestone_"+milestone_id);
			checkbox.checked = completed;
			checkbox.onclick = completed ? Basecamp.uncomplete_milstone : Basecamp.complete_milstone;
			li.appendChild(checkbox);

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.setAttribute("onclick", "widget.openURL('"+url+"/projects/"+project_id+"/milestones')");
			a.setAttribute("title", "Go to Basecamp");
			a.innerHTML = title;
			li.appendChild(a);
		});
	},
	
	complete_milstone : function(event) {
		milestone_id = Event.element(event).value;
		if (milestone_id > 0) {
			req_url = url + "/milestones/complete/"+milestone_id;
			if (window.widget) widget.setPreferenceForKey(true, 'force_refresh');
			Basecamp.request(req_url, Basecamp.get_milestones);
		}
	},

	uncomplete_milstone : function(event) {
		milestone_id = Event.element(event).value;
		if (milestone_id > 0) {
			req_url = url + "/milestones/uncomplete/"+milestone_id;
			if (window.widget) widget.setPreferenceForKey(true, 'force_refresh');
			Basecamp.request(req_url, Basecamp.get_milestones);
		}
	},


	//
	// ToDos
	//	
	get_todos : function() {
		project_id = $F('projects');
		req_url = url + "/projects/" + project_id + "/todos/lists";
		this.request(req_url, this.show_todos);
	},
	
	show_todos : function(req) {
		this.buildContent(req, "todo-list", 'todos', function(todo){
			var li = document.createElement("li");
			li.setAttribute("class", "drilldown");
			ol.appendChild(li);

			var a = document.createElement("a");
			todo_id = todo.getChildDataByTagName("id");
			a.setAttribute("href", "#");
			a.setAttribute("todo_list_id", todo_id);
			a.onclick = Basecamp.get_todo_list;
			a.innerHTML = todo.getChildDataByTagName("name");
			li.appendChild(a);
		});
	},
	
	get_todo_list : function(event) {
		var element = Event.element(event)
		todo_id = (element) ? element.getAttribute('todo_list_id') : ((window.widget) ? widget.preferenceForKey('todo_list_id') : null);

		if (element && widget) widget.setPreferenceForKey(element.text, 'todo_list_title');
		
		req_url = url + "/todos/list/" + todo_id;
		Basecamp.request(req_url, Basecamp.show_todo_list);
		
		// Undo force_refresh flag if on
		if (widget && widget.preferenceForKey('force_refresh')) widget.setPreferenceForKey(false, 'force_refresh');
	},
	
	show_todo_list : function(req) {
		var upcoming_displayed = false;
		var completed_displayed = false;
		var i = 0;
		var list_id = $(req.responseXML.firstChild).getChildDataByTagName("id");
		
		this.buildContent(req, "todo-item", 'todo-list', function(todo){
			
			// Set Title
			if(ol.childNodes.length==0) {
				var title = (window.widget) ? widget.preferenceForKey('todo_list_title') : null;
				var li_title = document.createElement("li");
				li_title.setAttribute("id", "todo_title");
				li_title.setAttribute("class", "title");
				li_title.innerHTML = title;
				ol.appendChild(li_title);
			}
			
			var todo_id = todo.getChildDataByTagName("id");
			var title = todo.getChildDataByTagName("content");
			var completed = (todo.getChildDataByTagName("completed") == "true") ? true : false;

			// Is the first pending itgem
			if(!upcoming_displayed && !completed) {
				var li_upcoming = document.createElement("li");
				li_upcoming.setAttribute("class", "upcoming");
				li_upcoming.setAttribute("id", "todo_upcoming");
				li_upcoming.innerHTML = "Pending";
				(ol.firstChild.nextSibling) ? ol.insertBefore(li_upcoming, ol.firstChild.nextSibling) : ol.appendChild(li_upcoming);
				upcoming_displayed = true
			}

			// Is the first completed item
			if(!completed_displayed && completed) {
				var li_completed = document.createElement("li");
				li_completed.setAttribute("class", "completed");
				li_completed.setAttribute("id", "todo_completed");
				li_completed.innerHTML = "Completed";
				ol.appendChild(li_completed);
				completed_displayed = true
			}
			
			var li = document.createElement("li");
			completed ? ol.appendChild(li) : ol.insertBefore(li, ol.firstChild.nextSibling.nextSibling);
			
			// Add complete/uncomplete checkbox
			var checkbox = document.createElement("input");
			checkbox.value = todo_id;
			checkbox.setAttribute("type", "checkbox");
			checkbox.setAttribute("id", "todo_"+todo_id);
			checkbox.setAttribute("todo_list_id", list_id);
			checkbox.checked = completed;
			checkbox.onclick = completed ? Basecamp.uncomplete_todo : Basecamp.complete_todo;
			li.appendChild(checkbox);

			var a = document.createElement("a");
			a.setAttribute("href", "#");
			a.setAttribute("onclick", "widget.openURL('"+url+"/projects/"+project_id+"/todos/list/"+list_id+"')");
			a.setAttribute("title", "Go to Basecamp");
			a.innerHTML = title;
			li.appendChild(a);
		});
	},

	complete_todo : function() {
		todo_id = Event.element(event).value;
		if (todo_id > 0) {
			var todo_list_id = Event.element(event).getAttribute("todo_list_id");
			if (window.widget) {
				widget.setPreferenceForKey(todo_list_id,"todo_list_id");
				widget.setPreferenceForKey(true, 'force_refresh');
			}
			req_url = url + "/todos/complete_item/"+todo_id;
			Basecamp.request(req_url, Basecamp.get_todo_list);
		}
	},
	
	uncomplete_todo : function() {
		todo_id = Event.element(event).value;
		if (todo_id > 0) {
			var todo_list_id = Event.element(event).getAttribute("todo_list_id");
			if (window.widget) {
				widget.setPreferenceForKey(todo_list_id,"todo_list_id");
				widget.setPreferenceForKey(true, 'force_refresh');
			}
			req_url = url + "/todos/uncomplete_item/"+todo_id;
			Basecamp.request(req_url, Basecamp.get_todo_list);
		}
	},


	//
	// Projects
	//	
	get_projects : function() {
		req_url = url + "/project/list/";
		this.request(req_url, this.show_projects);
	},
	
	show_projects : function(req) {
		
		// Add options to Projects selector
		select = $('projects');
		this.clearChildren(select);
		
		// Add blank
		var default_select_val = "-- Projects --";
		var option = document.createElement("option");
		option.value = 0;
		option.innerHTML = default_select_val;
		select.appendChild(option);
		
		// Set overlay div
		$(project_selector).innerHTML = default_select_val;
		
		// Iterate through projects and build a usable hash object
		tmp = $A(req.responseXML.getElementsByTagName("project"));
		projects = $H({});
		tmp.each(function(project){
			if(project.getElementsByTagName("status")[0].firstChild.data == "active") {
				company_id = project.getChildByTagName("company").getChildDataByTagName("id");
				project_id = project.getChildDataByTagName("id");
				name = project.getChildDataByTagName("name");
				projectCompanies[project_id] = company_id;
				projects[name] = project_id;
			}
		});
		
		// Iterate through each project sorted by name
		projects.sortBy(function(project){project.key}).reverse().each(function(project){
			var option = document.createElement("option");
			option.value = project.value;
			option.innerHTML = project.key;
			select.appendChild(option);
		});
		
		// Show select prompt
		new Effect.Appear('select_a_project');
		
		// Hide content lists
		$$("#content ol").each(function(ol){ol.hide()});
	},
	
	changeProject : function(select) {
		select = $('projects');
		project_id = select.value;
		alert("Selected: "+select.options[select.selectedIndex].innerHTML);
		$(project_selector).innerHTML = select.options[select.selectedIndex].innerHTML.truncate(14, '...');
		this.clearTabs();
		if (project_id > 0) {
			this.enableTabs();
			this.showContent(null);
		} else {
			this.disableTabs();
			this.showContent($("select_a_project"));
		}
	},

	//
	// Helper Functions
	//
	
	request : function(url, on_success) {
	
		// Hide error pane if visible
		$('error_container').hide();
		
		// Determine is cache is usable
		force_refresh = (widget && widget.preferenceForKey('force_refresh')) ? widget.preferenceForKey('force_refresh') : false;
		retrieve_data = (force_refresh) ? true : !this.is_data_cached(this.url_to_id(url));
		if(retrieve_data) {
			var opts = {

				method: 'get',
				
				requestHeaders: [
					"Cache-Control", "no-cache",
					"Pragma", "no-cache",
					"Authorization", "Basic "+encoded_pwd,
					"Accept", "application/xml",
					"Content-Type", "application/xml"
				],

				// Handle errors
				on404: function(t) { Basecamp.show_error(t) },
				onFailure: function(t) { Basecamp.show_error(t) },

				onLoading: function(t) { 
					$('loading').hide();
					new Effect.Appear($('loading'), {duration: 0.5});
				},

				onComplete: function(t) { 
					scroll_area.refresh();
					$('loading').show();
					new Effect.Fade($('loading'), {duration: 0.5});
					//EventSelectors.start(Rules);
				},
				
				onSuccess: on_success.bind(this)
			};
			
			new Ajax.Request(url, opts);
		}
	},
	
	buildContent : function(req, tagName, listName, displayfunction) {
		id = this.url_to_id(req_url);
		var objects = $A(req.responseXML.getElementsByTagName(tagName));

		ol = $(id);
		// Create new list if not yet created
		if(ol == null) {
			ol = document.createElement("ol");
			ol.setAttribute("id", id);
			$("content").appendChild(ol);
		}

		// Clear list children
		this.clearChildren(ol);

		// Set timestamp of call
		ol.setAttribute("timestamp", new Date());

		// Iterate through miles stones and build list
		objects.each(displayfunction);

		this.showContent(ol);
		
		var i = 0;
		$A(ol.childNodes).each(function(li){
			var classnames = new Element.ClassNames(li);
			if ((i % 2) == 0 && $A(classnames).length == 0) classnames.add("odd");
			i++;
		});

	},

	showPrefs : function() {
		var front = $("front");
		var back = $("back");

		if (window.widget)
			widget.prepareForTransition("ToBack");

		front.setStyle({display:"none"});
		back.setStyle({display:"block"});

		if (window.widget)
			setTimeout ('widget.performTransition();', 0);  
	},
	
	hidePrefs : function() {
		var front = $("front");
		var back = $("back");
		
		// Save preferences
		if(window.widget) {
			// Check url format
			$('url').value = $F('url').replace(url_format, "$2");
			
			widget.setPreferenceForKey((($F('ssl')=='yes') ? 'https' : 'http') + '://' + $F('url'),"url");
			widget.setPreferenceForKey($F('username'),"username");
			widget.setPreferenceForKey($F('password'),"pass");
			widget.setPreferenceForKey($F('refresh'),"refresh");
			//widget.setPreferenceForKey($F('prefGrowl'),"prefGrowl");
			widget.prepareForTransition("ToFront");
		}

		front.setStyle({display:"block"});
		back.setStyle({display:"none"});

		if (window.widget) {
			setTimeout ('widget.performTransition();', 0);
		}
		
		Basecamp.start();
	},

	showContent : function(target) {
		content = $('content')
		$A(content.getElementsByTagName("ol")).each(function(child) { 
			child.hide(); 
		});
		$('select_a_project').hide();

/*		new Effect.Appear(target, {duration: 0.5});*/
		if(target) target.show();
		
		scroll_area.refresh();
	},
	
	show_error : function(t) {
		$('error_message').innerHTML = t.status + ' -- ' + t.statusText;
		new Effect.Appear('error_container');
		$('api_error').show();
	},
	
	goto_acc_api : function() {
		var url = (($F('ssl')=='yes') ? 'https' : 'http') + '://' + $F('url').replace(url_format, "$2");
		if(window.widget) {
			widget.openURL(url+"/global/account");
		}
	},
	
	enableTabs : function() {
		$$('#tabs a').each(function(element) {
			element.show();
		})
	},
	
	disableTabs : function() {
		$$('#tabs a').each(function(element) {
			element.hide();
		})
	},
	
	clearTabs : function() {
		// Clear underline on other tabs
		$$('#tabs a').each(function(tab) {
			tab.setStyle({textDecoration: "none"});
		})
	},
	
	clearChildren : function(target) {
		if(target) {
			$A(target.childNodes).each(function(child) {
				target.removeChild(child);
			})
		}
	},
	
	// Determine if data is stale (older than set number of minutes)
	is_data_cached : function(id) {
		var timestamp = ($(id)) ? $(id).getAttribute("timestamp") : null;
		if (timestamp == null) { 
			return false;
		} else {		
			var data_date	= new Date(timestamp);
			var now_date	= new Date();
			var use_cache	= (((now_date - data_date)/1000)/60) < refresh;

			// Display data if not stale
			if (use_cache) this.showContent($(id));
			
			return use_cache;
		}
	},
	
	url_to_id : function(url) {
		return url.replace(/[:.\/]+/g, "_");
	},
	
	// This code was written by Tyler Akins and has been placed in the
	// public domain.  It would be nice if you left this header intact.
	// Base64 code from Tyler Akins -- http://rumkin.com
	encode64 : function(input) {
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		do {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + 
			keyStr.charAt(enc3) + keyStr.charAt(enc4);
		} while (i < input.length);

		return output;
	},
	
	// Widget Resizing Routines
	begin_resize : function(event) {
		document.addEventListener("mousemove", Basecamp.change_resize, true);
		document.addEventListener("mouseup", Basecamp.end_resize, true);
		resize_inset = {x:(window.innerWidth - event.x), y:(window.innerHeight - event.y)};
		event.stopPropagation();
		event.preventDefault();
	},

	change_resize : function(event) {
		var x = event.x + resize_inset.x;
		var y = event.y + resize_inset.y;
	 
		document.getElementById("resize").style.top = (y-12);
		window.resizeTo(x,y);
	 
		event.stopPropagation();
		event.preventDefault();
	},

	end_resize : function(event) {
		document.removeEventListener("mousemove", Basecamp.change_resize, true);
		document.removeEventListener("mouseup", Basecamp.end_resize, true); 
		
		// Refresh scroll bars
		scroll_area.refresh();
	 
		event.stopPropagation();
		event.preventDefault();
	}

};
Object.extend(Basecamp, Basecamp.prototype);

//
// Extend Prototype Element Object
//
Element.addMethods({
  getChildByTagName: function(element, node_name) {
    element = $(element);
	return $($A(element.childNodes).detect(function(child){ return child.tagName == node_name }));
  },

  getChildDataByTagName: function(element, node_name) {
    element = $(element);
	data = element.getChildByTagName(node_name).firstChild.data;
	
	// Clean up whitespace and carriage returns
	return data.replace(/^\s+/, "").replace(/\s+$/, "");
  }

});

// Apply Rules onload event
Event.observe(window, 'load', function(event){ Basecamp.start(); });

Event.observe(window, 'load', function(event){ 

	// Setup Apple Scroll Area	
	scroll_bar = new AppleVerticalScrollbar($("scroll_bar"));
	scroll_area = new AppleScrollArea($("scroll_area"));
	scroll_area.addScrollbar(scroll_bar);
	scroll_area.scrollsVertically = true;
	scroll_area.scrollsHorizontally = false;
	
	// Setup Apple info button
	done_button = new AppleGlassButton($("done_button"), "Done", Basecamp.hidePrefs);
	info_button = new AppleInfoButton($("info_button"), $("front"), "white", "white", Basecamp.showPrefs);
});

Rules = {
	"#tabs ul li a:click" : function(element, event) {
		if (Basecamp.tabs.keys().toArray().flatten().include(element.innerHTML)) {
			eval(Basecamp.tabs[element.innerHTML]);
			
			// Clear underline on other tabs
			Basecamp.clearTabs();
			
			// Highlight selected tab and set all others to unselected
			element.setStyle({textDecoration: "underline"});
			
		} else {
			alert("Function not found");
		}
	}
};

// Apply Rules onload event
Event.observe(window, 'load', function(event){ EventSelectors.start(Rules); });
