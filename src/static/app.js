document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `<div class="participants-section"><h5>Participants</h5><ul class="participants-list" style="list-style: none; padding-left: 0;">`;
          details.participants.forEach(email => {
            participantsHTML += `<li style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
              <span>${email}</span>
              <button class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Unregister" style="background: none; border: none; color: #c62828; font-size: 18px; cursor: pointer; margin-left: 8px;">&#128465;</button>
            </li>`;
          });
          participantsHTML += `</ul></div>`;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participants</h5>
              <div class="participants-list empty" style="color:#888;">No participants yet.</div>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll(".delete-participant").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");
          if (!confirm(`Unregister ${decodeURIComponent(email)} from ${decodeURIComponent(activity)}?`)) return;
          try {
            const response = await fetch(`/activities/${activity}/unregister?email=${email}`, { method: "POST" });
            if (response.ok) {
              fetchActivities();
              messageDiv.textContent = "Participant unregistered successfully.";
              messageDiv.className = "message success";
            } else {
              const result = await response.json();
              messageDiv.textContent = result.detail || "Failed to unregister participant.";
              messageDiv.className = "message error";
            }
            messageDiv.classList.remove("hidden");
            setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to unregister participant. Please try again.";
            messageDiv.className = "message error";
            messageDiv.classList.remove("hidden");
            setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
