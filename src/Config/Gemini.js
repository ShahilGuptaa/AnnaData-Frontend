async function run(prompt, history) {
  let lat = null;
  let long = null;
  let locationName = null;

  try {
    const position = await new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        const timeoutId = setTimeout(() => {
          reject(new Error("Geolocation request timed out."));
        }, 5000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Geolocation error: ${err.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 5000, // This is a separate timeout for the API call itself
            maximumAge: 0,
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
    lat = position.coords.latitude;
    long = position.coords.longitude;
    console.log("Latitude:", lat, "Longitude:", long);

    // Get the location name using reverse geocoding
    locationName = await getReverseGeocode(lat, long);
    console.log("Location Name:", locationName);
    
  } catch (error) {
    console.warn("Geolocation failed, proceeding without location data:", error.message);
  }

  // Prepend the location name to the prompt if available
  const finalPrompt = prompt;
  
  const apiUrl = process.env.REACT_APP_API_URL;
  const requestBody = {
    query: finalPrompt,
    history: history,
  };

  // Only add latitude and longitude to the request body if they are available
  if (lat !== null && long !== null) {
    requestBody.latitude = lat;
    requestBody.longitude = long;
  }

  try {
    const response = await fetch(`${apiUrl}/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.answer || "No response from agent.";
  } catch (error) {
    console.error("Error calling agent API:", error);
    return "Failed to connect to agent API.";
  }
}

const getReverseGeocode = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Annadata/1.0 (guptashahil1234@gmail.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.address) {
      const { city, village, town, state, country } = data.address;
      const locationName = city || village || town || data.display_name.split(",")[0];
      
      // Return a formatted location string
      return `${locationName}, ${state ? state + ", " : ""}${country || ""}`;
    } else {
      return "Location not found.";
    }
  } catch (e) {
    console.error("Failed to get location name:", e);
    return null; // Return null on failure so the prompt isn't modified
  }
};

export default run;

