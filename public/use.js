const base_url = "https://orni-api.sciolyid.org";
const endpoints = {
	get: {
		url: base_url + "/practice/get",
		parameters: {
			media: "images",
			bw: 0,
			addon: ""
		}
	},
	check: {
		url: base_url + "/practice/check",
		parameters: {
			guess: ""
		}
	},
	skip: {
		url: base_url + "/practice/skip"
	},
	hint: {
		url: base_url + "/practice/hint"
	},
	login: {
		url: base_url + "/user/login",
		parameters: {
			redirect: ""
		}
	},
	logout: {
		url: base_url + "/user/logout",
		parameters: {
			redirect: ""
		}
	},
	profile: {
		url: base_url + "/user/profile"
	}
};

let mediaOptions = {
	media: "images",
	bw: 0,
	addon: ""
};

let stats = {
	correct: 0,
	total: 0,
	streak: 0
};

const qs = (s) => document.querySelector(s)
const qsa = (s) => document.querySelectorAll(s)

function fetchData(url, data, success, statusCode) {
    const fetchUrl = new URL(url);
    if (data) {
        fetchUrl.search = new URLSearchParams(data).toString();
    }
  	const sentinal = new Object()
    fetch(fetchUrl, {
        method: "GET",
        credentials: "include"
    }).then((resp) => {
        if (resp.status in statusCode) {
            statusCode[resp.status]();
        }
        if (resp.ok) {
            return resp.json();
        }
        return Promise.resolve(sentinal)
    }).then((data) => {
      if (data !== sentinal){
        success(data);
      }
    });
}

function updateStats() {
	qs("#correct").textContent = stats.correct + " Correct Birds";
	qs("#total").textContent =
		stats.total +
		" Total Birds (" +
		Math.round((stats.correct / stats.total ? stats.correct / stats.total : "0") * 100) +
		"%)";
	qs("#streak").textContent = stats.streak + " in a row";
}

function getMediaUrl(media, bw, addon) {
	console.log("media url");
	if (media != "images" && media != "songs") {
		media = "images";
	}
	if (bw != 0 && bw != 1) {
		bw = 0;
	}
	if (addon != "female" && addon != "juvenile" && addon != "") {
		addon = "";
	}
	let url = endpoints.get.url + "?media=" + media + "&bw=" + bw + "&addon=" + addon + "&time=" + performance.now();
	console.log(url);
	return { url: url, media: media, bw: bw, addon: addon };
}

function updateStatus(message) {
	qs("div.status").innerHTML = message
}

function pageLoad() {
	fetchData(
		endpoints.profile.url,
		false,
		function(data) {
			qs("#login-button").hidden = true;
			qs("#profile-name").innerText = data.username + "#" + data.discriminator;
			qs("#profile-pic").src = data.avatar_url;
			qs("#profile-button").style.display = "flex";
		},
		{
			403: function() {
				qs("#login-button").hidden = false;
				qs("#profile-dropdown").hidden = true;
				qs("#profile-button").hidden = true;
			}
		}
	);
	setMedia("images");
	updateStats();
	qs("#options-menu").hidden = true;
	qs("#guess").addEventListener("keypress", function(event) {
		if (event.key === "Enter") {
			if (qs("input#guess").value === "") {
				setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon)
			} else {
				check();
			}
		}
	});
}

