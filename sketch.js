// Display options:

const CANVAS_WIDTH  = 900//1920;
const CANVAS_HEIGHT = 600//1080;
const FRAME_RATE    = 20;

let settings = {
	size:          1024,
	energy:        3E+4,
	median:        null,
	sigma:         null,
	timeStep:      1E-6,
	stepsPerFrame: 20,
	maxFrames:     1000,
	potential:     null,
	label:         'Double Well',
	momentumZoom:  4,
	scaleFactor:   1,
	underlay:      null,
	dataFile:      'doubleWell',
	imageFile:     null
};

let quantumParticle;
let reset_button;
let slider_median;
let input_potential;
let input_sigma;

function setup() {
	console.log('setup is run')
	frameRate(FRAME_RATE);
	createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	settings.underlay = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
	// background(0);
	input_potential = createInput('x => 2E+4*Math.pow((4*x - 1)*(4*x - 3),2)');
	settings.potential = eval(input_potential.value())
	// input_median = createInput('Median');
	slider_median = createSlider(0, 255, 127);
	settings.median = slider_median.value()/255
	input_sigma = createInput('0.01');
	settings.sigma = float(input_sigma.value())
	reset_button = createButton('Reset')
	reset_button.mousePressed(resetSketch);
	quantumParticle = new Schroedinger(settings);
}

function resetSketch() {
	settings.potential = eval(input_potential.value())
	settings.median = slider_median.value()/255
	settings.sigma = float(input_sigma.value())
	quantumParticle = new Schroedinger(settings);
}

// Draw loop:

function draw() {
	quantumParticle.simulationStep();
}
