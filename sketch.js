// Display options:

const CANVAS_WIDTH  = 900//1920;
const CANVAS_HEIGHT = 600//1080;
const FRAME_RATE    = 20;

let settings = {
	gaussian:      false,
	velocity:      0.0,
	median:        0.5, // keep only as a starting point
	size:          256,
	psi:           null,
	timeStep:      1E-6,
	stepsPerFrame: 20,
	maxFrames:     1000,
	potential:     null,
	label:         '',
	momentumZoom:  4,
	scaleFactor:   1,
	underlay:      null,
	dataFile:      '',
	imageFile:     null
};

const potential_k = 12.0;
const potential_a = 0.12;
const potential_barrier_width = 0.1;

let potential_height = 0;
let potential_func = null;

let psi_func = null;

let psi_position = 0;
let psi_velocity = 1;
let psi_variance = 1;
let psi_n = 0;

const harma = 0.05;

const potential_double_well = x => 2E+4*Math.pow((4*x - 1)*(4*x - 3),2)
const potential_harmonic = x => 0.5*(1/(Math.pow(harma,2)))*Math.pow(x-0.5,2)
const potential_inf_square_well = x => 0.0;
let potential_step = x => ((x > 0.5) ? potential_height : 0.0);

const psi_harmonic_gs = x => Math.exp(-(1/(2*Math.pow(harma,2)))*Math.pow(x - 0.5,2));
const psi_harmonic_ex = x => (x-0.5)*Math.exp(-(1/(2*Math.pow(harma,2)))*Math.pow(x - 0.5,2));
let psi_inf_well_n = x => Math.sin((psi_n+1)*Math.PI*x);
let psi_gauss_pulse = x => Math.exp(-Math.pow((x - psi_position)/(2*psi_variance), 2));

let radio_potential;
let radio_psi;

let slider_height;
let slider_position;
let slider_velocity;
let slider_variance;
let input_psi;
let input_n;

let reset_button;
let run_pause_button;
let download_button;

let simulation_paused = true;

let median;
let sigma;

function setup() {
	frameRate(FRAME_RATE);
	const cnvs = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	cnvs.parent('container');
	settings.underlay = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
	// background(0);
	input_potential = createInput('x => 2E+4*Math.pow((4*x - 1)*(4*x - 3),2)');
	input_potential.parent('container_potential_parameters_customized');
	input_potential.attribute('disabled', '');
	const energy = 0.0;
	radio_potential = createRadio('potential');
	const pot_harm = radio_potential.option('harmonic', 'Harmonic');
	pot_harm.checked = true;
	radio_potential.option('double_well', 'Double well');
	radio_potential.option('inf_well', 'Infinite square well');
	radio_potential.option('barrier', 'Barrier');
	radio_potential.option('step', 'Step');
	radio_potential.option('custom', 'Customized');
	radio_potential.changed(potentialSelectEvent);
	radio_potential.parent('container_potentials');
	slider_height = createSlider(0, 255, 127);
	slider_height.attribute('disabled', '');
	slider_height.changed(sliderUpdateEvent);
	slider_height.parent('container_potential_parameters_height');
	radio_psi = createRadio('initial_psi');
	const psi_harm = radio_psi.option('harmonic_ground', 'Harmonic ground state');
	psi_harm.checked = true;
	potential_func = potential_harmonic;
	settings.potential = potential_func;
	radio_psi.option('harmonic_first', 'Harmonic potential 1st excited');
	radio_psi.option('inf_nth', 'Infinite well nth excited state');
	radio_psi.option('gauss', 'Gaussian pulse');
	radio_psi.option('custom', 'Customized');
	radio_psi.changed(psiSelectEvent);
	radio_psi.parent('container_psi');
	slider_position = createSlider(0, 255, 127);
	slider_position.attribute('disabled', '');
	slider_position.changed(sliderUpdateEvent);
	slider_position.parent('container_psi_parameters_position');
	slider_velocity = createSlider(0, 255, 127);
	slider_velocity.attribute('disabled', '');
	slider_velocity.changed(sliderUpdateEvent);
	slider_velocity.parent('container_psi_parameters_velocity');
	slider_variance = createSlider(0, 255, 127);
	slider_variance.attribute('disabled', '');
	slider_variance.changed(sliderUpdateEvent);
	slider_variance.parent('container_psi_parameters_variance');
	input_n = createInput('0');
	input_n.attribute('disabled', '');
	input_n.parent('container_psi_parameters_n');
	input_psi = createInput('x => 2E+4*Math.pow((4*x - 1)*(4*x - 3),2)');
	input_psi.attribute('disabled', '');
	input_psi.parent('container_psi_parameters_customized');
	settings.energy = energy
	reset_button = createButton('Reset');
	reset_button.parent('container_reset')
	reset_button.mousePressed(resetSketch);
	run_pause_button = createButton('Run / Pause');
	run_pause_button.parent('container_run_pause')
	run_pause_button.mousePressed(runPause);
	download_button = createButton('Download');
	download_button.parent('container_download')
	download_button.mousePressed(downloadDataEvent);
	sliderUpdateEvent();
	resetSketch();
}

function resetSketch() {
	potentialSelectEvent();
	psiSelectEvent();
	console.log(potential_func);
	console.log(psi_func);
	settings.potential = potential_func;
	settings.psi = psi_func;
	quantumParticle = new Schroedinger(settings);
}