function setMedia(media, bw, addon) {
	qs("div.status").innerHTML += "<p class='fetching' >Fetching new bird...</p>";
	console.log("set called: " + media + bw + addon);
	let mediaUrl = getMediaUrl(media, bw, addon);
	if (mediaUrl.media == "images") {
		qs("div.media").innerHTML = '<img id="media" alt="bird picture" src=' + mediaUrl.url + " />";
		qs("#media").addEventListener("error", function() {
			updateStatus("Trial Maxed! Log in to continue.");
			qs("#media").hidden = true;
		});
		if (qs("#media").complete) {
			qsa(".fetching").forEach((e)=>(e.remove()));
		} else {
			qs("#media").addEventListener("load", function() {
				qsa(".fetching").forEach((e)=>(e.remove()));
			});
		}
	} else if (mediaUrl.media == "songs") {
		qs("div.media").innerHTML = '<audio id="media" controls src=' + mediaUrl.url + ">Your browser does not support audio.</audio>";
		qs("#media").addEventListener("error", function() {
			updateStatus("Trial Maxed! Log in to continue.");
			qs("#media").hidden = true;
		});
		if (qs("#media").complete) {
			qsa(".fetching").forEach((e)=>(e.remove()));
		} else {
			qs("#media").addEventListener("canplaythrough", function() {
				qsa(".fetching").forEach((e)=>(e.remove()));
			});
		}
	} else {
		throw new Error('invalid media type "' + mediaUrl.media + '"');
	}
}

function check() {
	updateStatus("<p><strong>Checking...</strong></p>");
	fetchData(
		endpoints.check.url,
		{ guess: qs("input#guess").value },
		function(data) {
			stats.total++;
			updateStatus(
				"<p><strong>You were " +
					data.status +
					"!</strong> <br> The correct answer was " +
					data.answer +
					" (<em>" +
					data.sciname +
					"</em>) <a target=\"_blank\" rel=\"noopener\" href=\"" +
					data.wiki +
					"\" >Wiki</a></p>"
			);
			if (data.status == "correct") {
				stats.correct++;
				stats.streak++;
				updateStats();
			} else if (data.status == "incorrect") {
				stats.streak = 0;
				updateStats();
			}
			setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
			qs("input#guess").value = "";
		},
		{
			422: function() {
				updateStatus("<p class='fetching'><strong>An error occurred.</strong></p>");
				setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
			},
			403: function() {
				updateStatus("Trial Maxed! Log in to continue.");
				qs("#media").hidden = true;
			}
		},
	);
}

function skip() {
	updateStatus("<p><strong>Skipping...</strong></p>");
	fetchData(
		endpoints.skip.url,
		false,
		function(data) {
			stats.streak = 0;
			stats.total++;
			updateStats();
			updateStatus(
				"<p><strong>The answer was </strong>" +
					data.answer +
					" (<em>" +
					data.sciname +
					"</em>) <a target=\"_blank\" rel=\"noopener\" href=\"" +
					data.wiki +
					"\" >Wiki</a></p>"
			);
			setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
		},
		{
			422: function() {
				updateStatus("<p class='fetching'><strong>An error occurred.</strong></p>");
				setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
			}
		}
	);
}

function hint() {
	updateStatus("<p><strong>Fetching Hint...</strong></p>");
	fetchData(
		endpoints.hint.url,
		false,
		function(data) {
			updateStatus("<p><strong>The first letter is </strong><em>" + data.hint + "</em>");
		},
		{
			422: function() {
				updateStatus("<p class='fetching'><strong>An error occurred.</strong></p>");
				setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
			}
		}
	);
}

function login() {
	let currentPage = window.location.pathname;
	window.location.href = endpoints.login.url + "?redirect=" + currentPage;
	plausible("Use", {props: {action: "Login"}});
}

function logout() {
	window.location.href = endpoints.logout.url;
}

function updateOptions() {
	mediaOptions.media = qs("#media-type").value;
	mediaOptions.bw = qs("#bw").checked ? 1 : 0;
	mediaOptions.addon = qs("#addons").value;
	qs("#options-menu").hidden = true;
	setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
}

function onMediaTypeChange() {
	if (qs("#media-type").value === "images") {
		qs("#bw-field").hidden = false;
		qs("#addons-field").hidden = false;
	} else {
		qs("#bw-field").hidden = true;
		qs("#addons-field").hidden = true;
	}
}

function toggleProfile() {
	let dropdown = qs("#profile-dropdown");
	dropdown.style.display = dropdown.style.display == "none" ? "flex" : "none";
}

function toggleOptions() {
	let menu = qs("#options-menu")
	menu.hidden = !menu.hidden
}