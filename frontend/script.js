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
        console.log($('#photo')[0].files[0], 'is photo')
        formData.append('description', $('#description').val());
        formData.append('photo', $('#photo')[0].files[0]);
        formData.append('latitude', 11.6918);
        formData.append('longitude', -50.2225);
        // Send the data to the server
        $.ajax({
          url: 'https://map-scanner-1.onrender.com/reports', // The URL to your backend endpoint
          type: 'POST',
          data: formData,
          contentType: false,
          processData: false,
          success: function(data) {
            alert('Report submitted successfully!');
             // Re-enable submit button and change its text back
             $('#submitBtn').prop('disabled', false).text('Submit Report');
             alert('Report submitted successfully!');
          },
          error: function(xhr, status, error) {
            console.log('An error occurred: ' + error, xhr, status);
             // Re-enable submit button and change its text back
             $('#submitBtn').prop('disabled', false).text('Submit Report');
             console.log('An error occurred: ' + error, xhr, status);
          }
        });
      });
    });


    var map = L.map('map').setView([10.6918, -61.2225], 10);

    // Use a dark-themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

  // Define a blue dot marker using a divIcon
  var blueDot = L.divIcon({
    className: 'blue-dot',
    html: '<div></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });;

  // Function to add markers to the map
  function addReportMarkers() {
      // Fetch report data from the server
      $.getJSON('https://map-scanner-1.onrender.com/reports', function(reports) {
          reports.forEach(function(report) {
              // Create a marker for each report using the blue dot icon
              L.marker([report.latitude, report.longitude], { icon: blueDot }).addTo(map)
                  .bindPopup(`<h3>Description</h3><p>${report.description}</p>
                               <img src="${report.photo}" alt="Reported Image" style="width:100%;">`);
          });
      });
  }

  // Call the function to add markers to the map
  addReportMarkers();


  });
  