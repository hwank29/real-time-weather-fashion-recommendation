function sex_custom() {
    const select = document.getElementById("sex_custom_input");
    const customInput = document.getElementById("customInput");

    if (select.value === "others") {
        customInput.style.display = "block";
    } else {
        customInput.style.display = "none";
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // Get the list element
    const myList = document.getElementById('navbar-list');
  
    // Add a click event listener to the list
    myList.addEventListener('click', function(event) {
      // Check if a list item was clicked
      if (event.target.tagName === 'LI') {
        // Get the URL from the data-url attribute of the clicked list item
        const url = event.target.getAttribute('data-url');
  
        // Redirect to the specified URL
        window.location.href = url;
      }
    });
  });
  