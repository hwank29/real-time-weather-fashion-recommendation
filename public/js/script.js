function sexCustom() {
    const select = document.getElementById("sex");
    const customInput = document.getElementById("customInput");

    if (select.value === "others") {
        customInput.style.display = "block";
    } else {
        customInput.style.display = "none";
    }
}
function checkInput() {
    const age = document.getElementById("age").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (!Number.isInteger(Number(age)) || !validator.isEmail(email) || !password.length > 6) {
      alert("Wrong Input Format. Check Again. Hint: \n Email in email format \n Age in input \n password length longer than 6");
    }
    else {
        alert("You are registered!")
    }}
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
  