function runPause() {
	simulation_paused = !simulation_paused;
}

// Draw loop:
let curstep = 0

function draw() {
	if (!simulation_paused) {
		quantumParticle.simulationStep();
		curstep += 1;
	}
}

function potentialSelectEvent() {
	const val = radio_potential.value();
	// handle the wavefunction
	switch (val) {
		case 'harmonic':
			settings.label = 'Harmonic';
			settings.dataFile = 'harmonic';
			potential_func = potential_harmonic;
			break;
		case 'double_well':
			settings.label = 'Double Well';
			settings.dataFile = 'double_well';
			potential_func = potential_double_well;
			break;
		case 'inf_well':
			settings.label = 'Infinite Well';
			settings.dataFile = 'inf_well';
			potential_func = potential_inf_square_well;
			break;
		case 'barrier':
			settings.label = 'Barrier';
			settings.dataFile = 'barrier';
			const potential_barrier = x => ((x > 0.5+potential_barrier_width || x < 0.5-potential_barrier_width) ? 0.0 : potential_height);
			potential_func = potential_barrier;
			break;
		case 'step':
			settings.label = 'Step Potential';
			settings.dataFile = 'step';
			potential_step = x => ((x > 0.5) ? potential_height : 0.0);
			potential_func = potential_step;
			break;
		case 'custom':
			settings.label = 'Custom Potential';
			settings.dataFile = 'custom';
			potential_func = eval(input_potential.value());
			break;
	}
	// handle the UI
	if (val == 'barrier' || val == 'step') {
		potential_height = slider_height.value()/255;
		slider_height.removeAttribute('disabled');
		input_potential.attribute('disabled', '');
	} else if (val == 'custom') {
		slider_height.attribute('disabled', '');
		input_potential.removeAttribute('disabled');
	} else {
		slider_height.attribute('disabled', '');
		input_potential.attribute('disabled', '');
	}
}

function psiSelectEvent() {
	psi_n = parseInt(input_n.value());
	const val = radio_psi.value();
	// handle the wavefunction
	switch (val) {
		case 'harmonic_ground':
			settings.gaussian = false;
			psi_func = psi_harmonic_gs;
			break;
		case 'harmonic_first':
			settings.gaussian = false;
			psi_func = psi_harmonic_ex;
			break;
		case 'inf_nth':
			settings.gaussian = false;
			psi_inf_well_n = x => Math.sin((psi_n+1)*Math.PI*x);
			psi_func = psi_inf_well_n;
			break;
		case 'gauss':
			settings.gaussian = true;
			settings.velocity = psi_velocity
			psi_gauss_pulse = x => Math.exp(-Math.pow((x - psi_position)/(2*psi_variance), 2));
			psi_func = psi_gauss_pulse;
			break;
		case 'custom':
			settings.gaussian = false;
			psi_func = eval(input_psi.value());
			break;
	}
	// handle the UI
	if (val == 'inf_nth') {
		input_n.removeAttribute('disabled');
		slider_position.attribute('disabled', '');
		slider_velocity.attribute('disabled', '');
		slider_variance.attribute('disabled', '');
		input_psi.attribute('disabled', '');
	} else if (val == 'gauss') {
		input_n.attribute('disabled', '');
		slider_position.removeAttribute('disabled');
		slider_velocity.removeAttribute('disabled');
		slider_variance.removeAttribute('disabled');
		psi_position = slider_position.value()/255;
		psi_velocity = slider_velocity.value()/255;
		psi_variance = slider_variance.value()/255;
		input_psi.attribute('disabled', '');
	} else if (val == 'custom') {
		input_n.attribute('disabled', '');
		slider_position.attribute('disabled', '');
		slider_velocity.attribute('disabled', '');
		slider_variance.attribute('disabled', '');
		input_psi.removeAttribute('disabled');
	} else {
		input_n.attribute('disabled', '');
		slider_position.attribute('disabled', '');
		slider_velocity.attribute('disabled', '');
		slider_variance.attribute('disabled', '');
		input_psi.attribute('disabled', '');
	}
}

function sliderUpdateEvent() {
	potential_height = slider_height.value()/255;
	psi_position = slider_position.value()/255;
	psi_velocity = slider_velocity.value()/255;
	psi_variance = slider_variance.value()/255;
	document.getElementById('value_height').innerHTML = Math.round(potential_height * 100) / 100;
	document.getElementById('value_position').innerHTML = Math.round(psi_position * 100) / 100;
	document.getElementById('value_velocity').innerHTML = Math.round(psi_velocity * 100) / 100;
	document.getElementById('value_variance').innerHTML = Math.round(psi_variance * 100) / 100;
}

function downloadDataEvent() {
	saveTable(quantumParticle.dataTable, quantumParticle.dataFile + 'Statictics.csv');
	console.log('-> Statictics data saved as ' + this.dataFile + 'Statictics.csv');
	quantumParticle.saveAverageDensity();
}

function downloadCanvasEvent() {
	saveTable(quantumParticle.dataTable, quantumParticle.dataFile + 'Statictics.csv');
	console.log('-> Statictics data saved as ' + this.dataFile + 'Statictics.csv');
}
