


async function initMap() {
    let apiKey;
    try {
        const response = await fetch('/.netlify/functions/get-api-key');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        console.log("API key response:", text); // Debugging
        const data = JSON.parse(text);
        apiKey = data.apiKey;
    } catch (error) {
        console.error("Failed to load API key:", error);
        apiKey = 'AIzaSyBGNEgkzo-9QKOAvy2fo7fVGSnmqviyKcM'; // Αντικατέστησε με το δικό σου Google Maps API key
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMapCallback`;
    script.async = true;
    document.head.appendChild(script);

    window.initMapCallback = async function() {
        const map = new google.maps.Map(document.getElementById("map"), {
            zoom: 12,
            center: { lat: 38.1356291, lng: 23.8257552 }
        });

        let locations = [];
        try {
            const response = await fetch('locations.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            locations = await response.json();
        } catch (error) {
            console.error("Failed to load locations.json:", error);
            return;
        }

        let currentInfoWindow = null;
        let currentMarker = null;
        const markers = [];

        const defaultIcon = {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(32, 32),
            labelOrigin: new google.maps.Point(16, 40)
        };
        const enlargedIcon = {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(41.6, 41.6),
            labelOrigin: new google.maps.Point(20.8, 52)
        };

        function geocodeAddress(address, callback) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === "OK") {
                    callback(results[0].geometry.location);
                } else {
                    console.error("Geocoding failed for address " + address + ": " + status);
                    callback(null);
                }
            });
        }

        locations.forEach((location, index) => {
            if (location.address && typeof location.address === 'string') {
                geocodeAddress(location.address, (coords) => {
                    if (coords) {
                        const marker = new google.maps.Marker({
                            position: coords,
                            map: map,
                            title: location.title,
                            label: {
                                text: location.label,
                                color: "black",
                                fontSize: "14px",
                                fontWeight: "bold"
                            },
                            icon: defaultIcon,
                            zIndex: 0
                        });
                        markers.push(marker);
                        const infoWindow = new google.maps.InfoWindow({
                            content: `<h3>${location.title}</h3>`
                        });
                        marker.addListener("click", () => {
                            if (currentInfoWindow) {
                                currentInfoWindow.close();
                            }
                            markers.forEach(m => {
                                m.setIcon(defaultIcon);
                                m.setZIndex(0);
                            });
                            marker.setIcon(enlargedIcon);
                            marker.setZIndex(1000);
                            currentMarker = marker;
                            infoWindow.open(map, marker);
                            currentInfoWindow = infoWindow;
                            document.querySelectorAll("#table-body tr").forEach(row => {
                                row.classList.remove("highlighted");
                            });
                            const row = document.getElementById(`row-${location.label}`);
                            if (row) {
                                row.classList.add("highlighted");
                                const tableContainer = document.getElementById("table-container");
                                setTimeout(() => {
                                    const headerHeight = document.querySelector("#locations-table thead").offsetHeight || 0;
                                    console.log("row.offsetTop:", row.offsetTop, "headerHeight:", headerHeight);
                                    tableContainer.scrollTop = row.offsetTop - headerHeight - 20;
                                }, 300);
                            }
                        });
                    }
                });
            }
        });

        map.addListener("click", () => {
            if (currentInfoWindow) {
                currentInfoWindow.close();
                currentInfoWindow = null;
            }
            markers.forEach(m => {
                m.setIcon(defaultIcon);
                m.setZIndex(0);
            });
            currentMarker = null;
            document.querySelectorAll("#table-body tr").forEach(row => {
                row.classList.remove("highlighted");
            });
        });

        const tableBody = document.getElementById("table-body");
        locations.forEach(location => {
            const row = document.createElement("tr");
            row.id = `row-${location.label}`;
            row.innerHTML = `
                <td>${location.label}</td>
                <td>${location.address && typeof location.address === 'string' ? location.address : 'N/A'}</td>
            `;
            row.addEventListener("click", () => {
                const marker = markers.find(m => m.label.text === location.label);
                if (marker) {
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }
                    markers.forEach(m => {
                        m.setIcon(defaultIcon);
                        m.setZIndex(0);
                    });
                    marker.setIcon(enlargedIcon);
                    marker.setZIndex(1000);
                    currentMarker = marker;
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${location.title}</h3>`
                    });
                    infoWindow.open(map, marker);
                    currentInfoWindow = infoWindow;
                    document.querySelectorAll("#table-body tr").forEach(r => {
                        r.classList.remove("highlighted");
                    });
                    row.classList.add("highlighted");
                    map.setCenter(marker.getPosition());
                }
            });
            tableBody.appendChild(row);
        });
    };
}

initMap();
