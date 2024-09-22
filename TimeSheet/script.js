let isFirstClick = true;
let addDatesheet = 0;

function addSheet() {
    if (addDatesheet !== 0) {
        alert("Please submit the previous date sheet.");
        return; // Exit if there is a previous sheet
    }

    const tableBody = document.querySelector('#form tbody');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="date" class="form-control" id="date"></td>
        <td>
            <select class="form-select" id="on-leave">
                <option selected value="true">Yes</option>
                <option value="false">No</option>
            </select>
        </td>
        <td colspan="3">
            <div class="activity-container">
                ${generateTimeSheetHTML(0)} 
            </div>
        </td>
    `;

    tableBody.appendChild(row);

    // Call addButtons only on the first click
    if (isFirstClick) {
        addButtons();
        isFirstClick = false; // Disable further button additions
    }
    addDatesheet++;
}

function addButtons() {
    const buttonContainer = document.getElementById('buttonContainer');

    // Create buttons
    const submitButton = document.createElement('button');
    submitButton.classList.add('btn', 'btn-success', 'me-2');
    submitButton.textContent = 'Submit';
    submitButton.addEventListener('click', submitTimesheet);

    // Append buttons to the container
    buttonContainer.appendChild(submitButton);

}

function addTimesheet(button) {
    const activityContainer = button.closest('.activity-container'); 
    const newActivity = document.createElement('div'); 

    newActivity.innerHTML = generateTimeSheetHTML(activityContainer.children.length); // Pass current number of activities
    
    activityContainer.appendChild(newActivity);
}

function generateTimeSheetHTML(ActivityIndex) {
    return `
        <div class="activity-entry">
            <div class="row">
                <div class="col-md-4">
                    <label for="inputProject${ActivityIndex}" class="form-label"><b>Select project</b></label>
                    <select id="inputProject${ActivityIndex}" class="form-select">
                        <option selected>proj1</option>
                        <option>proj2</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="inputSubproject${ActivityIndex}" class="form-label"><b>Select subproject</b></label>
                    <select id="inputSubproject${ActivityIndex}" class="form-select">
                        <option selected>subproj1</option>
                        <option>subproj2</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="inputBatch${ActivityIndex}" class="form-label"><b>Select batch</b></label>
                    <select id="inputBatch${ActivityIndex}" class="form-select">
                        <option selected>batch1</option>
                        <option>batch2</option>
                    </select>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-12">
                    <label for="inputHours${ActivityIndex}" class="form-label"><b>Hours needed</b></label>
                </div>
                <div class="col-md-6">
                    <div class="input-group mb-3">
                        <input type="number" class="form-control" id="inputHours${ActivityIndex}" placeholder="hr" required>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-12">
                    <label for="inputActivity${ActivityIndex}" class="form-label"><b>Activity</b></label>
                    <textarea class="form-control" id="inputActivity${ActivityIndex}" placeholder="Enter activity description" required></textarea>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-12">
                    <button class="btn btn-primary" onclick='addTimesheet(this)'>+</button>
                </div>
            </div>
        </div>`;
}
function submitTimesheet(event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const onLeave = document.getElementById("on-leave").value === "true";

    const activityContainers = document.querySelectorAll(".activity-container");

    const activities = Array.from(activityContainers).flatMap(container =>
        Array.from(container.querySelectorAll('.activity-entry')).map((entry, index) => ({
            id: 0,
            project: entry.querySelector(`#inputProject${index}`).value,
            subProject: entry.querySelector(`#inputSubproject${index}`).value,
            batch: entry.querySelector(`#inputBatch${index}`).value,
            hoursNeeded: entry.querySelector(`#inputHours${index}`).value,
            activity: entry.querySelector(`#inputActivity${index}`).value,
            dateID: 0
        }))
    );

    const data = {
        dateID: 0,
        dateOnly: date,
        onLeave: onLeave,
        sheets: activities
    };

    fetch("http://localhost:5232/api/Dates", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        // Check if the response is okay
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Server responded with status ${response.status}: ${text}`);
            });
        }
    
        // Check if the response body is empty
        if (response.headers.get('Content-Length') === '0') {
            console.log("No content returned from the server.");
            return null; // Handle empty response appropriately
        }
    
        // If there is content, parse it as JSON
        return response.json();
    })
    .then(data => {
        if (data) { // Only log data if it's not null
            console.log("Successfully posted:", data);
            
        } else {
            console.log("No data returned after posting.");
         
        }
        location.reload();
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while submitting data.");
    });

}

document.addEventListener('DOMContentLoaded', () => {
    initializeSubmittedDataTable(); 
    fetchData(); 
});

function initializeSubmittedDataTable() {
    const tableHtml = `
        <table id="submittedData" class="table table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>On Leave</th>
                    <th>Project</th>
                    <th>SubProject</th>
                    <th>Batch</th>
                    <th>Hours Needed</th>
                    <th>Activity</th>
                    <th>Delete edit </th>

                </tr>
            </thead>
            <tbody></tbody> <!-- Data rows will be appended here -->
        </table>`;
    
    document.getElementById('dataContainer').innerHTML = tableHtml;
}

function fetchData() {
    fetch('http://localhost:5232/api/Dates') 
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displaySubmittedData(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while fetching data.");
        });
}

function displaySubmittedData(data) {
    const tableBody = document.querySelector('#submittedData tbody');
    
    tableBody.innerHTML = ''; 

    data.forEach(entry => {
        entry.sheets.forEach(sheet => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${entry.dateOnly}</td>
                <td>${sheet.onLeave ? 'Yes' : 'No'}</td> 
                <td>${sheet.project}</td> 
                <td>${sheet.subProject}</td> 
                <td>${sheet.batch}</td> 
                <td>${sheet.hoursNeeded}</td> 
                <td>${sheet.activity}</td> 
                <td> <button class="btn btn-danger btn-sm" onclick="deleteRow(${entry.dateID}, ${sheet.id}, this)">Delete</button>
                <button class='btn btn-warning btn-sm' onclick='editRow(this)'>Edit</button>
                </td>
                `;
            
            tableBody.appendChild(row);
        });
    });
}


function deleteRow(dateId, sheetId, button) {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this entry?")) {
        return; // Exit if user cancels
    }

    // // Check if dateId and sheetId are defined
    // if (dateId === undefined || sheetId === undefined) {
    //     alert("Invalid date ID or sheet ID.");
    //     return;
    // }

    // Send DELETE request to the backend
   
    fetch(`http://localhost:5232/api/Dates/${dateId}/sheets/${sheetId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        // Check if the response is okay
        if (!response.ok) {
            throw new Error(`Error deleting entry: ${response.status}`);
        }
        
        // Remove the row from the table
        const row = button.closest('tr'); // Find the closest row (tr) to the button
        if (row) {
            row.remove(); // Remove the row from the DOM
        }
        
        alert("Entry deleted successfully.");
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while deleting the entry.");
    });
}
