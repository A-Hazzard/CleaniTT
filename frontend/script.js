$(document).ready(function() {
    $('#reportForm').submit(function(e) {
      e.preventDefault();
  
      // Check if geolocation is available
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }
  
      navigator.geolocation.getCurrentPosition(function(position) {
        $('#latitude').val(position.coords.latitude);
        $('#longitude').val(position.coords.longitude);
  
        // Prepare form data for sending
        var formData = new FormData();
        formData.append('description', $('#description').val());
        formData.append('photo', $('#photo')[0].files[0]);
        formData.append('latitude', position.coords.latitude);
        formData.append('longitude', position.coords.longitude);
        // Send the data to the server
        $.ajax({
          url: process.env.SERVER_BACKEND_URL + '/reports', // The URL to your backend endpoint
          type: 'POST',
          data: formData,
          contentType: false,
          processData: false,
          success: function(data) {
            alert('Report submitted successfully!');
          },
          error: function(xhr, status, error) {
            console.log('An error occurred: ' + error, xhr, status);
          }
        });
      });
    });

    // ... existing document.ready and form submit code ...

// Initialize the map
var map = L.map('map').setView([10.6918, -61.2225], 10); // Set this to the default view of your preference

// Set up the OSM layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// script.js

// Function to add a marker to the map for each report
function addReportMarkers() {
  // Use jQuery to make a GET request to your server
  $.getJSON(process.env.SERVER_BACKEND_URL + '/reports', function(reports) {
    // Loop through the array of reports
    reports.forEach(function(report) {
      // Create a marker on the map at the report's location
      var marker = L.marker([report.latitude, report.longitude]).addTo(map);
      
      // Optionally, bind a popup to the marker with the report description and photo
      marker.bindPopup(`<h3>Description</h3><p>${report.description}</p>
                        <img src="${report.photo}" alt="Reported Image" style="width:100%;">`);
    });
  });
}

// Call the function to add markers to the map
addReportMarkers();


  });
  