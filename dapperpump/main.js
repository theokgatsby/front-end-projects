document.addEventListener("DOMContentLoaded", function () {
 fetch("header.html")
  .then((response) => response.text())
  .then((data) => {
   // Insert the header content at the beginning of the body
   document.body.insertAdjacentHTML("afterbegin", data);

   // Re-initialize Bootstrap components (like dropdowns)
   const bootstrapScript = document.createElement("script");
   bootstrapScript.src =
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js";
   document.body.appendChild(bootstrapScript);
  })
  .catch((error) => console.log("Error loading header:", error));
});
