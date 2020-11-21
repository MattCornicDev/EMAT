// mouvemnt 

const card = document.querySelector('.card');
const container = document.querySelector('.container-fluid');
// Items
const title = document.querySelector('.title');
const sneaker = document.querySelector('.sneaker img');
const purchase = document.querySelector('.purchase button');
const description = document.querySelector('.info h3');
const sizes = document.querySelector('.sizes');

// mouvment Animation event

container.addEventListener('mousemove',(e) =>{
let xAxis = (window.innerWidth / 2 - e.pageX) /10;
let yAxis = (window.innerHeight / 2 - e.pageY) /10;
card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

//Animate in
container.addEventListener('mouseenter', (e) =>{
    card.style.transition = "none";
    //popout
    title.style.transform = 'translateZ(50px)';
    sneaker.style.transform = 'translateZ(200px) rotateZ(-45deg)';
    description.style.transform = 'translateZ(125px)';
    sizes.style.transform = 'translateZ(100px)';
    purchase.style.transform = 'translateZ(75px)';
})


// animate Out
container.addEventListener('mouseleave', (e) => {
    card.style.transition = 'all 0.5s ease';
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    //popback
    title.style.transform = 'translateZ(0px)';
    sneaker.style.transform = 'translateZ(0px) rotateZ(0deg)';
    description.style.transform = 'translateZ(0px)';
    sizes.style.transform = 'translateZ(0px)';
    purchase.style.transform = 'translateZ(0px)';
});
