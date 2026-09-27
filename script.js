// Toggles the nav menu open/closed on small screens.
const navToggle = document.getElementById("navToggle");
const nav = document.querySelector(".nav");

navToggle.addEventListener("click", () => {
  nav.classList.toggle("nav--open");
  nav.style.display = nav.classList.contains("nav--open") ? "flex" : "none";
});
