"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form_input--type");
const inputDistance = document.querySelector(".form_input--distance");
const inputDuration = document.querySelector(".form_input--duration");
const inputCadence = document.querySelector(".form_input--cadence");
const inputElevation = document.querySelector(".form_input--elevation");

let map;
let mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDes(){

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.des = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;

  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDes();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDes();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration /60;
    return this.speed;
  }
}




class App {
  constructor() {
    this.workouts = [];
    // Get User's position-
    this._getPosition();

    // Get data from local storage-
    this._getLocalStorage();

    // Attach even handlers-
    form.addEventListener("submit", (e) => this._showForm(e));
    inputType.addEventListener("change", this._toggleElevationField.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          //   console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

          const coords = [latitude, longitude];
          this._loadMap(coords);
        },
        function () {
          alert("Could not get your position.");
        }
      );
    }
  }

  _loadMap(coords) {
    map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on("click", function (mapE) {
      mapEvent = mapE;
      form.classList.remove("hidden");
      inputDistance.focus();
    });

    this.workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    })
  }

  _showForm(e) {
    const validInputs = (...inputs) => {
      return inputs.every(inp => Number.isFinite(inp));
    }
   


    const allPositive = (...inputs) => {
      return inputs.every(inp => inp > 0);
    }


    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = mapEvent.latlng;
    let workout;


    // Check if data is valid

    // If workout running , create running object
    if(type === 'running') {
      const cadence = +inputCadence.value;
      
     if(
      !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
     ){
      return alert("Inputs have to be positive number.")
     }

      workout = new Running( [lat, lng], distance, duration, cadence );
     this.workouts.push(workout);
    }

    // If workout cycling, create cycling object
    if(type === 'cycling') {
      const elevation = +inputElevation.value;

      if(!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert('Inputs have to be positive numbers.')
      
        workout = new Cycling([lat, lng], distance, duration, elevation);
        this.workouts.push(workout);
        // console.log(workout);

    }

    // clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
        
    // Render workout on map as marker
        this._renderWorkoutMarker(workout);
    
    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideform(workout);

    // Set local storage to all workouts
    this._setLocalStorage();


  }

  _hideform(workout){
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value= '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(()=>form.style.display = 'grid', 1000);

  }


  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${workout.des}`)
      .openPopup();
  }
 
 _renderWorkout(workout){
  // console.log(workout.type);
  // console.log(workout.des);
  let html = `
  <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.des}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
  `;

  if(workout.type === 'running'){
    html += `
    <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
  }

  if(workout.type === 'cycling'){
    html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `
  }
  
  // console.log(html);
  form.insertAdjacentHTML('afterend', html);

 }
  _toggleElevationField(e) {
    inputElevation.closest(".form_row").classList.toggle("form_row--hidden");
    inputCadence.closest(".form_row").classList.toggle("form_row--hidden");
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');
    
    if(!workoutEl)return;
    

    const workout = this.workouts.find(work => work.id === workoutEl.dataset.id);

    // console.log(workout);
    map.setView(workout.coords, 13, {
      animate: true,
      pan : {
        duration: 1,
      },
    });
  }
 
  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.workouts));
  }

  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if(!data)return;

    this.workouts = data;

    this.workouts.forEach(work =>{
      this._renderWorkout(work);
      // this._renderWorkoutMarker(work);
    })

  }
  // _newWorkout(){}
}
const app = new App();
