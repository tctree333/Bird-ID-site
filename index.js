Sentry.init({
  dsn: "https://dfe005fb9f5f419c9b849c8c01b73b7a@sentry.io/1866990"
});
const base_url = "https://api.birdid.ga";
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

function updateStats() {
  $("#correct")[0].innerText = stats.correct + " Correct Birds";
  $("#total")[0].innerText =
    stats.total +
    " Total Birds (" +
    Math.round(
      (stats.correct / stats.total ? stats.correct / stats.total : "0") * 100
    ) +
    "%)";
  $("#streak")[0].innerText = stats.streak + " in a row";
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
  let url =
    endpoints.get.url +
    "?media=" +
    media +
    "&bw=" +
    bw +
    "&addon=" +
    addon +
    "&time=" +
    performance.now();
  console.log(url);
  return { url: url, media: media, bw: bw, addon: addon };
}

function updateStatus(message) {
  $("div.status").empty();
  $("div.status").append(message);
}

function pageLoad() {
  $.ajax({
    url: endpoints.profile.url,
    success: function(data) {
      $("#login-button").hide();
      $("#logout-button").show();
      $("#login-text")[0].innerText =
        "Logged in as " + data.username + "#" + data.discriminator;
      $("#login-text").show();
      $("#profile-pic")[0].src = data.avatar_url;
      $("#profile-pic").show();
    },
    statusCode: {
      403: function() {
        $("#login-button").show();
        $("#logout-button").hide();
        $("#login-text").hide();
        $("#profile-pic").hide();
      }
    },
    dataType: "json",
    xhrFields: {
      withCredentials: true
    }
  });
  setMedia("images");
  updateStats();
  $("#optionMenu").hide();
  document
    .getElementById("guess")
    .addEventListener("keypress", function(event) {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        check();
      }
    });
}

function setMedia(media, bw, addon) {
  $("div.status").append("<p class='fetching' >Fetching new bird...</p>");
  console.log("set called: " + media + bw + addon);
  let mediaUrl = getMediaUrl(media, bw, addon);
  if (mediaUrl.media == "images") {
    $("div.media").empty();
    $("div.media").append(
      '<img id="media" alt="bird picture" height="300px" src=' +
        mediaUrl.url +
        " />"
    );
    document.getElementById("media").addEventListener("error", function() {
      updateStatus("Trial Maxed! Log in to continue.");
      $("#media").hide();
    });
    if (document.getElementById("media").complete) {
      $(".fetching").remove();
    } else {
      document.getElementById("media").addEventListener("load", function() {
        $(".fetching").remove();
      });
    }
  } else if (mediaUrl.media == "songs") {
    $("div.media").empty();
    $("div.media").append(
      '<audio id="media" controls src=' +
        mediaUrl.url +
        ">Your browser does not support audio.</audio>"
    );
    document.getElementById("media").addEventListener("error", function() {
      updateStatus("Trial Maxed! Log in to continue.");
      $("#media").hide();
    });
    if (document.getElementById("media").complete) {
      $(".fetching").remove();
    } else {
      document
        .getElementById("media")
        .addEventListener("canplaythrough", function() {
          $(".fetching").remove();
        });
    }
  } else {
    console.log("hmm");
  }
}

function check() {
  updateStatus("<p><strong>Checking...</strong></p>");
  $.ajax({
    url: endpoints.check.url,
    data: { guess: $("input#guess").val() },
    success: function(data) {
      stats.total++;
      updateStatus(
        "<p><strong>You were " +
          data.status +
          "!</strong> <br> The correct answer was " +
          data.answer +
          " (<em>" +
          data.sciname +
          "</em>) <a href=" +
          data.wiki +
          " >Wiki</a></p>"
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
      $("input#guess").val("");
    },
    statusCode: {
      406: function() {
        updateStatus(
          "<p class='fetching'><strong>An error occurred.</strong></p>"
        );
        setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
      },
      403: function() {
        updateStatus("Trial Maxed! Log in to continue.");
        $("#media").hide();
      }
    },
    dataType: "json",
    xhrFields: {
      withCredentials: true
    }
  });
}

function skip() {
  updateStatus("<p><strong>Skipping...</strong></p>");
  $.ajax({
    url: endpoints.skip.url,
    success: function(data) {
      stats.streak = 0;
      stats.total++;
      updateStats();
      updateStatus(
        "<p><strong>The answer was </strong>" +
          data.answer +
          " (<em>" +
          data.sciname +
          "</em>) <a href=" +
          data.wiki +
          " >Wiki</a></p>"
      );
      setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
    },
    statusCode: {
      406: function() {
        updateStatus(
          "<p class='fetching'><strong>An error occurred.</strong></p>"
        );
        setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
      }
    },
    dataType: "json",
    xhrFields: {
      withCredentials: true
    }
  });
}

function hint() {
  updateStatus("<p><strong>Fetching Hint...</strong></p>");
  $.ajax({
    url: endpoints.hint.url,
    success: function(data) {
      updateStatus(
        "<p><strong>The first letter is </strong><em>" + data.hint + "</em>"
      );
    },
    statusCode: {
      406: function() {
        updateStatus(
          "<p class='fetching'><strong>An error occurred.</strong></p>"
        );
        setMedia(mediaOptions.media, mediaOptions.bw, mediaOptions.addon);
      }
    },
    dataType: "json",
    xhrFields: {
      withCredentials: true
    }
  });
}

function login() {
  let currentPage = window.location.pathname;
  window.location.href = endpoints.login.url + "?redirect=" + currentPage;
}

function logout() {
  window.location.href = endpoints.logout.url;
}

function updateOptions() {
  mediaOptions.media = $(".mediaType").val();
  mediaOptions.bw = $(".bw").prop("checked") ? 1 : 0;
  mediaOptions.addon = $(".addons").val();
  $("#optionMenu").hide();
}
