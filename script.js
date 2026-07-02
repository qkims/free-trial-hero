// Free Trial hero — prototype interactions
const cta = document.querySelector(".cta");

cta?.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("Start for free clicked → would route to signup");
});
