const indicator = document.getElementById('magicIndicator');
const textWrapper = document.getElementById('indicatorTextWrapper');
const stepSize = 90; // Exactly matches width (90px)

const upload_prof_container_id = document.getElementById("upload_prof_container_id");
const bal_history_container_id = document.getElementById("bal_history_container_id");

function upload_section(index) {
  web_para.active_button_is = "upload_prof_container_id";
  
  indicator.style.transform = `translateX(${index * stepSize}px)`;
  textWrapper.style.transform = `translateX(-${index * stepSize}px)`;
  
  const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.display = 'none';
        card.classList.remove('animate-in');
    });
    
  bal_history_container_id.style.display = "none";
  upload_prof_container_id.style.display = "flex";
  
  upload_prof_container_id.classList.remove("fade_in");
  void upload_prof_container_id.offsetWidth;
  upload_prof_container_id.classList.add("fade_in");
}


function history_section(index) {
  web_para.active_button_is = "bal_history_container_id";
  
  indicator.style.transform = `translateX(${index * stepSize}px)`;
  textWrapper.style.transform = `translateX(-${index * stepSize}px)`;
  
  upload_prof_container_id.style.display = "none";
  bal_history_container_id.style.display = "flex";
  renderHistoryHTML();
}