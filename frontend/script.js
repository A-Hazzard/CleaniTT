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
          url: 'http://localhost:3000/reports', // The URL to your backend endpoint
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


    var map = L.map('map').setView([10.4918, -61.3225], 11);

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

  function addReportMarkers() {
    // Fetch report data from the server
    $.getJSON('http://localhost:3000/reports', function(data) {
      const { reports, clusters } = data;
      console.log(reports, clusters)
      // First, add markers for each report
      reports.forEach(function(report) {
        var marker = L.marker([report.latitude, report.longitude], { icon: blueDot }).addTo(map)
          .bindPopup(`<h3>Description</h3><p>${report.description}</p>
                       <img src="${report.photo}" alt="Reported Image" style="width:100%;">`);
        
        // Modify here to use flyTo
        marker.on('click', function(e) {
          map.flyTo(e.latlng, 18); // Use flyTo for a smooth zoom effect
        });
      });
  
      // Then, visualize the high-priority zones
      clusters.forEach(function(zone) {
        var circle = L.circle([zone.center.latitude, zone.center.longitude], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 80 // Adjust the radius as needed
        }).addTo(map);
        
        // Modify here to use flyTo
        circle.on('click', function(e) {
          map.flyTo(e.latlng, 18); // Use flyTo for a smooth zoom effect
        });
      });
    });
  }
  
  // Make sure to call this function to add markers and circles to the map
  addReportMarkers();
  

  // Call the function to add markers to the map
  addReportMarkers();


  });
  