$(document).ready(function () {
  const url = "http://localhost:3000";
  //  const url = 'https://map-scanner-1.onrender.com'

  $("#reportForm").submit(function (e) {
    e.preventDefault();

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        var formData = new FormData();
        formData.append("description", $("#description").val());
        formData.append("latitude", position.coords.latitude.toString());
        formData.append("longitude", position.coords.longitude.toString());

        // Determine which file input is being used
        var fileInput = $("#photoFromCamera").get(0).files.length
          ? $("#photoFromCamera").get(0)
          : $("#photoFromStorage").get(0);

        // Append the selected photo to formData
        if (fileInput.files.length > 0) {
          formData.append("photo", fileInput.files[0]);
        } else {
          alert("Please select a photo.");
          return;
        }
        console.log(JSON.parse(localStorage.getItem("user"))._id);
        // Append waste materials data to formData
        Object.keys(difficultyLevels).forEach((material) => {
          const value = parseInt($(`#${material}`).val()) || 0; // Ensure a valid number
          formData.append(`materials[${material}]`, value);
          formData.append(
            "userID",
            JSON.parse(localStorage.getItem("user"))._id
          );
        });

        $.ajax({
          url: url + "/reports",
          type: "POST",
          data: formData,
          contentType: false,
          processData: false,
          success: function (data) {
            alert("Report submitted successfully!");

            // Reset the form or perform other actions after successful submission
          },
          error: function (xhr, status, error) {
            console.error("An error occurred:", error);
            alert(
              "An error occurred while submitting your report. Please try again."
            );
          },
        });
      },
      function (error) {
        alert("Error getting geolocation: " + error.message);
      }
    );
  });
  const difficultyLevels = {
    metal: 10, // Adjust points based on difficulty
    plastic: 5,
    // Add more materials and their corresponding points as needed
  };

  const wasteMaterialsDiv = $("#wasteMaterials");
  Object.keys(difficultyLevels).forEach((material) => {
    const label = $(`<label for="${material}">${material}</label>`);
    const input = $(
      `<input type="number" id="${material}" name="materials[${material}]" min="0" step="1" value="0">`
    );
    wasteMaterialsDiv.append(label, input);
  });
  // Handle file name display for the camera input
  $("#photoFromCamera").on("change", function () {
    if (this.files && this.files.length > 0) {
      const fileName = this.files[0].name;
      $("#photoName").text(" " + fileName);
    }
  });
  function createMap() {
    var map = L.map("map").setView([10.4918, -61.3225], 11);

    // Use a dark-themed tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);
    // Add a button to zoom to the user's current location
    L.control
      .locate({
        position: "topright", // Position of the button
        flyTo: true, // Smoothly fly to the user's location
        keepCurrentZoomLevel: false, // Zoom to the location if outside current view
        locateOptions: {
          maxZoom: 18, // Max zoom level when flying to the location
        },
      })
      .addTo(map);

    // Define a blue dot marker using a divIcon
    var blueDot = L.divIcon({
      className: "blue-dot",
      html: "<div></div>",
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    $(".search-box").keypress(function (e) {
      if (e.which == 13) {
        // Enter key pressed
        e.preventDefault();
        const query = $(this).val().toLowerCase();
        // Define the bounding box around Trinidad and Tobago
        const viewbox = "-61.95,10.0,-60.2,11.4"; // left,bottom,right,top
        // Construct the URL with the bounding box and bounded parameters
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&viewbox=${viewbox}&bounded=1`;

        $.getJSON(url, function (data) {
          if (data.length > 0) {
            const place = data[0];
            map.flyTo([place.lat, place.lon], 14); // Adjust zoom level as needed
          } else {
            alert("Location not found in Trinidad and Tobago.");
          }
        }).fail(function () {
          alert("Error contacting the geocoding service.");
        });
      }
    });

    function addReportMarkers() {
      // Fetch report data from the server
      $.getJSON(url + "/reports", function (data) {
        const { reports, clusters } = data;
        console.log(reports, clusters);
        // First, add markers for each report
        reports.forEach(function (report) {
          var marker = L.marker([report.latitude, report.longitude], {
            icon: blueDot,
          }).addTo(map)
            .bindPopup(`<h3>Description</h3><p>${report.description}</p>
                          <img src="${report.photo}" alt="Reported Image" style="width:100%;">`);

          // Modify here to use flyTo
          marker.on("click", function (e) {
            map.flyTo(e.latlng, 18); // Use flyTo for a smooth zoom effect
          });
        });

        // Then, visualize the high-priority zones
        clusters.forEach(function (zone) {
          var circle = L.circle([zone.center.latitude, zone.center.longitude], {
            color: "red",
            fillColor: "#f03",
            fillOpacity: 0.5,
            radius: 80, // Adjust the radius as needed
          }).addTo(map);

          // Modify here to use flyTo
          circle.on("click", function (e) {
            map.flyTo(e.latlng, 18); // Use flyTo for a smooth zoom effect
          });
        });
      });
    }

    // Call the function to add markers to the map
    addReportMarkers();
  }

  createMap();
});
